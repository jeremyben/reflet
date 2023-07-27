import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { ClassType, IsAny, Plain, PlainKeys } from './interfaces'

/** @ts-ignore protected */
type NewDocParameter<T> = IsAny<T['$typeof']> extends true
	? Plain.AllowString.PartialDeep<T>
	: // @ts-ignore protected
	IsAny<ConstructorParameters<T['$typeof']>[0]> extends true
	? Plain.AllowString.PartialDeep<T>
	: // @ts-ignore protected
	  ConstructorParameters<T['$typeof']>[0]

/**
 * Intermediary abstract class with overloaded static methods to properly infer the child class.
 * @public
 */
/** @ts-ignore different types than base */
export declare abstract class ModelI<C extends ClassType = any> extends (class {} as RefletMongoose.Model) {
	constructor(doc?: any, strict?: mongoose.SchemaOptions['strict'])

	/**
	 * Hack to retrieve the constructor type for static methods: `create`, `insertMany` and `replaceOne`.
	 *
	 * ⚠️ **Do not use at runtime.**
	 */
	protected $typeof?: C

	static count<T extends ModelI>(this: ClassType<T>, filter?: mongoose.FilterQuery<T>): mongoose.Query<number, T>

	static countDocuments<T extends ModelI>(
		this: ClassType<T>,
		criteria?: mongoose.FilterQuery<T>
	): mongoose.Query<number, T>

	static create<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options?: mongoose.SaveOptions
	): Promise<T[]>

	// must be after signature with array
	static create<T extends ModelI>(this: ClassType<T>, doc: NewDocParameter<T>): Promise<T>

	static deleteMany<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions
	): mongoose.Query<mongodb.DeleteResult, T>

	static deleteOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions
	): mongoose.Query<mongodb.DeleteResult, T>

	static findById<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		projection?: Projection,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		projection?: Projection,
		options?: mongoose.QueryOptions | any
	): mongoose.Query<T | null, T>

	/**
	 * Shortcut for creating a new Document from existing raw data, pre-saved in the DB.
	 * The document returned has no paths marked as modified initially.
	 */
	static hydrate<T extends ModelI>(this: ClassType<T>, obj: { [key: string]: any }): T

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options: mongoose.InsertManyOptions & { rawResult: true }
	): Promise<mongoose.InsertManyResult<T>>

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options?: mongoose.InsertManyOptions
	): Promise<T[]>

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		doc: NewDocParameter<T>,
		options?: mongoose.InsertManyOptions
	): Promise<T>

	// https://mongoosejs.com/docs/api.html#model_Model.populate
	static populate<T extends ModelI, U extends { [key: string]: any }>(
		this: ClassType<T>,
		docs: U[],
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string
	): Promise<U[]>

	static populate<T extends ModelI, U extends { [key: string]: any }>(
		this: ClassType<T>,
		doc: U,
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string
	): Promise<U>

	static $where<T extends ModelI>(this: ClassType<T>, argument: string | Function): mongoose.Query<T[], T>

	/** Creates a `distinct` query: returns the distinct values of the given `field` that match `filter`. */
	static distinct<T extends ModelI, K extends string & PlainKeys<T>>(
		this: ClassType<T>,
		field: K,
		filter?: mongoose.FilterQuery<T>
	): mongoose.Query<T[K][], T>

	static exists<T extends ModelI>(this: ClassType<T>, filter: mongoose.FilterQuery<T>): Promise<Pick<T, '_id'>>

	static find<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		projection?: Projection,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T[], T>

	static findByIdAndDelete<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findByIdAndRemove<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { rawResult: true }
	): mongoose.Query<mongodb.ModifyResult<T>, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc
	): mongoose.Query<T, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findOneAndDelete<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findOneAndRemove<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findOneAndReplace<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		replacement: NewDocParameter<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc
	): mongoose.Query<T, T>

	static findOneAndReplace<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		replacement?: NewDocParameter<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { rawResult: true }
	): mongoose.Query<mongodb.ModifyResult<T>, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc
	): mongoose.Query<T, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<T | null, T>

	static geoSearch<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.GeoSearchOptions
	): mongoose.Query<T[], T>

	static mapReduce<T extends ModelI, Key, Value>(
		this: ClassType<T>,
		o: mongoose.MapReduceOptions<T, Key, Value>
	): Promise<any>

	static replaceOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		replacement?: NewDocParameter<T>,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static updateMany<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T> | mongoose.UpdateWithAggregationPipeline,
		options?: mongoose.QueryOptions
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static updateOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T> | mongoose.UpdateWithAggregationPipeline,
		options?: mongoose.QueryOptions | null
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static where<T extends ModelI>(this: ClassType<T>, path: string, val?: any): mongoose.Query<T[], T>

	static where<T extends ModelI>(this: ClassType<T>, obj: { [key: string]: any }): mongoose.Query<T[], T>

	static where<T extends ModelI>(this: ClassType<T>): mongoose.Query<T[], T>

	// @ts-ignore
	toObject(options?: mongoose.ToObjectOptions): Plain<this>

	// @ts-ignore
	toJSON(options?: mongoose.ToObjectOptions): Plain<this>
}

/**
 * @public
 */
type Projection = string | Record<string, 1 | 0> | null
