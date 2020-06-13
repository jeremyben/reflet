import { Model, Field, PreHook, PostHook } from '../src'
import * as mongoose from 'mongoose'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => {
	consoleSpy.mockReset()
})

test('init, validate, save, findOne, remove', async () => {
	@Model()
	@PreHook<UserHookIVSFR>('init', (doc) => {
		console.info('pre-init', doc)
	})
	@PostHook<UserHookIVSFR>('init', function (doc) {
		console.info('post-init', this === doc)
	})
	@PreHook<UserHookIVSFR>('validate', function (next) {
		console.info('pre-validate', this)
		next()
	})
	@PostHook<UserHookIVSFR>('validate', function (doc, next) {
		console.info('post-validate', this === doc)
		next()
	})
	@PostHook<UserHookIVSFR, Error>('validate', function (error, doc, next) {
		console.info('post-validate-error', error, doc)
		next()
	})
	@PreHook<UserHookIVSFR>('save', function (next) {
		console.info('pre-save', this)
		next()
	})
	@PostHook<UserHookIVSFR>('save', function (doc, next) {
		console.info('post-save', this === doc)
		next()
	})
	// @PostHook<UserHookIVSFR, Error>('save', function (error, doc, next) {
	// 	console.log('post-save-error', error, doc)
	// 	next()
	// })
	@PreHook<UserHookIVSFR>('findOne', function (next) {
		console.info('pre-findOne', this.constructor.name)
		next()
	})
	@PostHook<UserHookIVSFR>('findOne', function (doc, next) {
		console.info('post-findOne', doc)
		next()
	})
	@PreHook<UserHookIVSFR>('remove', { query: true }, function (next) {
		console.info('pre-remove', this.constructor.name)
		next()
	})
	@PostHook<UserHookIVSFR>('remove', { query: true, document: false }, function (result, next) {
		console.info('post-remove', result.deletedCount)
		next()
	})
	class UserHookIVSFR extends Model.Interface {
		@Field(String)
		name: string
	}

	await UserHookIVSFR.create({ name: 'jeremy' })
	const user = await UserHookIVSFR.findOne({ name: 'jeremy' })
	// await user?.remove()
	await UserHookIVSFR.remove({ name: 'jeremy' })

	try {
		await UserHookIVSFR.create({ name: ['jeremy'] as any }) // will error out
	} catch (error) {} // tslint:disable-line: no-empty

	expect(consoleSpy).toBeCalledWith('pre-init', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('post-init', true)
	expect(consoleSpy).toBeCalledWith('pre-validate', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('post-validate', true)
	expect(consoleSpy).toBeCalledWith('pre-save', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('post-save', true)
	expect(consoleSpy).toBeCalledWith('pre-findOne', 'Query')
	expect(consoleSpy).toBeCalledWith('post-findOne', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('pre-remove', 'Query')
	expect(consoleSpy).toBeCalledWith('post-remove', 1)
	expect(consoleSpy).toBeCalledWith('post-validate-error', expect.any(Error), null)
})

test('updateOne, deleteOne', async () => {
	@Model()
	@PreHook<UserHookUD>('updateOne', { document: true, query: false }, function (next) {
		console.info('pre-updateOne', this)
		next()
	})
	@PostHook<UserHookUD>('updateOne', function (result, next) {
		console.info('post-updateOne', this.constructor.name, result.nModified)
		next()
	})
	@PreHook<UserHookUD>('deleteOne', function (next) {
		console.info('pre-deleteOne', this.constructor.name)
		next()
	})
	@PostHook<UserHookUD>('deleteOne', function (result, next) {
		console.info('post-deleteOne', result.deletedCount)
		next()
	})
	class UserHookUD extends Model.I<UserHookUD> {
		@Field(String)
		name: string
	}

	const user = await new UserHookUD({ name: 'jeremy' }).save()
	await user.updateOne({ name: 'arthur' })
	await UserHookUD.deleteOne({ name: 'arthur' })

	expect(consoleSpy).toBeCalledWith('pre-updateOne', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('post-updateOne', 'Query', 1)
	expect(consoleSpy).toBeCalledWith('pre-deleteOne', 'Query')
	expect(consoleSpy).toBeCalledWith('post-deleteOne', 1)
})

test('insertMany, find, update, updateMany, count, deleteMany', async () => {
	@Model()
	@PreHook<UserHookIFUUCD>('insertMany', function (next) {
		console.info('pre-insertMany', this.modelName)
		next()
	})
	@PostHook<UserHookIFUUCD>('insertMany', (docs, next) => {
		console.info('post-insertMany', docs[0])
		next()
	})
	@PostHook<UserHookIFUUCD>('find', (docs, next) => {
		console.info('post-find', docs.length)
		next()
	})
	@PostHook<UserHookIFUUCD, Error>('find', (error, docs, next) => {
		console.info('post-find-error', error, docs)
		next()
	})
	@PostHook<UserHookIFUUCD>('update', (result, next) => {
		console.info('post-update', result.ok)
		next()
	})
	@PostHook<UserHookIFUUCD>('updateMany', (result, next) => {
		console.info('post-updateMany', result)
		next()
	})
	@PostHook<UserHookIFUUCD>('count', (result, next) => {
		console.info('post-count', result)
		next()
	})
	@PostHook<UserHookIFUUCD>('deleteMany', (result, next) => {
		console.info('post-deleteMany', result)
		next()
	})
	@PostHook<UserHookIFUUCD, Error>('deleteMany', (error, result, next) => {
		console.info('post-deleteMany-error', error, result)
		next()
	})
	class UserHookIFUUCD extends Model.Interface {
		@Field({ type: String, required: true })
		name: string
	}

	await UserHookIFUUCD.insertMany([{ name: 'jeremy' }, { name: 'julia' }])
	await UserHookIFUUCD.find({})
	await UserHookIFUUCD.update({ name: 'jeremy' }, { name: 'arthur' })
	await UserHookIFUUCD.updateMany({ name: { $in: ['julia', 'arthur'] } }, { name: 'marc' })
	await UserHookIFUUCD.count({ name: 'marc' })
	await UserHookIFUUCD.deleteMany({ name: 'marc' })

	try {
		await UserHookIFUUCD.find({ name: { $or: ['marc'] } as any }) // will error out
	} catch (error) {} // tslint:disable-line: no-empty

	try {
		await UserHookIFUUCD.deleteMany({ name: { $or: ['marc'] } as any }) // will error out
	} catch (error) {} // tslint:disable-line: no-empty

	expect(consoleSpy).toBeCalledWith('pre-insertMany', UserHookIFUUCD.modelName)
	expect(consoleSpy).toBeCalledWith('post-insertMany', expect.objectContaining({ name: 'jeremy' }))
	expect(consoleSpy).toBeCalledWith('post-find', 2)
	expect(consoleSpy).toBeCalledWith('post-update', 1)
	expect(consoleSpy).toBeCalledWith('post-find-error', expect.any(Error), null)
	expect(consoleSpy).toBeCalledWith('post-updateMany', { n: 2, nModified: 2, ok: 1 })
	expect(consoleSpy).toBeCalledWith('post-count', 2)
	expect(consoleSpy).toBeCalledWith('post-deleteMany', { n: 2, ok: 1, deletedCount: 2 })
	expect(consoleSpy).toBeCalledWith('post-deleteMany-error', expect.any(Error), null)
})

test('aggregate', async () => {
	@Model()
	@PreHook<UserHookA>('aggregate', function (next) {
		this.project('name -_id')
		next()
	})
	@PostHook<UserHookA>('aggregate', function (docs, next) {
		next()
	})
	@PostHook<UserHookA, Error>('aggregate', function (error, docs, next) {
		console.info('post-aggregate-error', error, docs)

		next()
	})
	class UserHookA extends Model.Interface {
		@Field(String)
		name: string
	}

	await new UserHookA({ name: 'jeremy' }).save()
	const aggRes = await UserHookA.aggregate([{ $match: { name: 'jeremy' } }])
	expect(aggRes).toStrictEqual([{ name: 'jeremy' }])

	try {
		await UserHookA.aggregate([{ $match: { name: { $or: ['jeremy'] } } }]) // will error out
	} catch (error) {} // tslint:disable-line: no-empty

	expect(consoleSpy).toBeCalledWith('post-aggregate-error', expect.any(Error), undefined)
})

test('mixed hooks', async () => {
	@Model()
	@PreHook<UserHookX>(['aggregate', 'find', 'save'], function (this: any, next) {
		console.info(this.constructor.name)
		next()
	})
	class UserHookX extends Model.I {
		@Field(String)
		name: string
	}

	await new UserHookX({ name: 'jeremy' }).save()
	const findRes = await UserHookX.find({ name: 'jeremy' })
	const aggRes = await UserHookX.aggregate([{ $match: { name: 'jeremy' } }])

	expect(consoleSpy).toBeCalledWith('model')
	expect(consoleSpy).toBeCalledWith('Query')
	expect(consoleSpy).toBeCalledWith('Aggregate')
})
