import { Cron, Expression, initCronJobs, Initializer, Job } from '../src'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

test('dynamic jobs can access class context and inherit class decorator behavior', async () => {
	class Service {
		user = 'Jeremy'
	}

	@Cron.TimeZone('Europe/Paris')
	@Cron.RunOnInit
	@Cron.Start
	class Jobs extends Initializer<typeof Jobs> {
		constructor(private service: Service) {
			super()
		}

		@Cron(Expression.EVERY_10_MINUTES)
		foo() {
			console.info(this.service.user)
		}

		get baz() {
			return 'baz'
		}
	}

	const jobs = Jobs.init(new Service())

	jobs.set('bar', {
		cronTime: Expression.EVERY_10_MINUTES,
		onTick() {
			console.info(this.baz)
		},
	})

	await new Promise((r) => setTimeout(r, 50))

	jobs.stopAll()

	expect(consoleSpy).toBeCalledWith('Jeremy')
	expect(consoleSpy).toBeCalledWith('baz')
})

test('pass current job', async () => {
	@Cron.RunOnInit
	@Cron.Start
	class Jobs {
		@Cron(Expression.EVERY_10_MINUTES)
		foo(job: Job) {
			console.info(job.name)
			job.stop()
		}
	}

	const jobs = initCronJobs(Jobs)

	jobs.set('bar', {
		cronTime: Expression.EVERY_10_MINUTES,
		async onTick(job) {
			console.info(job.name)
			job.stop()
		},
	})

	await new Promise((r) => setTimeout(r, 50))
	jobs.stopAll()

	expect(consoleSpy).toBeCalledWith('foo')
	expect(consoleSpy).toBeCalledWith('bar')
})
