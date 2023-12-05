const { get } = require('https')
const { join } = require('path')
const { writeFileSync } = require('fs')

const url = 'https://raw.githubusercontent.com/moment/moment-timezone/develop/data/meta/latest.json'

get(url, (res) => {
	let rawData = ''

	res.on('data', (chunk) => {
		rawData += chunk
	})

	res.on('end', () => {
		/** @type {{zones: Record<string, any>}} */
		const data = JSON.parse(rawData)
		const zones = Object.keys(data.zones).sort()

		const jsdoc = `/**\n * @public\n */\n`

		const zoneContent = `${jsdoc}export type Zone = \n\t| ${zones.map(z => `'${z}'`).join('\n\t| ')}\n`

		const zonePath = join(__dirname, 'zone.ignore.ts')
		writeFileSync(zonePath, zoneContent, 'utf8')
	})
})
