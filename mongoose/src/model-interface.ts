import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { ClassType, IsAny, Plain } from './interfaces'

/** @ts-ignore protected */
type NewDocParameter<T extends MongooseModel> = IsAny<T['$typeof']> extends true
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
export abstract class MongooseModel<C extends ClassType = any> extends (class {} as RefletMongoose.Model) {
	constructor(doc?: any, strict?: mongoose.SchemaOptions['strict']) {
		super()
	}

	/**
	 * Hack to retrieve the constructor type for static methods: `create`, `insertMany` and `replaceOne`.
	 *
	 * ⚠️ **Do not use at runtime.**
	 */
	protected $typeof?: C

	// @ts-ignore implementation
	static $where<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		argument: string | Function
	): mongoose.Query<T[], T>

	static count<T extends MongooseModel>(callback?: (err: any, count: number) => void): mongoose.Query<number, T>

	// @ts-ignore implementation
	static count<T extends MongooseModel>(
		filter: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number, T>

	static countDocuments<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number, T>

	// @ts-ignore implementation
	static countDocuments<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		criteria: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number, T>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: NewDocParameter<T>[],
		options?: mongoose.SaveOptions
	): Promise<T[]>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: NewDocParameter<T>[],
		callback: (err: mongoose.CallbackError, res: T[]) => void
	): void

	// must be after signature with array
	static create<T extends MongooseModel>(this: new (...a: any[]) => T, doc: NewDocParameter<T>): Promise<T>

	static create<T extends MongooseModel>(this: new (...a: any[]) => T, ...docs: NewDocParameter<T>[]): Promise<T[]>

	// @ts-ignore implementation
	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: NewDocParameter<T>,
		callback: (err: mongoose.CallbackError, res: T) => void
	): void

	static exists<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>
	): Promise<boolean>

	// @ts-ignore implementation
	static exists<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		callback: (err: any, res: boolean) => void
	): void

	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		callback?: (err: any, docs: T[]) => void
	): mongoose.Query<T[], T>

	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		callback?: (err: any, docs: T[]) => void
	): mongoose.Query<T[], T>

	// @ts-ignore implementation
	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		projection?: any | null,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, docs: T[]) => void
	): mongoose.Query<T[], T>

	// @ts-ignore implementation
	static findById<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: mongodb.ObjectId | string,
		projection?: any | null,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, res: T | null) => void
	): mongoose.Query<T | null, T>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		callback?: (err: any, res: T | null) => void
	): mongoose.Query<T | null, T>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { rawResult: true },
		callback?: (err: any, doc: any, res: any) => void
	): mongoose.Query<any, T>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.Query<T, T>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: mongodb.ObjectId | string,
		update: mongoose.UpdateQuery<T>,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T, T>

	// @ts-ignore implementation
	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id?: mongodb.ObjectId | string,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	// @ts-ignore implementation
	static findOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		projection?: any | null,
		options?: mongoose.QueryOptions | any,
		callback?: (err: any, doc: T | null) => void
	): mongoose.Query<T | null, T>

	// @ts-ignore implementation
	static findOneAndDelete<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	// @ts-ignore implementation
	static findOneAndRemove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndReplace<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		replacement: mongoose.DocumentDefinition<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.Query<T, T>

	// @ts-ignore implementation
	static findOneAndReplace<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		replacement?: mongoose.DocumentDefinition<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndUpdate<T extends MongooseModel>(this: new (...a: any[]) => T): mongoose.Query<T | null, T>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: ({ rawResult: true } & { upsert: true; new: true } & mongoose.QueryOptions) | null,
		callback?: (err: any, doc: any, res: any) => void
	): mongoose.Query<any, T>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: ({ upsert: true; new: true } & mongoose.QueryOptions) | null,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.Query<T, T>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: ({ rawResult: true } & mongoose.QueryOptions) | null,
		callback?: (err: any, doc: any | null, res: any) => void
	): mongoose.Query<any | null, T>

	// @ts-ignore implementation
	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	// @ts-ignore implementation
	static hydrate<T extends MongooseModel>(this: new (...a: any[]) => T, obj: { [key: string]: any }): T

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: NewDocParameter<T>[],
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: NewDocParameter<T>[],
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.InsertManyOptions,
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: NewDocParameter<T>,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: NewDocParameter<T>,
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.InsertManyOptions,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// https://mongoosejs.com/docs/api.html#model_Model.populate
	static populate<T extends MongooseModel, U extends { [key: string]: any }>(
		this: new (...a: any[]) => T,
		docs: U[],
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string,
		callback?: (err: any, res: U[]) => void
	): Promise<U[]>

	// @ts-ignore implementation
	static populate<T extends MongooseModel, U extends { [key: string]: any }>(
		this: new (...a: any[]) => T,
		docs: U,
		options: mongoose.PopulateOptions | mongoose.PopulateOptions[] | string,
		callback?: (err: any, res: U) => void
	): Promise<U>

	// @ts-ignore implementation
	static remove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteResult & { deletedCount?: number }, T>

	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteResult & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteResult & { deletedCount?: number }, T>

	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteResult & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		options?: mongoose.QueryOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteResult & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static replaceOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		replacement?: NewDocParameter<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, res: any) => void
	): mongoose.Query<any, T>

	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		callback?: (err: any, res: any) => void
	): mongoose.Query<mongodb.UpdateResult, T>

	// @ts-ignore implementation
	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.UpdateResult, T>

	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.UpdateResult, T>

	// @ts-ignore implementation
	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.UpdateResult, T>

	// @ts-ignore implementation
	static updateMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		doc?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.UpdateResult, T>
}
