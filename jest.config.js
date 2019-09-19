const { join } = require('path')
const rootDir = process.cwd()

/** @type {jest.InitialOptions} */
const config = {
	rootDir,
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/', '/dist/'],
	moduleNameMapper: {
		'^@reflet/(.*)$': join(__dirname, '$1', 'src'),
	},
	// https://jestjs.io/docs/en/configuration#setupfiles-array
	setupFiles: [join(__dirname, 'testing', 'eachfile-setup.ts')],
	globals: {
		'ts-jest': {
			diagnostics: {
				warnOnly: true,
			},
		},
	},
}

module.exports = config
