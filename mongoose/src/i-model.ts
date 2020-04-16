import mongoose from 'mongoose'
import mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { Plain } from './interfaces'

const IBase = class {} as mongoose.Model<mongoose.Document>

/**
 * Intermediary abstract class with overloaded static methods to properly infer the child class.
 * @public
 */
export abstract class IModel extends IBase {
	static findById<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findById<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		projection: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	// @ts-ignore implementation
	static findById<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		projection: any,
		options: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	// @ts-ignore implementation
	static $where<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		argument: string | Function
	): mongoose.DocumentQuery<T, T, {}>

	// @ts-ignore implementation
	static count<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	static countDocuments<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	// @ts-ignore implementation
	static countDocuments<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		criteria: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	static create<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	static create<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		options?: mongoose.SaveOptions,
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	// @ts-ignore implementation
	static create<T extends mongoose.Document>(this: new (...a: any[]) => T, ...docs: Plain.Partial<T>[]): Promise<T>

	// @ts-ignore implementation
	static exists<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		callback?: (err: any, res: boolean) => void
	): Promise<boolean>

	static find<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static find<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static find<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection?: any | null,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	// @ts-ignore implementation
	static find<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection?: any | null,
		options?: any | null,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: any,
		options: { rawResult: true } & { upsert: true } & { new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: T) => void
	): mongoose.DocumentQuery<T, T, {}>

	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: any,
		options: { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: mongodb.FindAndModifyWriteOpResultObject<T>) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>>

	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: any,
		options: { rawResult: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: mongodb.FindAndModifyWriteOpResultObject<T | null>) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findByIdAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: any,
		options: mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions?: mongoose.FilterQuery<T>,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	// @ts-ignore implementation
	static findOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection: any,
		options: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends mongoose.Document>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		// tslint:disable-next-line: unified-signatures
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndDelete<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends mongoose.Document>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		// tslint:disable-next-line: unified-signatures
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndRemove<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: any,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: any,
		options: { rawResult: true } & { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>>

	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: any,
		options: { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.DocumentQuery<T, T, {}>

	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: any,
		options: { rawResult: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndUpdate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: any,
		options: mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static insertMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.ModelOptions,
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		doc: Plain.Partial<T>,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static insertMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		doc: Plain.Partial<T>,
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.ModelOptions,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static populate<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T> | Plain.Partial<T>[],
		options: mongoose.ModelPopulateOptions | mongoose.ModelPopulateOptions[],
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	// @ts-ignore implementation
	static remove<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.ModelOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	static deleteMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.ModelOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	static replaceOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		replacement: Plain<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static replaceOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		replacement: Plain<T>,
		options: QueryReplaceOneOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static update<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: any,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static update<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: any,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static updateOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: any,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static updateOne<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: Plain.Partial<T>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static updateMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: Plain.Partial<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static updateMany<T extends mongoose.Document>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: Plain.Partial<T>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>
}

interface QueryReplaceOneOptions {
	strict?: boolean | string
	upsert?: boolean
	writeConcern?: mongoose.WriteConcern | null
	omitUndefined?: boolean
	timestamps?: boolean | null
}
