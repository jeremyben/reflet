import Mongoose from 'mongoose'

/**
 * @private
 */
const MetaField = Symbol('field')

/**
 * @see https://mongoosejs.com/docs/schematypes.html#schematype-options
 * @public
 */
export function Field<T extends SchemaType>(
	field: SchemaField<T> | SchemaField<T>[] | SchemaField<T>[][]
): PropertyDecorator {
	return (target, key) => {
		const fields = getFields(target.constructor)
		fields[<string>key] = field
		Reflect.defineMetadata(MetaField, fields, target.constructor)
	}
}

export namespace Field {
	/**
	 * @see https://mongoosejs.com/docs/schematypes.html#schematype-options
	 * @public
	 */
	export function Type<T extends SchemaType>(field: T | [T] | [[T]]): PropertyDecorator {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = field
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	/**
	 * @see https://mongoosejs.com/docs/schematypes.html#schematype-options
	 * @public
	 */
	export function Nested(field: SchemaFieldNested | SchemaFieldNested[]): PropertyDecorator {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = field
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}
}

/**
 * @private
 */
export function getFields(target: object): { [key: string]: any } {
	// Clone the object to avoid inheritance issues like
	// https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaField, target))
}

/**
 * @public
 */
type SchemaType =
	| StringConstructor
	| NumberConstructor
	| BooleanConstructor
	| DateConstructor
	| MapConstructor
	| typeof Mongoose.Schema.Types.ObjectId
	| typeof Mongoose.Schema.Types.Mixed
	| typeof Mongoose.Schema.Types.Decimal128
	| Mongoose.Schema
// | Object

/**
 * @public
 */
type SchemaFieldNested = {
	[key: string]: SchemaField<SchemaType> | SchemaField<SchemaType>[] | SchemaFieldNested | SchemaFieldNested[]
}

/**
 * @public
 */
type SchemaField<T extends SchemaType> = {
	type: T | [T] | [[T]]

	/**
	 * All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-required) |
	 * [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-required)
	 */
	required?: boolean | string | [true, string] | (() => boolean) | [() => boolean, string]

	/** All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-default) */
	default?: Infer<T> | (() => Infer<T>)

	/** All Types : [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-select) */
	select?: boolean

	/**
	 * All Types: [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-validate) |
	 * [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-validate)
	 */
	validate?: ValidateFn | [ValidateFn, string] | ValidateObj | ValidateObj[]

	/** All Types : [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-get) */
	get?: (value: Infer<T>) => Infer<T>

	/** All Types : [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-set) */
	set?: (value: Infer<T>) => Infer<T>

	/** All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-transform) */
	transform?: <U>(value: Infer<T>) => U

	/** All Types : [Guide](https://mongoosejs.com/docs/guide.html#aliases) */
	alias?: string

	/** All Types : [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-index) */
	index?: boolean

	/** All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-unique) */
	unique?: boolean
	/**
	 * All Types : [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-immutable) |
	 * [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-immutable)
	 */
	immutable?: boolean

	/** All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-cast) */
	cast?: string

	// /** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-lowercase) */
	lowercase?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-uppercase) */
	uppercase?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-trim) */
	trim?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-match) */
	match?: T extends StringConstructor ? RegExp : never

	/** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-minlength) */
	minLength?: T extends StringConstructor ? number : never

	/** String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-maxlength) */
	maxLength?: T extends StringConstructor ? number : never

	/**
	 * - Number : [Option reference](https://mongoosejs.com/docs/api.html#schemanumberoptions_SchemaNumberOptions-min)
	 * - Date : [Option reference](https://mongoosejs.com/docs/api.html#schemadateoptions_SchemaDateOptions-min)
	 */
	min?: T extends NumberConstructor ? number : T extends DateConstructor ? Date : never
	/**
	 * - Number : [Option reference](https://mongoosejs.com/docs/api.html#schemanumberoptions_SchemaNumberOptions-max)
	 * - Date : [Option reference](https://mongoosejs.com/docs/api.html#schemadateoptions_SchemaDateOptions-max)
	 */
	max?: T extends NumberConstructor ? number : T extends DateConstructor ? Date : never

	/**
	 * - String : [Option reference](https://mongoosejs.com/docs/api.html#schemastringoptions_SchemaStringOptions-enum)
	 * - Number : [Option reference](https://mongoosejs.com/docs/api.html#schemanumberoptions_SchemaNumberOptions-enum)
	 * - Array : [Option reference](https://mongoosejs.com/docs/api.html#schemaarrayoptions_SchemaArrayOptions-enum)
	 */
	enum?: T extends StringConstructor ? string[] : T extends NumberConstructor ? number[] : never

	/**
	 * All Types : [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-ref) |
	 * [Method reference](https://mongoosejs.com/docs/api.html#schematype_SchemaType-ref)
	 */
	ref?: T extends typeof Mongoose.Schema.Types.ObjectId ? Function | string : never

	/** Map : [Guide reference](https://mongoosejs.com/docs/schematypes.html#maps) */
	of?: T extends MapConstructor ? SchemaType : never
}

/**
 * @public
 */
type Infer<T extends SchemaType> = T extends NumberConstructor
	? number
	: T extends StringConstructor
	? string
	: T extends BooleanConstructor
	? boolean
	: T extends DateConstructor
	? Date
	: T extends typeof Mongoose.Schema.Types.ObjectId
	? Mongoose.Types.ObjectId
	: Object

/**
 * @public
 */
type ValidateFn = (value: unknown) => boolean | Promise<boolean>

/**
 * @public
 */
type ValidateObj = { validator: ValidateFn; msg: string }
