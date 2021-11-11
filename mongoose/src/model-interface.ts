import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { ClassType, IsAny, Plain, PlainKeys } from './interfaces'
import { PipelineStage } from './pipeline-interface'

/** @ts-ignore protected */
type NewDocParameter<T extends ModelI> = IsAny<T['$typeof']> extends true
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
export declare abstract class ModelI<C extends ClassType = any> extends (class {} as RefletMongoose.Model) {
	constructor(doc?: any, strict?: mongoose.SchemaOptions['strict'])

	/**
	 * Hack to retrieve the constructor type for static methods: `create`, `insertMany` and `replaceOne`.
	 *
	 * ⚠️ **Do not use at runtime.**
	 */
	protected $typeof?: C

	static aggregate<R>(pipeline?: PipelineStage[], options?: mongodb.AggregateOptions): mongoose.Aggregate<R[]>

	static aggregate<R>(pipeline: PipelineStage[], callback: mongoose.Callback<R[]>): Promise<R[]>

	static aggregate<R>(
		pipeline: PipelineStage[],
		options: mongodb.AggregateOptions,
		callback: mongoose.Callback<R[]>
	): Promise<R[]>

	static count<T extends ModelI>(callback?: mongoose.Callback<number>): mongoose.Query<number, T>

	static count<T extends ModelI>(
		filter: mongoose.FilterQuery<T>,
		callback?: mongoose.Callback<number>
	): mongoose.Query<number, T>

	static countDocuments<T extends ModelI>(
		this: ClassType<T>,
		callback?: mongoose.Callback<number>
	): mongoose.Query<number, T>

	static countDocuments<T extends ModelI>(
		this: ClassType<T>,
		criteria: mongoose.FilterQuery<T>,
		callback?: mongoose.Callback<number>
	): mongoose.Query<number, T>

