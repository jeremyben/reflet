import { Cron, initCronJobs, CronExpression } from '../src'
import { Job } from '../src/interfaces'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

test('on complete', async () => {
	class Jobs {
		@Cron(CronExpression.EVERY_SECOND)
		@Cron.OnComplete(async () => console.info('complete'))
		async logLastDate(job: Job) {
			job.onComplete!()
		}
	}

	const jobs = initCronJobs(Jobs)

	jobs.startAll()
	await new Promise((r) => setTimeout(r, 1000))
	jobs.stopAll()

	expect(consoleSpy).toHaveBeenNthCalledWith(2, 'complete')
})

// tslint:disable: no-empty
test('timezone and offset', async () => {
	class Jobs {
		@Cron.TimeZone('Europe/Istanbul')
		@Cron(CronExpression.EVERY_SECOND)
		async first() {}

		@Cron.UtcOffset(180)
		@Cron(CronExpression.EVERY_SECOND)
		async second() {}
	}

	const jobs = initCronJobs(Jobs)

	const firstJob = jobs.get('first')
	expect(firstJob.nextDate().offset).toBe(180)
	expect(firstJob.nextDate().zoneName).toBe('Europe/Istanbul')

	const secondJob = jobs.get('second')
	expect(secondJob.nextDate().offset).toBe(180)
	expect(secondJob.nextDate().zoneName).toBe('UTC+3')

	await new Promise((r) => setTimeout(r, 100))
})

test('options decorator', async () => {
	@Cron.Options({
		start: true,
		runOnInit: true,
		unrefTimeout: true,
		onComplete: () => console.info('complete'),
		timeZone: 'Europe/Paris',
	})
	class Jobs {
		@Cron(CronExpression.EVERY_MINUTE)
		yo(job: Job) {
			job.onComplete!()
		}
	}

	const jobs = initCronJobs(Jobs)
	await new Promise((r) => setTimeout(r, 100))
	jobs.stopAll()
	expect(consoleSpy).toHaveBeenNthCalledWith(2, 'complete')
})
