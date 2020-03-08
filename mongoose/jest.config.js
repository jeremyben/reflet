const { join } = require('path')

// https://kulshekhar.github.io/ts-jest/user/config/#advanced
const tsPreset = require('ts-jest/presets').defaults

/** @type {Partial<import('@jest/types').Config.DefaultOptions> & {rootDir: string, preset: string, transform: any}} */
const config = {
	rootDir: process.cwd(),
	preset: '@shelf/jest-mongodb',
	transform: { ...tsPreset.transform },
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/', '/dist/'],
	moduleNameMapper: {
		'^@reflet/(.*)$': join(__dirname, '..', '$1', 'src'),
	},
	// https://jestjs.io/docs/en/configuration#setupfiles-array
	setupFiles: [join(__dirname, '..', 'testing', 'eachfile-setup.ts')],
	coverageReporters: ['json-summary', 'text', 'lcov'],
	globals: {
		'ts-jest': {
			diagnostics: { warnOnly: true },
		},
	},
}

module.exports = config
