import { defineMethod } from './faker-meta'

/**
 * Generator method for combining faker methods based on string input.
 * @see http://marak.github.io/faker.js/faker#-static-fake__anchor
 * @example
 * ```ts
 * class User {
 *   ＠FakeTemplate`${'name.lastName'}, ${'name.firstName'} ${'name.suffix'}`
 *   name: string
 * }
 * ```
 * ---
 * @public
 */
export function FakeTemplate(template: TemplateStringsArray, ...placeholders: NamespaceDotMethod[]): PropertyDecorator {
	const concatenated = template.reduce((result, current, i) => {
		if (placeholders[i]) return result + current + '{{' + placeholders[i] + '}}'
		else return result + current
	}, '')

	return defineMethod({ methodPath: ['fake'], args: [concatenated] })
}

/**
 * @public
 */
type NamespaceDotMethod = 'name.firstName' | 'name.lastName' | 'name.suffix'
