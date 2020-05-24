import { join } from 'path'
import { getLintResult } from '../testing'
import { Rule } from './refletHandlerParametersRule'

test.only('', () => {
	const file = join(__dirname, '..', 'fixture-a.ts')

	const { failures, fixed } = getLintResult({ file, Rule })
	const fails = failures.map((f) => f.toJson().failure)

	console.log('fails', fails)
	// console.log(fixed)
})

test('only lint methods with route decorators', () => {
	const source = `
	import { Post } from '@reflet/express'
	import * as reflet from '@reflet/express'
	
	class A {
		@Post()
		a(req: any, res: any, next: any) {}

		@reflet.Get('/')
		b(req: any, res: any) {}
	
		c(req: any, res: any, next: any) {}
	}
	`

	const { errorCount, failures, fixed } = getLintResult({ source, Rule })
	expect(errorCount).toBe(5)

	const fails = failures.map((f) => f.toJson().failure)
	expect(fails[0]).toContain('Request')
	expect(fails[1]).toContain('Response')
	expect(fails[2]).toContain('NextFunction')
	expect(fails[3]).toContain('Request')
	expect(fails[4]).toContain('Response')

	expect(fixed).toContain(
		'a(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction)'
	)
	expect(fixed).toContain('b(req: import("express").Request, res: import("express").Response)')
	expect(fixed).toContain('c(req: any, res: any, next: any)')
})

test('do not lint if reflet is not imported', () => {
	const source = `
	const Get: (path: string) => MethodDecorator = (path) => () => undefined

	class A {
		@Get('/')
		a(req: any, res: any, next: any) {}
	}
	`

	const { errorCount, fixed } = getLintResult({ source, Rule })
	expect(errorCount).toBe(0)
	expect(fixed).toBe(source)
})
