import { join, relative } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { CoverageSummaryData } from 'istanbul-lib-coverage' // tslint:disable-line: no-implicit-dependencies

// Copy jest coverage summary to project root to be used by dynamic shields.io badges.
// Change absolute paths to relative.

console.log('Versioning coverage summary')

const inputFile = join(process.cwd(), 'coverage', 'coverage-summary.json')
const outputFile = join(process.cwd(), 'coverage-summary.json')

const input: Summary = JSON.parse(readFileSync(inputFile, 'utf8'))
const output: Summary = { total: input.total }

const paths = Object.keys(input).filter((key) => key !== 'total')

for (const path of paths) {
	const relativePath = relative(process.cwd(), path).replace(/\\/g, '/')
	output[relativePath] = input[path]
}

writeFileSync(outputFile, JSON.stringify(output, null, '\t'), 'utf-8')

type Summary = {
	total: CoverageSummaryData
	[path: string]: CoverageSummaryData
}
