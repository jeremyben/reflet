import { U, Tuple, O, F } from 'ts-toolbelt'
import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb' // tslint:disable-line: no-implicit-dependencies
import { Plain, PlainKeys } from './interfaces'

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

	static findSafe<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: SafeFilterQuery<Plain<T>>,
		projection?: PartialRecord<PlainKeys<T>, 1> | PartialRecord<PlainKeys<T>, 0> | null,
		options?: mongoose.QueryFindOptions
	): SafeQuery<T, [], [], false, true> {
		return (this as mongoose.Model<any>).find(conditions, projection, options) as any
	}

	// @ts-ignore implementation
	static $where<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		argument: string | Function
	): mongoose.DocumentQuery<T, T, {}>

	// @ts-ignore implementation
	static count<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	static countDocuments<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	// @ts-ignore implementation
	static countDocuments<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		criteria: mongoose.FilterQuery<T>,
		callback?: (err: any, count: number) => void
	): mongoose.Query<number>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.PartialDeep<T>,
		options?: mongoose.SaveOptions
	): Promise<T>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.PartialDeep<T>,
		// tslint:disable-next-line: unified-signatures
		callback?: (err: any, res: T[]) => void
	): Promise<T>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	static create<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.PartialDeep<T>[],
		options?: mongoose.SaveOptions,
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	// @ts-ignore implementation
	static create<T extends MongooseModel>(this: new (...a: any[]) => T, ...docs: Plain.PartialDeep<T>[]): Promise<T>

	// @ts-ignore implementation
	static exists<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		filter: mongoose.FilterQuery<T>,
		callback?: (err: any, res: boolean) => void
	): Promise<boolean>

	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection?: any | null,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	// @ts-ignore implementation
	static find<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection?: any | null,
		options?: mongoose.QueryFindOptions,
		callback?: (err: any, res: T[]) => void
	): mongoose.DocumentQuery<T[], T & mongoose.Document, {}>

	static findById<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findById<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		projection: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	// @ts-ignore implementation
	static findById<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | string | number,
		projection: any,
		options: mongoose.QueryFindBaseOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: mongoose.UpdateQuery<T>,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: mongoose.UpdateQuery<T>,
		options: { rawResult: true } & { upsert: true } & { new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: T) => void
	): mongoose.DocumentQuery<T, T, {}>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: mongoose.UpdateQuery<T>,
		options: { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: mongodb.FindAndModifyWriteOpResultObject<T>) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>>

	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: mongoose.UpdateQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: mongodb.FindAndModifyWriteOpResultObject<T | null>) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findByIdAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		id: any | number | string,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions?: mongoose.FilterQuery<T>,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	// @ts-ignore implementation
	static findOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		projection: any,
		options: any,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends MongooseModel>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		// tslint:disable-next-line: unified-signatures
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndDelete<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndDelete<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends MongooseModel>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		// tslint:disable-next-line: unified-signatures
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndRemove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndRemove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.QueryFindOneAndRemoveOptions,
		callback?: (err: any, res: T | null) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: { rawResult: true } & { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T>>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: { upsert: true; new: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: T, res: any) => void
	): mongoose.DocumentQuery<T, T, {}>

	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: { rawResult: true } & mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: mongodb.FindAndModifyWriteOpResultObject<T | null>, res: any) => void
	): mongoose.Query<mongodb.FindAndModifyWriteOpResultObject<T | null>>

	// @ts-ignore implementation
	static findOneAndUpdate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		update: mongoose.UpdateQuery<T>,
		options: mongoose.QueryFindOneAndUpdateOptions,
		callback?: (err: any, doc: T | null, res: any) => void
	): mongoose.DocumentQuery<T | null, T, {}>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T>[],
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.ModelOptions,
		callback?: (error: any, docs: T[]) => void
	): Promise<T[]>

	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.Partial<T>,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static insertMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		doc: Plain.Partial<T>,
		options?: { ordered?: boolean; rawResult?: boolean } & mongoose.ModelOptions,
		callback?: (error: any, doc: T) => void
	): Promise<T>

	// @ts-ignore implementation
	static populate<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		docs: Plain.Partial<T> | Plain.Partial<T>[],
		options: mongoose.ModelPopulateOptions | mongoose.ModelPopulateOptions[],
		callback?: (err: any, res: T[]) => void
	): Promise<T[]>

	// @ts-ignore implementation
	static remove<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.ModelOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	// @ts-ignore implementation
	static deleteMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		options: mongoose.ModelOptions,
		callback?: (err: any) => void
	): mongoose.Query<mongodb.DeleteWriteOpResultObject['result'] & { deletedCount?: number }>

	static replaceOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		replacement: Plain<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static replaceOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		replacement: Plain<T>,
		options: QueryReplaceOneOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static update<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static updateOne<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	static updateMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	static updateMany<T extends MongooseModel>(
		this: new (...a: any[]) => T,
		conditions: mongoose.FilterQuery<T>,
		doc: mongoose.UpdateQuery<T>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	update(doc: mongoose.UpdateQuery<this>, callback?: (err: any, raw: any) => void): mongoose.Query<any>

	// @ts-ignore implementation
	update(
		doc: mongoose.UpdateQuery<this>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	updateOne(doc: mongoose.UpdateQuery<this>, callback?: (err: any, raw: any) => void): mongoose.Query<any>

	// @ts-ignore implementation
	updateOne(
		doc: mongoose.UpdateQuery<this>,
		options: mongoose.ModelUpdateOptions,
		callback?: (err: any, raw: any) => void
	): mongoose.Query<any>

	// @ts-ignore implementation
	toObject(options?: mongoose.DocumentToObjectOptions): Plain<this>

	// @ts-ignore implementation
	toJSON(options?: mongoose.DocumentToObjectOptions): Plain<this>
}

interface QueryReplaceOneOptions {
	strict?: boolean | string
	upsert?: boolean
	writeConcern?: mongoose.WriteConcern | null
	omitUndefined?: boolean
	timestamps?: boolean | null
}

type SafeFilterQuery<T> = {
	[P in keyof T]?: P extends '_id'
		? [Extract<T[P], mongodb.ObjectId>] extends [never]
			? mongodb.Condition<T[P]>
			: mongodb.Condition<T[P] | string | { _id: mongodb.ObjectId }>
		: [Extract<T[P], mongodb.ObjectId>] extends [never]
		? mongodb.Condition<T[P]>
		: mongodb.Condition<T[P] | string>
} &
	RootQuerySelector<T>

type RootQuerySelector<T> = {
	/** https://docs.mongodb.com/manual/reference/operator/query/and/#op._S_and */
	$and?: ({ [P in keyof T]?: mongodb.Condition<T[P]> } & RootQuerySelector<T>)[]
	/** https://docs.mongodb.com/manual/reference/operator/query/nor/#op._S_nor */
	$nor?: ({ [P in keyof T]?: mongodb.Condition<T[P]> } & RootQuerySelector<T>)[]
	/** https://docs.mongodb.com/manual/reference/operator/query/or/#op._S_or */
	$or?: ({ [P in keyof T]?: mongodb.Condition<T[P]> } & RootQuerySelector<T>)[]
	/** https://docs.mongodb.com/manual/reference/operator/query/text */
	$text?: {
		$search: string
		$language?: string
		$caseSensitive?: boolean
		$diacraticSensitive?: boolean
	}
	/** https://docs.mongodb.com/manual/reference/operator/query/where/#op._S_where */
	$where?: string | Function
	/** https://docs.mongodb.com/manual/reference/operator/query/comment/#op._S_comment */
	$comment?: string
}

interface SafeQuery<
	T extends mongoose.Document,
	PopulatedKeysTuple extends Tuple.List<RefKeys<T>>,
	OmittedKeys extends Tuple.List<keyof T>,
	IsLean extends boolean,
	AsArray extends boolean
> {
	then: AsArray extends false
		? Tuple.Length<OmittedKeys> extends 0
			? Promise<SafeResult<T, PopulatedKeysTuple[number], IsLean>>['then']
			: Promise<Omit<SafeResult<T, PopulatedKeysTuple[number], IsLean>, OmittedKeys[number]>>['then']
		: Tuple.Length<OmittedKeys> extends 0
		? Promise<SafeResult<T, PopulatedKeysTuple[number], IsLean>[]>['then']
		: Promise<Omit<SafeResult<T, PopulatedKeysTuple[number], IsLean>, OmittedKeys[number]>[]>['then']

	populate<
		TPath extends RefKeys<T>,
		TSub extends T[TPath] extends any[]
			? U.Select<T[TPath], mongoose.Document[]>[number]
			: U.Select<T[TPath], mongoose.Document>,
		TSubPath extends RefKeys<TSub>,
		TSubSub extends TSub[TSubPath] extends any[]
			? U.Select<TSub[TSubPath], mongoose.Document[]>[number]
			: U.Select<TSub[TSubPath], mongoose.Document>
	>(
		options: TPath | SafeQueryPopulateOptions<T, TPath, TSub, TSubPath, TSubSub>
	): SafeQuery<T, Tuple.Append<PopulatedKeysTuple, TPath>, OmittedKeys, IsLean, AsArray>

	select<TPickedKeys extends keyof T>(
		arg: PartialRecord<F.AutoPath<PathPlain<T>, string & TPickedKeys>, 1>
	): SafeQuery<T, PopulatedKeysTuple, Tuple.List<Exclude<Exclude<PlainKeys<T>, '_id'>, TPickedKeys>>, IsLean, AsArray>

	select<TOmittedKeys extends PlainKeys<T>>(
		arg: PartialRecord<TOmittedKeys, 0>
	): SafeQuery<T, PopulatedKeysTuple, Tuple.List<TOmittedKeys>, IsLean, AsArray>

	lean(): SafeQuery<T, PopulatedKeysTuple, OmittedKeys, true, AsArray>

	sort<TKey extends PlainKeys<T>>(
		arg: TKey | PartialRecord<TKey, 'asc' | 'ascending' | 1 | 'desc' | 'descending' | -1>
	): this

	skip(val: number): this

	limit(val: number): this
}

type SafeQueryPopulateOptions<T, TPath, TSub, TSubPath, TSubSub extends object> = {
	path: TPath
	match?: SafeFilterQuery<TSub> | ((doc: T) => SafeFilterQuery<TSub>)
	select?: PartialRecord<PlainKeys<TSub>, 0 | 1>
	sort?: PartialRecord<PlainKeys<TSub>, 'asc' | 'ascending' | 1 | 'desc' | 'descending' | -1>
	model?: string | mongoose.Model<any>
	options?: { limit?: number; retainNullValues?: boolean }
	perDocumentLimit?: number
	populate?: ArrayOrNot<{
		path: TSubPath
		match?: SafeFilterQuery<U.Strict<TSubSub>> | ((doc: TSub) => SafeFilterQuery<U.Strict<TSubSub>>)
		select?: PartialRecord<PlainKeys<U.Strict<TSubSub>>, 0> | PartialRecord<PlainKeys<U.Strict<TSubSub>>, 1>
		sort?: PartialRecord<PlainKeys<U.Strict<TSubSub>>, 'asc' | 'ascending' | 1 | 'desc' | 'descending' | -1>
		model?: string | mongoose.Model<any>
		options?: { limit?: number; retainNullValues?: boolean }
		perDocumentLimit?: number
		populate?: ArrayOrNot<{
			path: string
			match?: SafeFilterQuery<{ [key: string]: any }>
			select?: Record<string, 0> | Record<string, 1>
			sort?: Record<string, 'asc' | 'ascending' | 1 | 'desc' | 'descending' | -1>
			model?: string | mongoose.Model<any>
			options?: { limit?: number; retainNullValues?: boolean }
			perDocumentLimit?: number
		}>
	}>
}

export type SafeResult<
	T extends mongoose.Document,
	PopulatedKeys extends RefKeys<T> = never,
	IsLean extends boolean = false
> = (IsLean extends true ? Plain<Unpopulate<T, PopulatedKeys>> : mongoose.Document & Unpopulate<T, PopulatedKeys>) &
	{
		[P in PopulatedKeys]: T[P] extends mongoose.Types.ObjectId[] | (infer D)[]
			? IsLean extends true
				? Plain<D>[]
				: D[]
			: T[P] extends mongoose.Types.ObjectId | infer DD
			? IsLean extends true
				? Plain<DD>
				: DD
			: T[P]
	}

/**
 * Removes Model from `Model | ObjectId` unions.
 */
type Unpopulate<T extends mongoose.Document, PopulatedKeys extends RefKeys<T>> = {
	[P in Exclude<keyof T, PopulatedKeys | Exclude<keyof mongoose.Document, '_id'>>]: IsAny<T[P]> extends true
		? T[P]
		: U.Has<T[P], mongoose.Types.ObjectId> extends 1
		? mongoose.Types.ObjectId
		: U.Has<T[P], mongoose.Types.ObjectId[]> extends 1
		? mongoose.Types.ObjectId[]
		: T[P]
}

type RefKeys<T extends object> = O.SelectKeys<
	T,
	mongoose.Document | mongoose.Document[] | mongoose.Types.ObjectId | mongoose.Types.ObjectId[],
	'extends->'
>

type PartialRecord<K extends keyof any, T> = {
	[P in K]?: T
}

type ArrayOrNot<T> = T | T[]

type IsAny<T> = 0 extends 1 & T ? true : false

// tslint:disable: no-shadowed-variable
type PathPlain<T> = {
	[K in Exclude<PlainKeys<T>, undefined>]: T[K] extends
		| mongoose.Document
		| mongoose.Types.Subdocument
		| mongoose.Types.Embedded
		? PathPlain<T[K]>
		: T[K] extends mongoose.Types.DocumentArray<infer U>
		? PathPlain<U>
		: T[K] extends mongoose.Types.Array<infer U>
		? U
		: T[K] extends (infer U)[] | ((infer U)[] | mongoose.Types.ObjectId[])
		? PathPlain<U>
		: U.Has<T[K], mongoose.Types.ObjectId> extends 1
		? PathPlain<U.Exclude<T[K], mongoose.Types.ObjectId>>
		: T[K]
}
