import { Container, Cron, Expression, initCronJobs } from '../src'

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
