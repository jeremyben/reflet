import * as mongoose from 'mongoose'
import { PlainKeys, Ref } from './interfaces'

const MetaVirtualPopulate = Symbol('virtual-populate')

/**
 * Defines a writable virtual property (both a getter and a setter),
 * which is properly serialized with `toJson: { virtuals: true }`,
 * and not saved to the database.
 *
 * @example
 * ```ts
 * ＠Model()
 * ＠SchemaOptions({
 *   toObject: { virtuals: true },
 *   toJson: { virtuals: true }
 * })
 * class S3File extends Model.I {
 *   ＠Field(String)
 *   key: string
 *
 *   ＠Virtual
 *   url: string
 * }
 *
 * const photo = await S3File.findOne({ key })
 * photo.url = await getSignedUrl(photo.key)
 * res.send(photo)
 * ```
 *
 * @public
 */
export function Virtual(): Virtual.Decorator

export function Virtual(...args: Parameters<Virtual.Decorator>): void

export function Virtual(target?: string | Object, key?: string | symbol): any {
	// https://github.com/Automattic/mongoose/issues/2642
	// https://github.com/wycats/javascript-decorators/issues/18

	if (target && key) {
		const hiddenProp = Symbol(<string>key)

		return <TypedPropertyDescriptor<any>>{
			set: function (value) {
				;(this as any)[hiddenProp] = value
			},
			get: function () {
				return (this as any)[hiddenProp]
			},
			enumerable: true,
			configurable: true,
		}
	} else {
		return (target: Object, keyy: string) => {
			const hiddenProp = Symbol(keyy)

			return <TypedPropertyDescriptor<any>>{
				set: function (value) {
					;(this as any)[hiddenProp] = value
				},
				get: function () {
					return (this as any)[hiddenProp]
				},
				enumerable: true,
				configurable: true,
			}
		}
	}
}

export namespace Virtual {
	/**
	 * Defines a virtual relationship to populate.
	 * @see https://mongoosejs.com/docs/populate#populate-virtuals
	 *
	 * @example
	 * ```ts
	 * ＠Model()
	 * class Person extends Model.I {
	 *   ＠Field(String)
	 *   name: string
	 *
	 *   ＠Field(String)
	 *   band: string
	 * }
	 *
	 * ＠Model()
	 * ＠SchemaOptions({
	 *   toObject: { virtuals: true },
	 *   toJson: { virtuals: true }
	 * })
	 * class Band extends Model.I {
	 *   ＠Field(String)
	 *   name: string
	 *
	 *   ＠Virtual.Populate<Band, Person>({
	 *     ref: 'Person',
	 *     foreignField: 'band',
	 *     localField: 'name'
	 *   })
	 *   readonly members: string[]
	 * }
	 *
	 * const bands = await Band.find({}).populate('members')
	 * ```
	 * @public
	 */
	export function Populate<Local extends Record<string, any>, Foreign extends Record<string, any>>(
		options: Virtual.Populate.Options<Local, Foreign>
	): Virtual.Populate.Decorator {
		return (target, key) => {
			const fields = getVirtualPopulates(target.constructor)
			fields[<string>key] = options
			Reflect.defineMetadata(MetaVirtualPopulate, fields, target.constructor)
		}
	}

	export namespace Populate {
		/**
		 * Options for `Virtual.Populate` decorator.
		 * @public
		 */
		export interface Options<Local, Foreign> extends RefletMongoose.VirtualOptions {
			ref?: Ref<Local, Foreign>

			refPath?: PlainKeys<Local>

			/**
			 * The local field to populate on.
			 */
			localField: PlainKeys<Local> | ((this: Local, doc: Local) => string)

			/**
			 * The foreign field to populate on.
			 */
			foreignField: PlainKeys<Foreign> | ((this: Local) => string)

			/**
			 * By default, a populated virtual is an array. If you set `justOne`, the populated virtual will be a single doc or `null`.
			 * @default false
			 */
			justOne?: boolean

			/**
			 * If you set this to `true`, `populate()` will set this virtual to the number of populated documents,
			 * as opposed to the documents themselves, using `Query#countDocuments()`.
			 */
			count?: boolean

			/**
			 * Add an extra match condition to `populate()`.
			 */
			match?: mongoose.FilterQuery<Foreign>

			/**
			 * Add a default `limit` to the `populate()` query.
			 */
			limit?: number

			/**
			 * Add a default `skip` to the `populate()` query.
			 */
			skip?: number

			/**
			 * For legacy reasons, `limit` with `populate()` may give incorrect results
			 * because it only executes a single query for every document being populated.
			 *
			 * If you set `perDocumentLimit`, Mongoose will ensure correct `limit` per document
			 * by executing a separate query for each document to `populate()`.
			 *
			 * For example, `.find().populate({ path: 'test', perDocumentLimit: 2 })`
			 * will execute 2 additional queries if `.find()` returns 2 documents.
			 */
			perDocumentLimit?: number

			options?: Omit<mongoose.QueryOptions, 'sort' | 'lean'> & {
				sort?: string | Record<keyof mongoose.LeanDocument<Foreign>, -1 | 1>
				lean?: boolean
			}
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseVirtualPopulate?: never
		}
	}

	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyDecorator & { __mongooseVirtual?: never }
}

/**
 * @internal
 */
export function attachVirtualPopulates(schema: mongoose.Schema<any>, target: object): void {
	const virtualPopulates = getVirtualPopulates(target)

	for (const virtualKey in virtualPopulates) {
		/* istanbul ignore if - routine check */
		if (!virtualPopulates.hasOwnProperty(virtualKey)) continue

		const virtualPopulateOptions = virtualPopulates[virtualKey]
		schema.virtual(virtualKey, virtualPopulateOptions as any)
	}
}

/**
 * @internal
 */
function getVirtualPopulates(target: object): Record<string, Virtual.Populate.Options<any, any>> {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaVirtualPopulate, target))
}
