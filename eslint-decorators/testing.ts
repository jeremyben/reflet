import * as ts from 'typescript'
import { ESLintUtils, TSESLint } from '@typescript-eslint/experimental-utils'
import { join } from 'path'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

export const { batchedSingleLineTests } = ESLintUtils

const fixtureDirPath = join(__dirname, '__tests__', 'fixtures')

export function readFixture(...paths: string[]) {
	const fixtureFilePath = join(fixtureDirPath, ...paths)
	return readFileSync(fixtureFilePath, 'utf8')
}

export const createRuleTester = (parserOptions: Partial<TSESLint.ParserOptions> = {}) =>
	new ESLintUtils.RuleTester({
		parser: '@typescript-eslint/parser',
		parserOptions: {
			project: './tsconfig.json',
			tsconfigRootDir: fixtureDirPath,
			sourceType: 'module',
			...parserOptions,
		},
	})

/**
 * Accepts either a file path or directly a code string.
 */
export function createIsolatedProgram({ code = '', file = '' }: EitherOne<{ code: string; file: string }>) {
	let program: ts.Program | undefined

	// File path given.
	if (file) {
		code = readFileSync(file, 'utf8')
		program = ts.createProgram([file], { strictNullChecks: true })
	}

	// Code given.
	else {
		file = createHash('md5').update(code).digest('hex') + '.ts'

		const host = ts.createCompilerHost({})
		const getSourceFile0 = host.getSourceFile
		host.getSourceFile = (fileName, langageVersion, onError, shouldCreate) => {
			if (fileName === file) return ts.createSourceFile(file, code, langageVersion, true)
			return getSourceFile0.call(host, fileName, langageVersion, onError, shouldCreate)
		}

		program = ts.createProgram([file], { strictNullChecks: true }, host)
	}

	return program
}

type EitherOne<T, K = keyof T> = K extends keyof T
	? { [P in K]: T[K] } & Partial<{ [P in Exclude<keyof T, K>]: never }>
	: never
