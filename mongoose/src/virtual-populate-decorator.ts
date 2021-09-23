import * as mongoose from 'mongoose'
import { Decorator, Plain } from './interfaces'

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
 *   ＠PopulateVirtual<Person, Band>({
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
export function PopulateVirtual<TForeign extends object, TLocal extends object>(
	options: VirtualOptions<TForeign, TLocal>
): Decorator.Virtual {
	return (target, key) => {
		const fields = getPopulateVirtuals(target.constructor)
		fields[<string>key] = options
		Reflect.defineMetadata(MetaVirtual, fields, target.constructor)
	}
}

/**
 * @internal
 */
export function attachPopulateVirtuals(schema: mongoose.Schema<any>, target: object): void {
	const populateVirtuals = getPopulateVirtuals(target)

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
function getPopulateVirtuals(target: object): Record<string, VirtualOptions<any, any>> {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaVirtual, target))
}

/**
 * @public
 */
interface VirtualOptions<TForeign extends object, TLocal extends object> {
	ref: keyof RefletMongoose.Ref extends undefined
		? string | (new (...args: any[]) => TForeign)
		: keyof RefletMongoose.Ref | (new (...args: any[]) => TForeign)

	/**
	 * The foreign field to populate on.
	 */
	foreignField: keyof Plain<TForeign>

	/**
	 * The local field to populate on.
	 */
	localField: keyof Plain<TLocal>

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
	match?: mongoose.FilterQuery<TForeign>

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

	options?: {
		sort?: string | Record<keyof Plain<TForeign>, -1 | 1>
		lean?: boolean
	}
}
