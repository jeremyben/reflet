import { Container, Cron, CurrentJob, Expression, initCronJobs, Job } from '../src'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

test('dynamic jobs can access class context and inherit class decorator behavior', async () => {
	@Cron.TimeZone('Europe/Paris')
	@Cron.RunOnInit
	@Cron.Start
	class Jobs extends Container<Jobs> {
		@Cron(Expression.EVERY_10_MINUTES)
		foo() {
			console.info('foo')
		}

		get baz() {
			return 'baz'
		}
	}

	const jobs = initCronJobs(Jobs)

	jobs.set('bar', {
		cronTime: Expression.EVERY_10_MINUTES,
		onTick() {
			console.info(this.container.get(<any>'bar').name)
			console.info(this.baz)
		},
	})

	await new Promise((r) => setTimeout(r, 50))

	jobs.stopAll()

	expect(consoleSpy).toBeCalledWith('foo')
	expect(consoleSpy).toBeCalledWith('Jobs.bar')
	expect(consoleSpy).toBeCalledWith('baz')
})

test('pass current job', async () => {
	@Cron.RunOnInit
	@Cron.Start
	class Jobs {
		@Cron(Expression.EVERY_10_MINUTES)
		foo(@CurrentJob job: Job) {
			console.info(job.name)
			job.stop()
		}
	}

	const jobs = initCronJobs(Jobs)

	jobs.set('bar', {
		cronTime: Expression.EVERY_10_MINUTES,
		passCurrentJob: true,
		async onTick(job) {
			console.info(job.name)
			job.stop()
		},
	})

	await new Promise((r) => setTimeout(r, 50))

	expect(consoleSpy).toBeCalledWith('Jobs.foo')
	expect(consoleSpy).toBeCalledWith('Jobs.bar')
})
