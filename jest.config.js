const { join } = require('path')

/** @type {import('@jest/types').Config.InitialOptionsWithRootDir} */
const config = {
	rootDir: process.cwd(),
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/', '/dist/'],
	moduleNameMapper: {
		'^@reflet/(.*)$': join(__dirname, '$1', 'src'),
	},
	// https://jestjs.io/docs/en/configuration#setupfiles-array
	setupFiles: [join(__dirname, 'testing', 'eachfile-setup.ts')],
	coverageReporters: ['json-summary', 'text', 'lcov'],
	globals: {
		'ts-jest': {
			diagnostics: { warnOnly: true },
		},
	},
}

module.exports = config
