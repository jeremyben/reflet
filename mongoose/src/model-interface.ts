import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { Plain } from './interfaces'

/**
 * Intermediary abstract class with overloaded static methods to properly infer the child class.
 * @public
 */
export abstract class MongooseModel extends (class {} as RefletMongoose.Model) {
	// @ts-ignore implementation
	constructor(
		doc?: { _id?: mongoose.Document['_id']; [field: string]: any },
		strict?: mongoose.SchemaOptions['strict']
	)

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

	static create<T extends MongooseModel>(this: new (...a: any[]) => T, doc: Plain.PartialDeep<T>): Promise<T>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		options?: mongoose.SaveOptions
	): Promise<T[]>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		callback: (err: mongoose.CallbackError, res: T[]) => void
	): void

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.PartialDeep<T>,
		callback: (err: mongoose.CallbackError, res: T) => void
	): void

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		options: mongoose.SaveOptions,
		callback: (err: mongoose.CallbackError, res: T[]) => void
	): void

	// @ts-ignore implementation
	static create<T extends MongooseModel>(this: new (...a: any[]) => T, ...docs: Plain.PartialDeep<T>[]): Promise<T[]>

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
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>, T>

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
		replacement: Plain.PartialDeep<T>,
		options: mongoose.QueryOptions & { upsert: true } & mongoose.ReturnsNewDoc,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.Query<T, T>

	// @ts-ignore implementation
	static findOneAndReplace<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		replacement?: Plain.PartialDeep<T>,
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
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>, T>

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
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>, T>

	// @ts-ignore implementation
	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions | null,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.Query<T | null, T>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.InsertManyOptions,
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.PartialDeep<T>,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.PartialDeep<T>,
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
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }, T>

	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }, T>

	// @ts-ignore implementation
	static replaceOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		replacement?: Plain.PartialDeep<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, res: any) => void
	): mongoose.Query<any, T>

	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		callback?: (err: any, res: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	// @ts-ignore implementation
	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	// @ts-ignore implementation
	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter?: mongoose.FilterQuery<T>,
		update?: mongoose.UpdateQuery<T>,
		options?: mongoose.QueryOptions | null,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	static updateMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	// @ts-ignore implementation
	static updateMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		options: mongoose.QueryOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<mongodb.WriteOpResult['result'], T>

	update(doc: mongoose.UpdateQuery<this>, callback?: (err: any, raw: any) => void): mongoose.Query<any, this>

	// @ts-ignore implementation
	update(
		doc: mongoose.UpdateQuery<this>,
		options: mongoose.QueryOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any, this>

	updateOne(doc: mongoose.UpdateQuery<this>, callback?: (err: any, raw: any) => void): mongoose.Query<any, this>

	// @ts-ignore implementation
	updateOne(
		doc: mongoose.UpdateQuery<this>,
		options: mongoose.QueryOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any, this>

	// Plain seems to be not compatible with LeanDocument
	// @ts-ignore implementation
	toObject(options?: mongoose.ToObjectOptions): mongoose.LeanDocument<this>

	// @ts-ignore implementation
	toJSON(options?: mongoose.ToObjectOptions): mongoose.LeanDocument<this>
}
