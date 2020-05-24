import * as ts from 'typescript'
import { Configuration, Linter, Replacement, Rules, LintResult } from 'tslint'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

/**
 * Accepts either a file path or directly a code string.
 */
export const getLintResult = ({ source = '', file = '', Rule, ruleOptions = [] }: Options) => {
	let program: ts.Program | undefined

	// File path given.
	if (file) {
		source = readFileSync(file, 'utf8')
		program = ts.createProgram([file], { strictNullChecks: true })
	}

	// Source given.
	else {
		// prettier-ignore
		file = createHash('md5').update(source).digest('hex') + '.ts'

		const host = ts.createCompilerHost({})
		const getSourceFile0 = host.getSourceFile
		host.getSourceFile = (fileName, langageVersion, onError, shouldCreate) => {
			if (fileName === file) return ts.createSourceFile(file, source, langageVersion, true)
			return getSourceFile0.call(host, fileName, langageVersion, onError, shouldCreate)
		}

		program = ts.createProgram([file], { strictNullChecks: true }, host)
	}

	const linter = new Linter({ fix: false }, program)

	const { ruleName } = Rule.metadata
	const config = Configuration.parseConfigFile({
		rules: { [ruleName]: [true, ...ruleOptions] },
		rulesDirectory: 'src',
	})

	linter.lint(file, source, config)
	const result = linter.getResult() as LintResult & { fixed: string }
	result.fixed = Replacement.applyFixes(
		source,
		result.failures.map((f) => f.getFix()!)
	)

	return result
}

type Options = EitherOne<{ source: string; file: string }> & {
	Rule: typeof Rules.AbstractRule
	/** https://github.com/palantir/tslint/blob/5.20.0/test/configurationTests.ts#L52 */
	ruleOptions?: any[]
}

type EitherOne<T, K = keyof T> = K extends keyof T
	? { [P in K]: T[K] } & Partial<{ [P in Exclude<keyof T, K>]: never }>
	: never
