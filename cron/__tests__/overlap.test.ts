import * as redis from 'redis'
import * as Redlock from 'redlock'
import { Cron, Expression, initCronJobs } from '../src'

test('prevent one-second overlap', async () => {
	let success = 0

	@Cron.RunOnInit
	@Cron.Start
	@Cron.PreventOverlap
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		async throwSome() {
			success++
			await new Promise((r) => setTimeout(r, 2000))
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 1000))
	jobs.stopAll()

	expect(success).toBe(1)
})

describe('redlock', () => {
	const redisClient = redis.createClient()

	const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

	afterEach(() => consoleWarnSpy.mockClear())
	afterAll(() => {
		consoleWarnSpy.mockRestore()
		redisClient.end(true)
	})

	test('simple redlock', async () => {
		let success = 0

		@Cron.RunOnInit
		@Cron.PreventOverlap.RedisLock((job) => {
			const redlock = new Redlock([redisClient], { retryCount: 0 })
			return redlock.lock(`lock:${job.name}`, 500).catch(console.warn)
		})
		class Jobs {
			@Cron(Expression.EVERY_SECOND)
			async getSomeRedlock() {
				success++
			}
		}

		const jobsA = initCronJobs(Jobs)
		const jobsB = initCronJobs(Jobs)
		const jobsC = initCronJobs(Jobs)
		await new Promise((r) => setTimeout(r, 400))
		jobsA.stopAll()
		jobsB.stopAll()
		jobsC.stopAll()

		expect(success).toBe(1)
		expect(consoleWarnSpy).toBeCalledWith(expect.objectContaining({ name: 'LockError', attempts: 1 }))
	})

	test('redlock with retry', async () => {
		let counter = 0
		let success = 0

		@Cron.Options({
			start: true,
			runOnInit: true,
			retry: { attempts: 4, delay: 500, delayFactor: 2, delayMax: 1000 },
			preventOverlap: {
				type: 'redis',
				lock: (job) => {
					const redlock = new Redlock([redisClient], { retryCount: 0 })
					return redlock.lock(`lock:${job.name}`, 500)
				},
			},
		})
		class Jobs {
			@Cron(Expression.EVERY_SECOND)
			async throwSomeRedlock() {
				if (counter < 3) {
					counter++
					throw Error()
				}
				success++
			}
		}

		const jobsA = initCronJobs(Jobs)
		const jobsB = initCronJobs(Jobs)
		await new Promise((r) => setTimeout(r, 3000))
		jobsA.stopAll()
		jobsB.stopAll()

		// console.log('success', success)
		expect(success).toBeLessThan(4)
		expect(counter).toBe(3)
	})
})
