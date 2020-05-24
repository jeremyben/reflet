import { createRuleTester, readFixture } from '../testing'
import rule from '../src'

const ruleTester = createRuleTester()

ruleTester.run('decorator-checker', rule, {
	valid: [
		{
			code: readFixture('basic.ts'),
			// options: [{ file: fixtures('decorators.ts') }],
		},
	],
	invalid: [
		// {
		// 	code: ``,
		// 	errors: [],
		// },
	],
})
