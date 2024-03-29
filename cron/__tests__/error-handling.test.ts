import { Cron, CronExpression, initCronJobs } from '../src'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
afterEach(() => consoleErrorSpy.mockClear())
afterAll(() => consoleErrorSpy.mockRestore())

test('stderr or catch', async () => {
	@Cron.RunOnInit
	class Jobs {
		@Cron.Catch<Error>((err, job) => console.error(job.name + err.message))
		@Cron(CronExpression.EVERY_SECOND)
		async oops() {
			throw Error('y')
		}

		@Cron(CronExpression.EVERY_SECOND)
		async oups() {
			throw ReferenceError()
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 50))
	jobs.stopAll()

	expect(consoleErrorSpy).toBeCalledWith('oopsy')
	expect(consoleErrorSpy).not.toBeCalledWith(expect.any(TypeError))
	expect(consoleErrorSpy).toBeCalledWith(expect.any(ReferenceError))
})

test('retry once on specific error and succeed', async () => {
	let thrown = false
	let success = 0

	@Cron.RunOnInit
	@Cron.Retry({ attempts: 1 })
	@Cron.PreRetry((err: any) => err.name === 'TypeError')
	class Jobs {
		@Cron(CronExpression.EVERY_SECOND)
		async throwSome() {
			if (!thrown) {
				thrown = true
				throw TypeError()
			}

			success++
		}

		@Cron(CronExpression.EVERY_SECOND)
		async throwSomeOther() {
			throw ReferenceError()
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 50))
	jobs.stopAll()

	expect(consoleErrorSpy).toBeCalledWith(expect.any(ReferenceError))
	expect(consoleErrorSpy).not.toBeCalledWith(expect.any(TypeError))
	expect(success).toBe(1)
})

test('retry multiple times with delay and succeed', async () => {
	let counter = 0
	let success = 0

	@Cron.Options({
		runOnInit: true,
		retry: { attempts: 3, delay: 100 },
	})
	class Jobs {
		@Cron(CronExpression.EVERY_SECOND)
		async throwSome() {
			if (++counter < 4) {
				throw Error()
			}

			success++
		}
	}

	const jobs = initCronJobs(Jobs)

	await new Promise((r) => setTimeout(r, 800))
	jobs.stopAll()

	expect(success).toBe(1)
})

test('retry with delay cap and fail and catch', async () => {
	let success = 0

	@Cron.Catch((err: Error) => console.error('oh no'))
	@Cron.Retry({ attempts: 2, delay: 100, delayFactor: 3, delayMax: 200 })
	@Cron.RunOnInit
	class Jobs {
		@Cron(CronExpression.EVERY_SECOND)
		async throwSome() {
			throw Error()
			success++
		}
	}

	const jobs = initCronJobs(Jobs)

	await new Promise((r) => setTimeout(r, 800))
	jobs.stopAll()

	expect(success).toBe(0)
	expect(consoleErrorSpy).toBeCalledWith('oh no')
})
