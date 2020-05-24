import { PropString, PropGeneric, PropNumber } from './decorators'

class Foo {
	@PropString()
	foo: 'foo'

	@PropNumber
	bar = 3

	@PropGeneric({ key: 'value' })
	baz: { key?: 'value' }

	constructor() {
		this.foo = 'foo'
		this.baz = {}
	}
}
