import { Cron, initCronJobs, Expression, Container } from '../src'

test('cron jobs', async () => {
	@Cron.TimeZone('Europe/Paris')
	@Cron.Catch((e) => console.warn(e))
	class Jobs extends Container<Jobs> {
		@Cron(Expression.EVERY_SECOND)
		@Cron.RunOnInit
		@Cron.OnComplete(async () => console.info('onComplete'))
		async logLastDate(onComplete: () => void) {
			this.yolo()

			console.log(this.container.get('logLastDate'))
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
			console.log(this.container)
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
