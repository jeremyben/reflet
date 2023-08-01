import { join } from 'path'
import { spawn } from 'child_process'
import { build } from 'tsc-prog'
import * as autocannon from 'autocannon'
import { inspect } from 'util'

const rootDir = 'express-hello-world'
const outDir = `${rootDir}-dist`
const libs = ['plain', 'reflet', 'nest', 'routing-controllers'] as const

type Lib = (typeof libs)[number]
type Result = autocannon.Result & { title: Lib }

build({
	basePath: __dirname,
	configFilePath: 'tsconfig.json',
	compilerOptions: { rootDir, outDir },
	include: [`${rootDir}/**/*`],
})
;(async () => {
	const results: Result[] = []

	for (const lib of libs) {
		const result = await runExpressWith(lib)
		results.push(result)
	}

	console.log('\nFull Results:\n', inspect(results, { compact: true, breakLength: 2000, colors: true }))
})()

async function runExpressWith(lib: Lib) {
	const libPath = join(__dirname, outDir, lib, 'index.js')
	const process = spawn('node', [libPath])

	console.log(`\n===============\n${lib.toUpperCase()}\n===============`)

	await new Promise((resolve) => setTimeout(resolve, 1000))

	return new Promise<Result>((resolve, reject) => {
		const instance = autocannon(
			{
				url: 'http://localhost:3001',
				title: lib,
				connections: 100,
				duration: '2s',
			},
			(err, result) => {
				process.kill()
				if (err) reject(err)
				else resolve(result as Result)
			}
		)

		autocannon.track(instance)
	})
}
