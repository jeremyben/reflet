import { ESLintUtils, TSESLint } from '@typescript-eslint/experimental-utils'
import { join } from 'path'
import { readFileSync } from 'fs'

export const { batchedSingleLineTests } = ESLintUtils

export const createRuleTester = (parserOptions: Partial<TSESLint.ParserOptions> = {}) =>
	new ESLintUtils.RuleTester({
		parser: '@typescript-eslint/parser',
		parserOptions: {
			project: './tsconfig.json',
			tsconfigRootDir: fixturePath(),
			sourceType: 'module',
			...parserOptions,
		},
	})

export function fixturePath(...paths: string[]) {
	return join(__dirname, '__tests__', 'fixtures', ...paths)
}

export function readFixture(...paths: string[]) {
	return readFileSync(fixturePath(...paths), 'utf8')
}