	static create<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options?: mongoose.SaveOptions
	): Promise<T[]>

	// todo: remove callback signature ?
	static create<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		callback: mongoose.Callback<T[]>
	): void

	// must be after signature with array
	static create<T extends ModelI>(this: ClassType<T>, doc: NewDocParameter<T>): Promise<T>

	// todo: remove rest signature (confuses the compiler) ?
	static create<T extends ModelI>(this: ClassType<T>, ...docs: NewDocParameter<T>[]): Promise<T[]>

	// todo: remove callback signature ?
	static create<T extends ModelI>(this: ClassType<T>, doc: NewDocParameter<T>, callback: mongoose.Callback<T>): void

	static deleteMany<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions,
		callback?: mongoose.CallbackWithoutResult
	): mongoose.Query<mongodb.DeleteResult, T>

	// todo: remove callback signature without options ?
	static deleteMany<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		callback: mongoose.CallbackWithoutResult
	): mongoose.Query<mongodb.DeleteResult, T>

	static deleteOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions,
		callback?: mongoose.CallbackWithoutResult
	): mongoose.Query<mongodb.DeleteResult, T>

	// todo: remove callback signature without options ?
	static deleteOne<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		callback: mongoose.CallbackWithoutResult
	): mongoose.Query<mongodb.DeleteResult, T>

	static findById<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		projection?: Projection,
		options?: mongoose.QueryOptions | null,
		callback?: mongoose.Callback<T | null>
	): mongoose.Query<T | null, T>

	static findOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		projection?: Projection,
		options?: mongoose.QueryOptions | any,
		callback?: mongoose.Callback<T | null>
	): mongoose.Query<T | null, T>

	/**
	 * Shortcut for creating a new Document from existing raw data, pre-saved in the DB.
	 * The document returned has no paths marked as modified initially.
	 */
	static hydrate<T extends ModelI>(this: ClassType<T>, obj: { [key: string]: any }): T

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options: mongoose.InsertManyOptions & { rawResult: true },
		callback?: mongoose.Callback<T[]>
	): Promise<mongoose.InsertManyResult>

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		docs: NewDocParameter<T>[],
		options?: mongoose.InsertManyOptions,
		callback?: mongoose.Callback<T[]>
	): Promise<T[]>

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		doc: NewDocParameter<T>,
		options: mongoose.InsertManyOptions & { rawResult: true },
		callback?: (error: any, doc: T) => void
	): Promise<mongoose.InsertManyResult>

	static insertMany<T extends ModelI>(
		this: ClassType<T>,
		doc: NewDocParameter<T>,
		options?: mongoose.InsertManyOptions,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// https://mongoosejs.com/docs/api.html#model_Model.populate
	static populate<T extends ModelI, U extends { [key: string]: any }>(
		this: ClassType<T>,
		docs: U[],
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string,
		callback?: mongoose.Callback<U[]>
	): Promise<U[]>

	static populate<T extends ModelI, U extends { [key: string]: any }>(
		this: ClassType<T>,
		doc: U,
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string,
		callback?: mongoose.Callback<U>
	): Promise<U>

	static watch<T>(
		this: ClassType<T>,
		pipeline?: Array<Record<string, unknown>>,
		options?: mongodb.ChangeStreamOptions
	): mongodb.ChangeStream<T>

	static $where<T extends ModelI>(this: ClassType<T>, argument: string | Function): mongoose.Query<T[], T>

	/** Creates a `distinct` query: returns the distinct values of the given `field` that match `filter`. */
	static distinct<T extends ModelI, K extends string & PlainKeys<T>>(
		this: ClassType<T>,
		field: K,
		filter?: mongoose.FilterQuery<T>,
		callback?: mongoose.Callback<number>
	): mongoose.Query<T[K][], T>

	static exists<T extends ModelI>(this: ClassType<T>, filter: mongoose.FilterQuery<T>): Promise<boolean>

	// todo: remove callback signature ?
	static exists<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		callback: mongoose.Callback<boolean>
	): void

	// static find<T extends MongooseModel>(this: ClassType<T>, callback?: mongoose.Callback<T[]>): mongoose.Query<T[], T>

	static find<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		callback?: mongoose.Callback<T[]>
	): mongoose.Query<T[], T>

	static find<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		projection?: Projection,
		options?: mongoose.QueryOptions | null,
		callback?: mongoose.Callback<T[]>
	): mongoose.Query<T[], T>

	static findByIdAndDelete<T extends ModelI>(
		this: ClassType<T>,
		id?: mongodb.ObjectId | string,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findByIdAndRemove<T extends ModelI>(
		this: ClassType<T>,
		id?: mongodb.ObjectId | any,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { rawResult: true },
		callback?: (err: mongoose.CallbackError, doc: any, res: any) => void
	): mongoose.Query<mongodb.ModifyResult<T>, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: mongoose.CallbackError, doc: T, res: any) => void
	): mongoose.Query<T, T>

	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id?: mongodb.ObjectId | string,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	// todo: remove callback signature without options ?
	static findByIdAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		callback: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndDelete<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndRemove<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndReplace<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		replacement: NewDocParameter<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: mongoose.CallbackError, doc: T, res: any) => void
	): mongoose.Query<T, T>

	static findOneAndReplace<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		replacement?: NewDocParameter<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { rawResult: true },
		callback?: (err: mongoose.CallbackError, doc: any | null, res: any) => void
	): mongoose.Query<mongodb.ModifyResult<T>, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: mongoose.CallbackError, doc: T, res: any) => void
	): mongoose.Query<T, T>

	static findOneAndUpdate<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: mongoose.CallbackError, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static geoSearch<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.GeoSearchOptions,
		callback?: mongoose.Callback<T[]>
	): mongoose.Query<T[], T>

	static mapReduce<T extends ModelI, Key, Value>(
		this: ClassType<T>,
		o: mongoose.MapReduceOptions<T, Key, Value>,
		callback?: mongoose.Callback
	): Promise<any>

	static remove<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		callback?: mongoose.CallbackWithoutResult
	): mongoose.Query<mongodb.DeleteResult, T>

	static replaceOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		replacement?: NewDocParameter<T>,
		options?: mongoose.QueryOptions | null,
		callback?: mongoose.Callback<mongoose.UpdateWriteOpResult>
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static update<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T> | mongoose.UpdateWithAggregationPipeline,
		options?: mongoose.QueryOptions | null,
		callback?: mongoose.Callback
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static updateMany<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T> | mongoose.UpdateWithAggregationPipeline,
		options?: mongoose.QueryOptions,
		callback?: mongoose.Callback
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static updateOne<T extends ModelI>(
		this: ClassType<T>,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T> | mongoose.UpdateWithAggregationPipeline,
		options?: mongoose.QueryOptions | null,
		callback?: mongoose.Callback
	): mongoose.Query<mongoose.UpdateWriteOpResult, T>

	static where<T extends ModelI>(this: ClassType<T>, path: string, val?: any): mongoose.Query<T[], T>

	static where<T extends ModelI>(this: ClassType<T>, obj: { [key: string]: any }): mongoose.Query<T[], T>

	static where<T extends ModelI>(this: ClassType<T>): mongoose.Query<T[], T>
}

/**
 * @public
 */
type Projection = string | Record<string, 1 | 0> | null
