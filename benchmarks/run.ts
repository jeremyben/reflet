import { join } from 'path'
import { spawn } from 'child_process'
import { build } from 'tsc-prog'
import autocannon from 'autocannon'

const rootDir = 'express-hello-world'
const outDir = `${rootDir}-dist`
const libs = ['plain', 'reflet', 'nest', 'routing-controllers'] as const
type Result = autocannon.Result & { title: typeof libs[number] }

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

	console.log(results)
})()

async function runExpressWith(lib: typeof libs[number]) {
	const libPath = join(__dirname, outDir, lib, 'index.js')
	const process = spawn('node', [libPath])

	console.log(`\n===============\n${lib.toUpperCase()}\n===============\n`)

	await new Promise((resolve) => setTimeout(resolve, 1000))

	return new Promise<Result>((resolve, reject) => {
		const instance = autocannon(
			{
				url: 'http://localhost:3001',
				title: lib,
				connections: 100,
				duration: '10s',
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
