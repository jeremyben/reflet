import { SchemaOptions, Field, BaseDiscriminatorKey, Model, FieldDiscriminators, NewDoc } from '../src'

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
