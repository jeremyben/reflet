import { Cron, Expression, initCronJobs } from '../src'

test('retry once and succeed', async () => {
	let thrown = false
	let success = 0

	@Cron.RunOnInit
	@Cron.Retry({ maxRetries: 1 })
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		async throwSome() {
			if (!thrown) {
				thrown = true
				throw Error()
			}

			success++
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 50))
	jobs.stopAll()

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
