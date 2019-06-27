const { join } = require('path')

// https://kulshekhar.github.io/ts-jest/user/config/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',

	// https://jestjs.io/docs/en/configuration.html#testpathignorepatterns-array-string
	testPathIgnorePatterns: ['/node_modules/', '/__tests__/shared/'],

	// https://jestjs.io/docs/en/configuration#setupfiles-array
	setupFiles: [join(__dirname, 'testing', 'eachfile-setup.ts')],

	globals: {
		'ts-jest': {
			diagnostics: {
				// https://kulshekhar.github.io/ts-jest/user/config/diagnostics
				warnOnly: true,
			},
		},
	},
}
