import { Cron, Expression, initCronJobs } from '../src'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
afterEach(() => consoleErrorSpy.mockClear())
afterAll(() => consoleErrorSpy.mockRestore())

test('catch', async () => {
	@Cron.Catch((err: Error) => console.error('oops'))
	@Cron.RunOnInit
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		async throwSome() {
			throw Error()
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 50))
	jobs.stopAll()

	expect(consoleErrorSpy).toBeCalledWith('oops')
	expect(consoleErrorSpy).not.toBeCalledWith(expect.any(Error))
})

test('retry once on specific error and succeed', async () => {
	let thrown = false
	let success = 0

	@Cron.RunOnInit
	@Cron.Retry({ maxRetries: 1, condition: (err: Error) => err.name === 'TypeError' })
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		async throwSome() {
			if (!thrown) {
				thrown = true
				throw TypeError()
			}

			success++
		}

		@Cron(Expression.EVERY_SECOND)
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

	@Cron.RunOnInit
	@Cron.Retry({ maxRetries: 3, delay: 100, delayFactor: 2, delayMax: 1000 })
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		async throwSome() {
			if (++counter < 4) {
				throw Error()
			}

			success++
		}
	}

	const jobs = initCronJobs(Jobs)

	await new Promise((r) => setTimeout(r, 1000))
	jobs.stopAll()

	expect(success).toBe(1)
})
