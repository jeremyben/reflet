import { Cron, initCronJobs, Expression } from '../src'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

test('on complete', async () => {
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		@Cron.OnComplete(async () => console.info('complete'))
		async logLastDate(onComplete: () => void) {
			onComplete()
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
		@Cron(Expression.EVERY_SECOND)
		async first() {}

		@Cron.UtcOffset('+03:00')
		@Cron(Expression.EVERY_SECOND)
		async second() {}
	}

	const jobs = initCronJobs(Jobs)

	const firstJob = jobs.get('first')
	expect(firstJob.nextDate().isUtcOffset()).toBe(true)

	const secondJob = jobs.get('second')
	expect(secondJob.nextDate().utcOffset()).toBe(180)

	await new Promise((r) => setTimeout(r, 100))
})
