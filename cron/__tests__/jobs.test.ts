import { Cron, initCronJobs, Expression } from '../src'

test('cron jobs', async () => {
	@Cron.TimeZone('Europe/Paris')
	@Cron.Catch((e) => console.warn(e))
	class Jobs {
		@Cron(Expression.EVERY_SECOND)
		@Cron.RunOnInit
		@Cron.OnComplete(async () => console.info('onComplete'))
		async logLastDate(onComplete: () => void) {
			this.yolo()

			onComplete()
		}

		@Cron(Expression.EVERY_SECOND)
		jobContext() {
			throw Error('1')
		}

		@Cron(Expression.MONDAY_TO_FRIDAY_AT_9PM)
		@Cron.Start
		async logOne() {
			this.yolo()
		}

		yo = 'yo'

		private yolo() {
			console.info('yolo', this.yo)
		}
	}

	const jobs = initCronJobs(Jobs)
	jobs.get('jobContext')

	await new Promise((r) => setTimeout(r, 2000))
})
