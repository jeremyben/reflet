import mongoose from 'mongoose'
import { Field, Model, schemaFrom, Kind, Plain } from '../src'

test('model with custom collection and connection', async () => {
	const db = mongoose.createConnection(process.env.MONGO_URL!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})

	@Model('people', db)
	class UserOther extends Model.Interface {
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

test('model discriminator', async () => {
	@Model()
	class User extends Model.Interface {
		@Field({ type: String, required: true })
		firstname: string

		@Field({ type: String, required: true })
		lastname: string

		get fullname() {
			return this.firstname + ' ' + this.lastname
		}

		constructor(doc?: Plain.Without<User, 'fullname' | '_id'>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Developer extends User {
		@Field([String])
		languages: string[]

		@Kind('developer')
		kind: 'developer'

		constructor(doc?: Plain.Without<Developer, 'fullname' | 'kind' | '_id'>) {
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

		constructor(doc?: Plain.Without<Doctor, 'fullname' | 'kind' | '_id'>) {
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
