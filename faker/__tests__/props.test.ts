import { factory } from '../src/factory'
import { FakeTemplate } from '../src/fake-template-decorator'
import { FakeName } from '../src/fake-name-decorators'

test.skip('basic', async () => {
	class Basic {
		@(FakeTemplate`Mr ${'name.firstName'} ${'name.lastName'}`)
		name: string

		@FakeName.JobType()
		job: string

		hello() {
			return this.name
		}

		get o() {
			return 5
		}
	}

	const basic = factory(Basic, { locale: 'fr' })
	console.log('basic', basic)
})
