const { join } = require('path')

/** @type {import('@jest/types').Config.InitialOptionsWithRootDir} */
const config = {
	rootDir: process.cwd(),
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/', '/dist/'],
	moduleNameMapper: {
		'^@reflet/(.*)$': join(__dirname, '$1', 'src'),
	},
	setupFiles: [join(__dirname, 'testing', 'eachfile-setup.ts')],
	coverageReporters: ['json-summary', 'text', 'lcov'],
	transform: {
		// https://kulshekhar.github.io/ts-jest/docs/getting-started/options
		'^.+\\.tsx?$': ['ts-jest', { diagnostics: { warnOnly: true } }],
	},
}

module.exports = config
