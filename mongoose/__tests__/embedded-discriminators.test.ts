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
