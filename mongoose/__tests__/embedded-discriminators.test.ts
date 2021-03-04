import * as mongoose from 'mongoose'
import { SchemaOptions, Field, Kind, DiscriminatorKey, Model, Plain } from '../src'

/**
 * https://mongoosejs.com/docs/discriminators#single-nested-discriminators
 */
test('single nested discriminators', async () => {
	abstract class Circle {
		@Field(Number)
		radius: number

		__t: 'Circle'
	}

	abstract class Square {
		@Field(Number)
		side: number

		__t: 'Square'
	}

	@Model()
	class Shape extends Model.I {
		@Field.Union(Circle, Square)
		shape: Circle | Square

		constructor(doc?: Plain.Optional<Shape, '_id'>) {
			super()
		}
	}

	const circle = new Shape({ shape: { __t: 'Circle', radius: 5 } })
	const circleObject = circle.toObject()
	expect(circleObject).toStrictEqual({
		_id: expect.any(mongoose.Types.ObjectId),
		shape: {
			_id: expect.any(mongoose.Types.ObjectId),
			radius: 5,
			__t: 'Circle',
		},
	})

	const wrongSquare = new Shape({ shape: { side: 5 } } as any)
	const wrongSquareObject = wrongSquare.toObject()
	expect(wrongSquareObject).toStrictEqual({
		_id: expect.any(mongoose.Types.ObjectId),
		shape: {},
	})
})

/**
 * https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
 */
test('embedded discriminators in arrays', async () => {
	@SchemaOptions({ _id: false })
	abstract class Event {
		@Field(String)
		message: string
	}

	abstract class Clicked extends Event {
		@Field({ type: String, required: true })
		element: string

		@Kind
		kind: 'Clicked'
	}

	abstract class Purchased extends Event {
		@Field({ type: String, required: true })
		product: string

		@Kind
		kind: 'Purchased'
	}

	@Model()
	class Batch extends Model.I {
		@Field.ArrayOfUnion(Clicked, Purchased)
		events: (Clicked | Purchased)[]

		constructor(doc?: Plain.Optional<Batch, '_id'>) {
			super()
		}
	}

	const events: Batch['events'] = [
		{ kind: 'Clicked', element: '#hero', message: 'hello' },
		{ kind: 'Purchased', product: 'action-figure', message: 'world' },
	]
	const batch = new Batch({ events })
	expect(batch.toObject()).toStrictEqual({ _id: expect.any(mongoose.Types.ObjectId), events })
})

/**
 * https://mongoosejs.com/docs/discriminators.html#recursive-embedded-discriminators-in-arrays
 */
test('recursive embedded discriminators in arrays', async () => {
	SchemaOptions({ _id: false })
	class SubEvent {
		@Field(String)
		message: string

		@Field.ArrayOfUnion([SubEvent])
		sub_events: SubEvent[]

		@DiscriminatorKey
		kind: 'SubEvent'
	}

	@Model()
	class EventList extends Model.I {
		@Field.ArrayOfUnion([SubEvent])
		events: SubEvent[]
	}

	const list: Plain.Omit<EventList, '_id'> = {
		events: [
			{
				kind: 'SubEvent',
				sub_events: [{ kind: 'SubEvent', sub_events: [], message: 'test1' }],
				message: 'hello',
			},
			{
				kind: 'SubEvent',
				sub_events: [
					{
						kind: 'SubEvent',
						sub_events: [{ kind: 'SubEvent', sub_events: [], message: 'test3' }],
						message: 'test2',
					},
				],
				message: 'world',
			},
		],
	}

	const doc = await EventList.create(list)

	expect(doc.events).toHaveLength(2)

	expect(doc.events[0].sub_events[0].message).toBe('test1')
	expect(doc.events[0].message).toBe('hello')

	expect(doc.events[1].sub_events[0].sub_events[0].message).toBe('test3')
	expect(doc.events[1].message).toBe('world')
})

test('nested discriminators kind key coercion', async () => {
	abstract class N1 {
		@Field(Number)
		radius: number

		@DiscriminatorKey
		kind: 'N1'
	}

	abstract class N2 {
		@Field(Number)
		side: number

		@DiscriminatorKey('n2')
		type: 'n2'
	}

	expect(() => {
		@Model()
		class N extends Model.I {
			@Field.Union(N1, N2)
			shape: N1 | N2
		}
	}).toThrowError(/sibling/)
})

describe('union options', () => {
	@SchemaOptions({ _id: false })
	abstract class R1 {
		@Field({ type: Number, required: true })
		radius: number

		__t: 'R1'
	}

	@SchemaOptions({ _id: false })
	abstract class R2 {
		@Field({ type: Number, required: true })
		side: number

		__t: 'R2'
	}

	test('required field', async () => {
		@Model()
		class RequiredField extends Model.I {
			@Field(String)
			name: string

			@Field.Union([R1, R2], { required: true })
			shape: R1 | R2
		}

		const doc = new RequiredField({ name: 'test' })
		const validationError = doc.validateSync()
		expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError)
		expect(validationError!.errors.shape).toHaveProperty('kind', 'required')
	})

	test('required discriminatorKey', async () => {
		@Model()
		@SchemaOptions({ versionKey: false })
		class RequiredKindAndField extends Model.I {
			@Field(String)
			name: string

			@Field.ArrayOfUnion([R1, R2], { required: true, strict: true })
			shapes: (R1 | R2)[]
		}

		const a = new RequiredKindAndField({ name: 'test' })
		expect(a.validateSync()).toBeUndefined()
		expect(a).toHaveProperty('_id')
		expect(a).toHaveProperty('name')
		expect(a.toObject().shapes).toEqual([])

		const b = new RequiredKindAndField({
			name: 'test',
			shapes: [
				{ __t: 'R1', radius: 1 },
				{ __t: 'R2', side: 1 },
			],
		})
		expect(b.validateSync()).toBeUndefined()
		expect(b.toObject().shapes).toStrictEqual([
			{ __t: 'R1', radius: 1 },
			{ __t: 'R2', side: 1 },
		])

		const c = new RequiredKindAndField({ name: 'test', shapes: [{}] })
		const validationError = c.validateSync()
		expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError)
		expect(validationError!.errors['shapes.0.__t']).toHaveProperty('kind', 'required')
	})

	test('required discriminatorKey but not field', async () => {
		@Model()
		class RequiredKind extends Model.I {
			@Field(String)
			name: string

			@Field.Union([R1, R2], { strict: true })
			shape: R1 | R2
		}

		const a = new RequiredKind({ name: 'test' })
		expect(a.validateSync()).toBeUndefined()
		expect(a).toHaveProperty('_id')
		expect(a).toHaveProperty('name')
		expect(a.shape).toBeUndefined()

		const b = new RequiredKind({ name: 'test', shape: { __t: 'R2', side: 2 } })
		expect(b.validateSync()).toBeUndefined()
		expect(b).toHaveProperty('_id')
		expect(b).toHaveProperty('name')
		expect(b.toObject().shape).toStrictEqual({ __t: 'R2', side: 2 })

		const c = new RequiredKind({ name: 'test', shape: {} })
		const validationError = c.validateSync()
		expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError)
		expect(validationError!.errors['shape.__t']).toHaveProperty('kind', 'required')
	})
})
