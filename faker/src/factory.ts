import { FakerStatic, Locale } from './interfaces'
import { getMethods } from './faker-meta'

export function factory<T>(
	Class: Function & { prototype: T },
	{ locale = 'en', seedValue }: { locale?: Locale; seedValue?: number }
) {
	const methods = getMethods(Class)

	const data: { [key: string]: any } = {}

	let faker: FakerStatic
	try {
		faker = require(`faker/locale/${locale}`)
	} catch (error) {
		console.warn(`Locale '${locale}' has not been found, fallback to 'en'.`)
		// tslint:disable-next-line: no-submodule-imports
		faker = require(`faker/locale/en`)
	}

	if (seedValue) {
		faker.seed(seedValue)
	}

	for (const key in methods) {
		if (!methods.hasOwnProperty(key)) continue
		const { methodPath, args } = methods[key]
		const [namespace, method] = methodPath

		data[key] = method ? (faker as any)[namespace][method](...args) : faker[namespace as 'fake'](args[0])
	}

	return data
}
