// tslint:disable: no-string-throw
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const kebabPkgName = process.argv[2]

if (!kebabPkgName) throw 'Missing package name as argument.'
if (!/^[a-z\-]+$/m.test(kebabPkgName)) throw 'Only lowercase letters.'

const PascalPkgName = kebabPkgName.replace(/^./m, (x) => x.toUpperCase()).replace(/-./g, (x) => x.toUpperCase()[1])

const PACKAGE_JSON = {
	name: `@reflet/${kebabPkgName}`,
	version: '1.0.0',
	author: 'Jeremy Bensimon',
	license: 'MIT',
	repository: `https://github.com/jeremyben/reflet/tree/master/${kebabPkgName}`,
	description: `Well-defined and well-typed ${kebabPkgName} decorators`,
	keywords: [kebabPkgName, 'decorators', 'typescript'],
	main: 'dist/index.js',
	types: 'dist/index.d.ts',
	files: ['dist'],
	publishConfig: {
		access: 'public',
	},
	engines: {
		node: '>=8.10',
	},
	engineStrict: true,
	peerDependencies: {
		'@types/node': '>=8',
		'reflect-metadata': '^0.1.13',
	},
	devDependencies: {},
	scripts: {
		build: 'ts-node -T ../build.ts',
		test: 'jest --config ../jest.config.js',
		'test:watch': 'yarn test --watch --verbose false',
		'test:file': 'yarn test --testPathPattern',
		preversion: 'yarn test --coverage && ts-node -T ../testing/summary.ts && git add coverage-summary.json',
		prepublishOnly: 'yarn run build',
	},
}

const TSCONFIG_JSON = {
	extends: '../tsconfig.json',
	exclude: ['dist'],
}

const LICENSE = `MIT License

Copyright (c) ${new Date().getFullYear()} Jeremy Bensimon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

const PROP_DECORATOR_TS = `const Meta = Symbol('${kebabPkgName}-prop')

/** 
 * @public
 */
export function ${PascalPkgName}Prop(options?: any): PropertyDecorator {
	return (target, key) => {
		const props = get${PascalPkgName}Props(target.constructor)
		props[<string>key] = options
		Reflect.defineMetadata(Meta, props, target.constructor)
	}
}

/** 
 * @internal
 */
export function get${PascalPkgName}Props(target: object): { [key: string]: any } {
	return Object.assign({}, Reflect.getMetadata(Meta, target))
}
`

const METHOD_DECORATOR_TS = `const Meta = Symbol('${kebabPkgName}-method')

/** 
 * @public
 */
export function ${PascalPkgName}Method(options?: any): MethodDecorator {
	return (target, key) => {
		const methods: any[] = Reflect.getMetadata(Meta, target) || []
		methods.push({ key, options })
		Reflect.defineMetadata(Meta, methods, target)
	}
}

/** 
 * @internal
 */
export function get${PascalPkgName}Methods(target: object): any[] {
	return Reflect.getMetadata(Meta, target.prototype)
}
`

const CLASS_DECORATOR_TS = `const Meta = Symbol('${kebabPkgName}-class')

/** 
 * @public
 */
export function ${PascalPkgName}Class(options?: any): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(Meta, options, target)
	}
}

/** 
 * @internal
 */
export function get${PascalPkgName}ClassOptions(target: object): any | undefined {
	return Reflect.getMetadata(Meta, target)
}
`

const CREATE_TS = `import { get${PascalPkgName}Props } from './prop-decorator'
import { get${PascalPkgName}Methods } from './method-decorator'
import { get${PascalPkgName}ClassOptions } from './class-decorator'

/** 
 * @public
 */
export function create(target: Function & { prototype: any }) {
	const props = get${PascalPkgName}Props(target)
	const methods = get${PascalPkgName}Methods(target)
	const classOptions = get${PascalPkgName}ClassOptions(target)

	console.log('props', props)
	console.log('methods', methods)
	console.log('classOptions', classOptions)
}
`

const INDEX_TS = `export { ${PascalPkgName}Prop } from './prop-decorator'

export { ${PascalPkgName}Method } from './method-decorator'

export { ${PascalPkgName}Class } from './class-decorator'

export { create } from './create'
`

const TEST_TS = `import { ${PascalPkgName}Prop, ${PascalPkgName}Class, ${PascalPkgName}Method, create } from '../src'

test('basic', async () => {
	@${PascalPkgName}Class('class-options')
	class Basic {
		@${PascalPkgName}Prop('prop-options')
		prop: any
		
		@${PascalPkgName}Method('method-options')
		method() {}
	}

	create(Basic)
})
`

const pkgFolder = join(__dirname, kebabPkgName)

mkdirSync(pkgFolder)

writeFileSync(join(pkgFolder, 'package.json'), JSON.stringify(PACKAGE_JSON, null, '\t') + '\n')
writeFileSync(join(pkgFolder, 'tsconfig.json'), JSON.stringify(TSCONFIG_JSON, null, '\t') + '\n')
writeFileSync(join(pkgFolder, 'LICENCE'), LICENSE)

mkdirSync(join(pkgFolder, 'src'))
writeFileSync(join(pkgFolder, 'src', 'prop-decorator.ts'), PROP_DECORATOR_TS)
writeFileSync(join(pkgFolder, 'src', 'method-decorator.ts'), METHOD_DECORATOR_TS)
writeFileSync(join(pkgFolder, 'src', 'class-decorator.ts'), CLASS_DECORATOR_TS)
writeFileSync(join(pkgFolder, 'src', 'create.ts'), CREATE_TS)
writeFileSync(join(pkgFolder, 'src', 'index.ts'), INDEX_TS)
mkdirSync(join(pkgFolder, '__tests__'))
writeFileSync(join(pkgFolder, '__tests__', 'basic.test.ts'), TEST_TS)

const README = `# \`@reflet/${kebabPkgName}\` 🌠`
writeFileSync(join(pkgFolder, 'README.MD'), README)

import rootPkgJson = require('./package.json')
rootPkgJson.workspaces.push(kebabPkgName)
writeFileSync(join(__dirname, 'package.json'), JSON.stringify(rootPkgJson, null, '\t') + '\n')
