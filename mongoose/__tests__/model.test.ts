import { Field, Model, SchemaOptions, schemaFrom, NewDoc, FieldDiscriminators, BaseDiscriminatorKey } from '../src'
import Mongoose from 'mongoose'

let mongoose: typeof Mongoose

beforeAll(async () => {
	// https://github.com/shelfio/jest-mongodb#3-configure-mongodb-client
	mongoose = await Mongoose.connect(process.env.MONGO_URL!, { useNewUrlParser: true, useUnifiedTopology: true })
})

afterAll(async () => {
	await mongoose.connection.close()
})

test('simple model', async () => {
	@Model()
	class Simple extends Model.Interface {
		static col() {
			return this.collection.collectionName
		}

		@Field({ type: String, required: true })
		firstname: string

		@Field.Type(String)
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

		constructor(doc?: NewDoc<Simple>) {
			super()
		}
	}

	expect(Simple.schema.obj).toStrictEqual({ firstname: { type: String, required: true }, lastname: String })
	expect(Simple.col()).toBe('simples')

	const simple = await new Simple({ firstname: 'Jeremy' }).save()
	expect(simple.version()).toBe(simple.__v)
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

		constructor(doc?: NewDoc<User>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Developer extends User {
		@Field.Type([String])
		languages: string[]

		@BaseDiscriminatorKey('developer')
		kind: 'developer'

		constructor(doc?: NewDoc<Developer>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Doctor extends User {
		@Field.Type(String)
		specialty: string

		@BaseDiscriminatorKey('doctor')
		kind: 'doctor'

		get fullname() {
			return 'Dr ' + this.firstname + ' ' + this.lastname
		}

		constructor(doc?: NewDoc<Doctor>) {
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

/**
 * https://mongoosejs.com/docs/discriminators.html#embedded-discriminators-in-arrays
 */
test('embedded discriminators in arrays', async () => {
	@SchemaOptions({ _id: false })
	abstract class Event {
		@Field.Type(String)
		message: string
	}

	abstract class Clicked extends Event {
		@Field({ type: String, required: true })
		element: string

		@BaseDiscriminatorKey
		kind: 'Clicked'
	}

	abstract class Purchased extends Event {
		@Field({ type: String, required: true })
		product: string

		@BaseDiscriminatorKey
		kind: 'Purchased'
	}

	@Model()
	@SchemaOptions({})
	class Batch extends Model.Interface {
		@FieldDiscriminators([Clicked, Purchased])
		events: (Clicked | Purchased)[]

		constructor(doc?: NewDoc<Batch>) {
			super()
		}
	}

	const batch = await new Batch({
		events: [
			{ kind: 'Clicked', element: '#hero', message: 'hello' },
			{ kind: 'Purchased', product: 'action-figure', message: 'world' },
		],
	}).save()

	console.log('batch', batch)
})
