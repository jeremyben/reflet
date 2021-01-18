const { join } = require('path')

// https://kulshekhar.github.io/ts-jest/user/config/#advanced
const tsjestPreset = require('ts-jest/presets').defaults

/** @type {import('@jest/types').Config.InitialOptionsWithRootDir} */
const config = {
	rootDir: process.cwd(),
	// https://github.com/shelfio/jest-mongodb
	preset: '@shelf/jest-mongodb',
	transform: { ...tsjestPreset.transform },
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/', '/dist/'],
	moduleNameMapper: {
		'^@reflet/(.*)$': join(__dirname, '..', '$1', 'src'),
	},
	// https://jestjs.io/docs/en/configuration#setupfiles-array
	setupFiles: [join(__dirname, '..', 'testing', 'eachfile-setup.ts')],
	setupFilesAfterEnv: [join(__dirname, 'jest-setup-afterenv.ts')],
	coverageReporters: ['json-summary', 'text', 'lcov'],
	globals: {
		'ts-jest': {
			diagnostics: { warnOnly: true },
		},
	},
}

module.exports = config
