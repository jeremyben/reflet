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

		const moment = require('moment-timezone')

		let offsets = []
		for (const zone of zones) {
			offsets.push(moment.tz(zone).format('Z'))
			// offsets.push(moment.tz(zone).utcOffset())
			// offsets.push(Math.floor(moment.tz(zone).utcOffset() / 60))
		}

		offsets = Array.from(new Set(offsets))

		const offsetContent = `${jsdoc}export type Offset = \n\t| ${offsets.map(z => `'${z}'`).join('\n\t| ')}\n`

		const offsetPath = join(__dirname, 'offset.ignore.ts')
		writeFileSync(offsetPath, offsetContent, 'utf8')
	})
})
