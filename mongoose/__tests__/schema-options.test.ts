import mongoose from 'mongoose'
import { Field, SchemaOptions, schemaFrom, VersionKey, CreatedAt, UpdatedAt, SchemaCallback, Model } from '../src'

test('simple schema', async () => {
	@Model()
	@SchemaOptions({ strict: 'throw' })
	@SchemaCallback<S>((schema) => schema.index({ name: 1, numbers: -1 }))
	class S extends Model.I {
		@Field({
			type: String,
			lowercase: true,
			required: true,
			get: (v) => v.replace('y', 'ie'),
		})
		name: string

		@Field([Number])
		numbers: number[]

		@Field({
			type: mongoose.Schema.Types.ObjectId,
			ref: '',
		})
		ref: string

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

		hello() {
			return 'hello'
		}
	}

	// await S.create({ name: 's' })
	const SSchema = schemaFrom(S)

	// console.log(SSchema)
})

describe('timestamps', () => {
	test('without schema options', async () => {
		class TS {
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

		expect(() => schemaFrom(TS2)).toThrowError(/cannot overwrite/)

		@SchemaOptions({ timestamps: { createdAt: 'created', updatedAt: 'updated' } })
		class TS2b {
			@Field(String)
			name: string

			@CreatedAt
			_created: Date

			@UpdatedAt
			_updated: Date
		}

		expect(() => schemaFrom(TS2b)).toThrowError(/cannot overwrite/)
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

		expect(() => schemaFrom(TS3)).toThrowError(/cannot overwrite/)

		@SchemaOptions({ timestamps: { createdAt: false } })
		class TS3b {
			@Field(String)
			name: string

			@CreatedAt
			createdAt: Date
		}

		expect(() => schemaFrom(TS3b)).toThrowError(/cannot overwrite/)
	})
})