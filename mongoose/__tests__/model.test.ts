import * as mongoose from 'mongoose'
import { Field, Model, schemaFrom, Kind, Plain, SchemaOptions, SchemaCallback, PostHook, PreHook } from '../src'

test('model with custom collection and connection', async () => {
	const db = mongoose.createConnection(process.env.MONGO_URL!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})

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
	class User extends Model.I {
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

		constructor(doc?: Plain<User, { Omit: 'fullname'; Optional: '_id' }>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Developer extends User {
		@Field([String])
		languages: string[]

		@Kind('developer')
		kind: 'developer'

		constructor(doc?: Plain<Developer, { Omit: 'fullname' | 'kind'; Optional: '_id' }>) {
			super()
		}
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

		constructor(doc?: Plain<Doctor, { Omit: 'fullname' | 'kind'; Optional: '_id' }>) {
			super()
		}
	}

	const user = await new User({ firstname: 'Jeremy', lastname: 'Ben' }).save()
	expect(user.fullname).toBe('Jeremy Ben')
	expect((user as any).kind).toBeUndefined()

	const developer = await new Developer({ firstname: 'Jeremy', lastname: 'Ben', languages: ['JS', 'GO'] }).save()
	expect(developer.fullname).toBe('Jeremy Ben')
	expect(developer.kind).toBe('developer')

	const doctor = await new Doctor({ firstname: 'Jeremy', lastname: 'Ben', specialty: 'surgery' }).save()
	expect(doctor.fullname).toBe('Dr Jeremy Ben')
	expect(doctor.specialty).toBe('surgery')
	expect(doctor.kind).toBe('doctor')
})

test('model decorator must be at the top', () => {
	expect(() => {
		@SchemaCallback(() => null)
		@Model()
		class WrongSchemaCallbackOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrowError(/@Model.*WrongSchemaCallbackOrder/)

	expect(() => {
		@PreHook('init', () => undefined)
		@Model()
		class WrongPreHookOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrowError(/@Model.*WrongPreHookOrder/)

	expect(() => {
		@PostHook('init', () => undefined)
		@Model()
		class WrongPostHookOrder extends Model.I {
			@Field(String)
			name: string
		}
	}).toThrowError(/@Model.*WrongPostHookOrder/)

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
	}).toThrowError(/@Model\.Discriminator.*WrongSchemaOptionsOrder/)

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
	}).not.toThrowError()
})

describe('model discriminators coercion', () => {
	test('root model must be decorated', async () => {
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
		}).toThrowError(/decorated/)
	})

	test('siblings should have same kind key', async () => {
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
		}).toThrowError(/sibling/)
	})

	test('kind key should not overwrite options', async () => {
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
		}).toThrowError(/overwrite discriminatorKey/)
	})
})
