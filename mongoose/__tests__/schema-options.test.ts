import * as mongoose from 'mongoose'
import autopopulate = require('mongoose-autopopulate')
import {
	Field,
	SchemaOptions,
	schemaFrom,
	VersionKey,
	CreatedAt,
	UpdatedAt,
	SchemaCallback,
	Model,
	SchemaPlugin,
} from '../src'
import { RefletMongooseError } from '../src/reflet-error'

test('schema with reference', async () => {
	@SchemaOptions({ _id: false })
	abstract class SubSchema {
		@Field.ArrayOfEnum(['jeremy', 'julia', 'arthur'], {
			default: ['jeremy'],
		})
		names: ('jeremy' | 'julia' | 'arthur')[]
	}

	@Model()
	@SchemaOptions({ versionKey: false })
	class SReference extends Model.I {
		@Field(String)
		hello: string
	}

	@Model()
	@SchemaOptions({
		strict: 'throw',
		minimize: false,
		versionKey: false,
		toJSON: { getters: true },
		toObject: { getters: true },
	})
	@SchemaPlugin<S, { functions: string[] }>(autopopulate as any, { functions: ['findOne'] })
	@SchemaCallback<S>((schema) => schema.index({ name: 1, numbers: -1 }))
	class S extends Model.I {
		@Field({
			type: mongoose.Schema.Types.String,
			lowercase: true,
			required: true,
			get: (v) => v.replace('y', 'ie'),
			set: (v) => v.replace(/e/g, 'é'),
		})
		name: string

		@Field({
			type: [[Number]],
			enum: [2, 4, 6],
			set: (a) => a.map((v) => v.map((n) => n * 2)),
		})
		numbers: number[][]

		@Field.Ref([SReference], { autopopulate: true })
		srefs: mongoose.Types.DocumentArray<SReference>

		@Field.Nested({
			lat: { type: Number },
			lng: { type: Number },
			city: { name: { type: String } },
			a: [{ b: { c: { type: String } } }],
		})
		nested: {
			lat: number
			lng: number
			city: { name: string }
			a: { b: { c: string } }[]
		}

		@Field.Schema(SubSchema, { required: true })
		sub: SubSchema & mongoose.Types.Subdocument

		@Field.Schema([SubSchema], { default: [{ names: ['arthur'] }] })
		subs: (SubSchema & mongoose.Types.Subdocument)[]

		@Field(mongoose.Schema.Types.Buffer)
		buf: mongoose.Types.Buffer

		@Field(mongoose.Schema.Types.Decimal128)
		dec: mongoose.Types.Decimal128

		hello() {
			return 'hello'
		}
	}

	const srefs = await SReference.create([{ hello: 'hi' }, { hello: 'bonjour' }])
	await S.create({
		name: 'Jeremy',
		numbers: [[1, 2, 3]],
		srefs: srefs.map((sref) => sref._id),
		sub: { names: ['julia', 'arthur'] },
		buf: Buffer.from('yolo') as any,
		dec: mongoose.Types.Decimal128.fromString('13'),
	})

	const s = (await S.findOne({ name: 'Jeremy' }))!
	// console.log(s)
	// const obj = s.toObject()
	// console.log('s-object', JSON.stringify(obj, null, '  '))

	expect(s.srefs[0]._id).toBeInstanceOf(mongoose.Types.ObjectId)
	expect(s.srefs[0].hello).toBe('hi')
	expect(s.name).toBe('jérémie')
	expect(s.nested).toHaveProperty('lat', undefined)
})

describe('timestamps', () => {
	const code: RefletMongooseError['code'] = 'TIMESTAMP_OPTION_CONFLICT'

	test('without schema options', async () => {
		abstract class TS {
			@Field(String)
			name: string

			@CreatedAt
			created: Date

			@UpdatedAt
			updated: Date
		}

		const tsSchema = schemaFrom(TS)
		expect((tsSchema as any).options.timestamps.createdAt).toBe('created')
		expect((tsSchema as any).options.timestamps.updatedAt).toBe('updated')
	})

	test('keys are the same than default', async () => {
		@SchemaOptions({ timestamps: { createdAt: true, updatedAt: true } })
		class TS1 {
			@Field(String)
			name: string

			@CreatedAt
			createdAt: Date

			@UpdatedAt
			updatedAt: Date
		}

		const ts1Schema = schemaFrom(TS1)
		expect((ts1Schema as any).options.timestamps.createdAt).toBe('createdAt')
		expect((ts1Schema as any).options.timestamps.updatedAt).toBe('updatedAt')

		@SchemaOptions({ timestamps: { createdAt: true } })
		class TS1b {
			@Field(String)
			name: string

			@CreatedAt
			createdAt: Date
		}

		const ts1bSchema = schemaFrom(TS1b)
		expect((ts1bSchema as any).options.timestamps.createdAt).toBe('createdAt')
		expect((ts1bSchema as any).options.timestamps.updatedAt).toBe(false)
	})

	test('keys are different than default', async () => {
		@SchemaOptions({ timestamps: true })
		class TS2 {
			@Field(String)
			name: string

			@CreatedAt
			_created: Date

			@UpdatedAt
			_updated: Date
		}

		expect(() => schemaFrom(TS2)).toThrow(expect.objectContaining({ code }))

		@SchemaOptions({ timestamps: { createdAt: 'created', updatedAt: 'updated' } })
		class TS2b {
			@Field(String)
			name: string

			@CreatedAt
			_created: Date

			@UpdatedAt
			_updated: Date
		}

		expect(() => schemaFrom(TS2b)).toThrow(expect.objectContaining({ code }))
	})

	test('keys are defined whereas option is false', async () => {
		@SchemaOptions({ timestamps: false })
		class TS3 {
			@Field(String)
			name: string

			@CreatedAt
			createdAt: Date

			@UpdatedAt
			updatedAt: Date
		}

		expect(() => schemaFrom(TS3)).toThrow(expect.objectContaining({ code }))

		@SchemaOptions({ timestamps: { createdAt: false } })
		class TS3b {
			@Field(String)
			name: string

			@CreatedAt
			createdAt: Date
		}

		expect(() => schemaFrom(TS3b)).toThrow(expect.objectContaining({ code }))
	})
})

describe('versionKey', () => {
	const code: RefletMongooseError['code'] = 'VERSIONKEY_OPTION_CONFLICT'

	test('without schema options', async () => {
		class VK {
			@Field(String)
			name: string

			@VersionKey
			version: number
		}

		const vkSchema = schemaFrom(VK)
		expect((vkSchema as any).options.versionKey).toBe('version')
	})

	test('key is different than option', async () => {
		@SchemaOptions({ versionKey: 'v' })
		class VK1 {
			@Field(String)
			name: string

			@VersionKey
			version: number
		}

		expect(() => schemaFrom(VK1)).toThrow(expect.objectContaining({ code }))
	})

	test('key is defined and option is false', async () => {
		@SchemaOptions({ versionKey: false })
		class VK2 {
			@Field(String)
			name: string

			@VersionKey
			version: number
		}

		expect(() => schemaFrom(VK2)).toThrow(expect.objectContaining({ code }))
	})
})

declare global {
	/**
	 * Namespace dedicated to application-specific declaration merging.
	 * @public
	 */
	namespace RefletMongoose {
		/**
		 * Open interface to extend `@Field` SchemaType options.
		 * Useful for global plugins.
		 * @public
		 */
		interface SchemaTypeOptions {
			autopopulate?: boolean
		}
	}
}
