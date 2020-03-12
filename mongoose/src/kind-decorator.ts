import { Decorator } from './interfaces'

/**
 * Used by `@Model.Discriminator` to keep a reference of already defined `@Kind`.
 * @internal
 */
export const MetaKind = Symbol('kind')

/**
 * Defines `discriminatorKey` property, **directly** on the discriminator class instead of the root model.
 * @param value - the string stored in the property (defaults to the class name).
 * @see https://mongoosejs.com/docs/discriminators#discriminator-keys
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.I {
 *   ＠Field({ type: String })
 *   name: string
 * }
 *
 * ＠Model.Discriminator(User)
 * class Developer extends User {
 *   ＠Kind
 *   kind: 'Developer'
 * }
 * ```
 * ---
 * @public
 */
export function Kind(value?: string): Decorator.Kind

/**
 * {@inheritDoc (Kind:1)}
 * @public
 */
export function Kind(...args: Parameters<Decorator.Kind>): void

export function Kind(valueOrTarget?: string | Object, key?: string | symbol) {
	if (typeof valueOrTarget === 'string' && !key) {
		return (target: Object, key_: string | symbol) => {
			if (!valueOrTarget) throw Error(`Schema ${target.constructor.name} cannot have an empty @Kind value`)

			Reflect.defineMetadata(MetaKind, [key_, valueOrTarget], target.constructor)
		}
	} else {
		return Reflect.defineMetadata(MetaKind, [key, undefined], valueOrTarget!.constructor)
	}
}

/**
 * @internal
 */
export function getKind(target: object): [string?, string?] {
	return Reflect.getMetadata(MetaKind, target) || []
}
