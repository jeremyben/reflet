import mongoose from 'mongoose'

/**
 * Helps with constructor typing of `@Model` decorated classes.
 *
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠Field({ type: String, required: true })
 *   name: string
 *
 *   constructor(doc?: NewDoc<User>) {
 *     super()
 *   }
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 * ```
 * @public
 */
export type NewDoc<T extends mongoose.Document> = Omit<Partial<T>, keyof mongoose.Document | MethodKeys<T>>

/**
 * @public
 */
export type ConstructorType<T = any> = Function & { prototype: T }

/**
 * @public
 */
export type ConstructorInstance<T extends ConstructorType> = T extends Function & { prototype: infer R } ? R : never

/**
 * @public
 */
type MethodKeys<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

declare module 'mongoose' {
	export interface Schema {
		_userProvidedOptions: SchemaOptions
	}

	export interface MongooseDocument {
		populate<T extends this & Document>(path: keyof NewDoc<T>, callback?: (err: any, res: this) => void): this
		populate<T extends this & Document>(
			path: keyof NewDoc<T>,
			names: string,
			callback?: (err: any, res: this) => void
		): this
	}
}
