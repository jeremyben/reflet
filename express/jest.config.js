// @ts-ignore
const { name } = require('./package')
const base = require('../jest.config')

module.exports = {
	...base,
	name,
	displayName: name,
}
