import * as mongoose from 'mongoose'
import { Field, Model, schemaFrom, Kind, Plain, SchemaOptions } from '../src'

test('model with custom collection and connection', async () => {
	const db = mongoose.createConnection(process.env.MONGO_URL!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})

	@Model('people', db)
	class UserOther extends Model.I<Partial<UserOther>> {
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
	class User extends Model.I<Omit<User, 'fullname'>> {
		@Field({ type: String, required: true })
		firstname: string

		@Field({ type: String, required: true })
		lastname: string

		get fullname() {
			return this.firstname + ' ' + this.lastname
		}
	}

	@Model.Discriminator(User)
	class Developer extends User {
		@Field([String])
		languages: string[]

		@Kind('developer')
		kind: 'developer'

		constructor(doc?: Plain.Omit<Developer, 'fullname' | 'kind' | '_id'>) {
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

		constructor(doc?: Plain.Omit<Doctor, 'fullname' | 'kind' | '_id'>) {
			super()
		}
	}

	const user = await new User({ firstname: 'Jeremy', lastname: 'B' }).save()
	expect(user.fullname).toBe('Jeremy B')
	expect((user as any).kind).toBeUndefined()

	const developer = await new Developer({ firstname: 'Jeremy', lastname: 'B', languages: ['JS', 'GO'] }).save()
	expect(developer.fullname).toBe('Jeremy B')
	expect(developer.kind).toBe('developer')

	const doctor = await new Doctor({ firstname: 'Jeremy', lastname: 'B', specialty: 'surgery' }).save()
	expect(doctor.fullname).toBe('Dr Jeremy B')
	expect(doctor.specialty).toBe('surgery')
	expect(doctor.kind).toBe('doctor')
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
