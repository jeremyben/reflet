import Mongoose from 'mongoose'

/**
 * @public
 */
export type NewDoc<T extends Mongoose.Document> = Omit<Partial<T>, keyof Mongoose.Document | MethodKeys<T>>

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
	export interface SchemaType {
		discriminator<U extends Document>(name: string, schema: Schema, value?: string): Model<U>
	}

	export interface Schema {
		_userProvidedOptions: SchemaOptions
		discriminatorMapping: { key: string; value: string; isRoot: boolean }
	}
}
