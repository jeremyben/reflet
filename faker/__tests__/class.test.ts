import { factory } from '../src/factory'
import { Faker } from '../src/fake-decorator'
import { lazy } from '../src/lazy-loaded'

test('basic', async () => {
	@Faker<Omit<Basic, 'o' | 'hello'>>({
		name: Faker.fake(''),
	})
	class Basic {
		name: string

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
