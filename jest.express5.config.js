const base = require('./jest.config')

/**
 * Runs the same tests with express 5, installed under the `express5` alias.
 * @type {import('@jest/types').Config.InitialOptionsWithRootDir}
 */
const config = {
	...base,
	moduleNameMapper: {
		...base.moduleNameMapper,
		'^express$': 'express5',
	},
}

module.exports = config
