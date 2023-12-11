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
