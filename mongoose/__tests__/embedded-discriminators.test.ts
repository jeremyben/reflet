import mongoose from 'mongoose'
import { SchemaOptions, Field, Kind, Model, Plain } from '../src'

/**
 * https://mongoosejs.com/docs/discriminators.html#single-nested-discriminators
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

		constructor(doc?: Plain.Partial<Shape>) {
			super()
		}
	}

	const circle = new Shape({ shape: { __t: 'Circle', radius: 5 } })
	const circleObject = circle.toObject() as Plain<Shape>
	expect(circleObject).toStrictEqual({
		_id: expect.any(mongoose.Types.ObjectId),
		shape: {
			_id: expect.any(mongoose.Types.ObjectId),
			radius: 5,
			__t: 'Circle',
		},
	})

	const wrongSquare = new Shape({ shape: { side: 5 } as any })
	const wrongSquareObject = wrongSquare.toObject() as Plain<Shape>
	expect(wrongSquareObject).toStrictEqual({
		_id: expect.any(mongoose.Types.ObjectId),
		shape: {},
	})
})

/**
 * https://mongoosejs.com/docs/discriminators.html#embedded-discriminators-in-arrays
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

		constructor(doc?: Plain.Partial<Batch>) {
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
