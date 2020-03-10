import { Field, Model, schemaFrom, NewDoc, Kind } from '../src'

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

	const simpleSchema = schemaFrom(Simple)
	expect(simpleSchema.obj).toStrictEqual({ firstname: { type: String, required: true }, lastname: String })

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

		@Kind('developer')
		kind: 'developer'

		constructor(doc?: NewDoc<Developer>) {
			super()
		}
	}

	@Model.Discriminator(User)
	class Doctor extends User {
		@Field.Type(String)
		specialty: string

		@Kind('doctor')
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
