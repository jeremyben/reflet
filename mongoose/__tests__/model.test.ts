import * as mongoose from 'mongoose'
import { Field, Model, schemaFrom, Kind, Plain, SchemaOptions, SchemaCallback, PostHook, PreHook } from '../src'
import { RefletMongooseError } from '../src/reflet-error'

test('model with custom collection and connection', async () => {
	const db = mongoose.createConnection(process.env.MONGO_URL!)

	@Model('people', db)
	class UserOther extends Model.I {
		static col() {
			return this.collection.collectionName
		}

		@Field({ type: String, required: true })
		firstname: string

		@Field(String)
		lastname: string

		get fullname() {
			return this.firstname + ' ' + this.lastname
		}

		set fullname(name: string) {
			const [firstname, lastname] = name.split(' ')
			this.firstname = firstname
			this.lastname = lastname
		}

		version() {
			return this.__v
		}

		constructor(doc?: Plain.Partial<UserOther>) {
			super()
		}
	}

	const userOtherSchema = schemaFrom(UserOther)
	expect(userOtherSchema.obj).toStrictEqual({ firstname: { type: String, required: true }, lastname: String })

	expect(UserOther.col()).toBe('people')

	const simple = await new UserOther({ firstname: 'Jeremy' }).save()
	expect(simple.version()).toBe(simple.__v)

	await db.close()
})

test('model discriminators', async () => {
	@Model()
	class User extends Model.I<typeof User> {
		_id: mongoose.Types.ObjectId

		@Field({ type: String, required: true })
		firstname: string

		@Field({
			type: String,
			required: true,
			validate: {
				validator(value) {
					return value.length > 1
				},
				message({ path, value }) {
					return `${path} must have more than one caracter (got: ${value})`
				},
			},
		})
		lastname: string

		get fullname() {
			return this.firstname + ' ' + this.lastname
		}

		constructor(doc?: Plain.AllowString<User, { Omit: 'fullname'; Optional: '_id' }>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Developer extends User {
		@Field([String])
		languages: mongoose.Types.Array<string>

		@Kind('developer')
		kind: 'developer'

		constructor(doc?: Plain.AllowString<Developer, { Omit: 'fullname' | 'kind'; Optional: '_id' }>) {
			super()
		}
		protected $typeof: typeof Developer
	}

	@Model.Discriminator(User)
	class Doctor extends User {
		@Field(String)
		specialty: string

		@Kind('doctor')
		kind: 'doctor'

		get fullname() {
			return 'Dr ' + this.firstname + ' ' + this.lastname
		}

		constructor(doc?: Plain.AllowString<Doctor, { Omit: 'fullname' | 'kind'; Optional: '_id' }>) {
			super()
		}
		protected $typeof: typeof Doctor
	}

	const user = await User.create({
		_id: new mongoose.Types.ObjectId().toString(),
		firstname: 'Jeremy',
		lastname: 'Ben',
	})
	expect(user.fullname).toBe('Jeremy Ben')
	expect((user as any).kind).toBeUndefined()

	const developer = await Developer.create({ firstname: 'Jeremy', lastname: 'Ben', languages: ['JS', 'GO'] })
	expect(developer.fullname).toBe('Jeremy Ben')
	expect(developer.kind).toBe('developer')

	const doctor = await new Doctor({ firstname: 'Jeremy', lastname: 'Ben', specialty: 'surgery' }).save()
	expect(doctor.fullname).toBe('Dr Jeremy Ben')
	expect(doctor.specialty).toBe('surgery')
	expect(doctor.kind).toBe('doctor')
})

test('model decorator must be at the top', () => {
	const code: RefletMongooseError['code'] = 'INVALID_DECORATORS_ORDER'

	expect(() => {
		@SchemaCallback(() => null)
		@Model()
		class WrongSchemaCallbackOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrow(expect.objectContaining({ code }))

	expect(() => {
		@PreHook('init', () => undefined)
		@Model()
		class WrongPreHookOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrow(expect.objectContaining({ code }))

	expect(() => {
		@PostHook('init', () => undefined)
		@Model()
		class WrongPostHookOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrow(expect.objectContaining({ code }))

	expect(() => {
		@Model()
		@SchemaOptions({})
		class WrongOrderRoot extends Model.I {
			@Field(String)
			name: string
		}

		@SchemaOptions({})
		@Model.Discriminator(WrongOrderRoot)
		class WrongSchemaOptionsOrder extends WrongOrderRoot {
			@Field(String)
			name: string
		}
	}).toThrow(expect.objectContaining({ code }))

	expect(() => {
		@Model()
		@SchemaOptions({})
		class RightOrderRoot extends Model.I {
			@Field(String)
			name: string
		}

		@Model.Discriminator(RightOrderRoot)
		@SchemaOptions({})
		class RightOrderDiscriminator extends RightOrderRoot {
			@Field(String)
			name: string
		}
	}).not.toThrow()
})

describe('model discriminators coercion', () => {
	test('root model must be decorated', async () => {
		const code: RefletMongooseError['code'] = 'MISSING_ROOT_MODEL'

		class RootNotDecorated extends Model.I {
			@Field(String)
			name: string
		}

		expect(() => {
			@Model.Discriminator(RootNotDecorated)
			class ChildWithError extends RootNotDecorated {
				@Field(Number)
				age: number
			}
		}).toThrow(expect.objectContaining({ code }))
	})

	test('siblings should have same kind key', async () => {
		const code: RefletMongooseError['code'] = 'DISCRIMINATOR_KEY_CONFLICT'

		@Model()
		class A extends Model.Interface {
			@Field(String)
			firstname: string
		}

		@Model.Discriminator(A)
		class B extends A {
			@Field(String)
			lastname: string

			@Kind
			kind: 'B'
		}

		expect(() => {
			@Model.Discriminator(A)
			class C extends A {
				@Field(String)
				lastname: string

				@Kind('c')
				type: 'c'
			}
		}).toThrow(expect.objectContaining({ code }))
	})

	test('kind key should not overwrite options', async () => {
		const code: RefletMongooseError['code'] = 'DISCRIMINATOR_KEY_CONFLICT'

		@Model()
		@SchemaOptions({ discriminatorKey: 'kind' })
		class A1 extends Model.Interface {
			@Field(String)
			firstname: string
		}

		expect(() => {
			@Model.Discriminator(A1)
			class B1 extends A1 {
				@Field(String)
				lastname: string

				@Kind
				type: 'B1'
			}
		}).toThrow(expect.objectContaining({ code }))
	})
})
