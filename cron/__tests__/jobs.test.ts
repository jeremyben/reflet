import { Cron, initCronJobs, Expression } from '../src'

test('cron jobs', async () => {
	@Cron.Catch((e) => console.warn(e))
	class Jobs extends Cron.Container<Jobs> {
		@Cron(Expression.EVERY_5_SECONDS)
		@Cron.RunOnInit()
		@Cron.OnComplete(async () => console.info('onComplete'))
		async logLastDate(onComplete: () => void) {
			this.yolo()
			console.log(this.get('logLastDate').lastDate())
			onComplete()
		}

		@Cron(Expression.EVERY_SECOND)
		jobContext() {
			throw Error('1')
		}

		@Cron(Expression.EVERY_5_SECONDS)
		@Cron.RunOnInit()
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

	await new Promise((r) => setTimeout(r, 1000))
})
