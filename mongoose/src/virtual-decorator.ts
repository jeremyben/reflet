import * as mongoose from 'mongoose'
import { PlainKeys, Ref } from './interfaces'

const MetaVirtual = Symbol('virtual')

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
 *   ＠Virtual<Band, Person>({
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
export function Virtual<Local extends Record<string, any>, Foreign extends Record<string, any>>(
	options: Virtual.Options<Local, Foreign>
): Virtual.Decorator {
	return (target, key) => {
		const fields = getVirtuals(target.constructor)
		fields[<string>key] = options
		Reflect.defineMetadata(MetaVirtual, fields, target.constructor)
	}
}

export namespace Virtual {
	/**
	 * Options for `Virtual` decorator.
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
		__mongooseVirtual?: never
	}
}

/**
 * @internal
 */
export function attachVirtuals(schema: mongoose.Schema<any>, target: object): void {
	const populateVirtuals = getVirtuals(target)

	for (const virtualKey in populateVirtuals) {
		/* istanbul ignore if - routine check */
		if (!populateVirtuals.hasOwnProperty(virtualKey)) continue

		const virtualOptions = populateVirtuals[virtualKey]
		schema.virtual(virtualKey, virtualOptions as any)
	}
}

/**
 * @internal
 */
function getVirtuals(target: object): Record<string, Virtual.Options<any, any>> {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaVirtual, target))
}
