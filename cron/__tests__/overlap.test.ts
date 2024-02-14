import { Redis } from 'ioredis'
import Redlock, { type Lock } from 'redlock'
import { Cron, Expression, initCronJobs } from '../src'

test('prevent one-second overlap', async () => {
	let success = 0

	@Cron.RunOnInit
	@Cron.Start
	@Cron.PreFire((job) => !job.firing)
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
	const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
	let redisClient: Redis

	beforeAll(() => {
		redisClient = new Redis()
	})
	afterEach(() => consoleWarnSpy.mockClear())
	afterAll(() => {
		consoleWarnSpy.mockRestore()
		redisClient.quit()
	})

	test('simple redlock', async () => {
		const redlock = new Redlock([redisClient], { retryCount: 0 })
		let success = 0

		@Cron.RunOnInit
		@Cron.PreFire<Lock>(async (job, passLock) => {
			try {
				const lock = await redlock.acquire([`job:${job.name}`], 500)
				passLock(lock)
				return !!lock
			} catch (message) {
				console.warn(message)
				return false
			}
		})
		@Cron.PostFire<Lock>(async (job, lock) => {
			if (!lock) return

			try {
				await lock.release()
			} catch (error: any) {
				console.log(error)
			}
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
		expect(consoleWarnSpy).toBeCalledWith(expect.objectContaining({ name: 'ExecutionError' }))
	})

	test('redlock with retry', async () => {
		const redlock = new Redlock([redisClient], { retryCount: 0 })
		let counter = 0
		let success = 0

		@Cron.Start
		@Cron.RunOnInit
		@Cron.PreFire<Lock>(async (job, passMetadata) => {
			try {
				const lock = await redlock.acquire([`job:${job.name}`], 500)
				passMetadata(lock)
				return !!lock
			} catch (error) {
				return false
			}
		})
		@Cron.Retry({ attempts: 4, delay: 500, delayFactor: 2, delayMax: 1000 })
		@Cron.PreRetry<Lock>(async (err, job, attempts, delay, lock) => {
			// If the job fails and retries itself, we extend the lock.
			// console.log(lock, attempts, delay, counter)
			if (lock?.expiration) {
				lock = await lock.extend(delay + 500)
			}

			return true
		})
		@Cron.PostFire<Lock>(async (job, lock) => {
			if (!lock) return
			try {
				await lock.release()
			} catch (error) {
				// console.log(error)
			}
		})
		class Jobs {
			@Cron(Expression.EVERY_SECOND)
			async throwSomeRedlock() {
				if (counter < 4) {
					counter++
					throw Error()
				}
				success++
			}
		}

		const jobsA = initCronJobs(Jobs)
		const jobsB = initCronJobs(Jobs)
		const jobsC = initCronJobs(Jobs)
		await new Promise((r) => setTimeout(r, 4000))
		jobsA.stopAll()
		jobsB.stopAll()
		jobsC.stopAll()

		console.log('success', success)
		expect(counter).toBe(4)
		expect(success).toBeLessThan(5)
	})
})
