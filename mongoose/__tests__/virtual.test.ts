import * as mongoose from 'mongoose'
import { Field, Virtual, Model, SchemaOptions, Plain } from '../src'

test('virtual prop', async () => {
	@Model()
	@SchemaOptions({
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	})
	class VirtualProp extends Model.I {
		@Field(String)
		name: string

		@Virtual
		age: number

		inv: number
	}

	const doc = new VirtualProp()
	doc.name = 'test'
	doc.age = 1
	doc.inv = 2

	expect(doc).toHaveProperty('age')
	expect(doc).toHaveProperty('inv')

	const saved = await doc.save()

	expect(saved).toMatchObject({ age: 1, inv: 2 })

	const retrieved = await VirtualProp.findById(saved._id)

	expect(retrieved!.age).toBeUndefined()

	retrieved!.age = 6
	retrieved!.inv = 8

	expect(retrieved).toMatchObject({ age: 6, inv: 8 })

	const plain = retrieved!.toObject()
	expect(plain).toMatchObject({ age: 6 })
	expect(plain).not.toMatchObject({ inv: 8 })

	const json = retrieved!.toJSON()
	expect(json).toMatchObject({ age: 6 })
	expect(json).not.toMatchObject({ inv: 8 })
})

test('virtual populate', async () => {
	type NewTrack = Plain<Track, { Optional: '_id' }>

	@Model()
	class Track extends Model.I {
		static create(doc: NewTrack, options?: mongoose.SaveOptions): Promise<Track>
		// @ts-ignore implementation
		static create(docs: NewTrack[]): Promise<Track[]>

		@Field(String)
		title: string

		constructor(doc?: NewTrack) {
			super()
		}
	}

	type NewBand = Plain<Band, { Optional: '_id' }>

	@Model()
	class Band extends Model.I {
		static create(doc: NewBand, options?: mongoose.SaveOptions): Promise<Band>
		// @ts-ignore implementation
		static create(docs: NewBand[]): Promise<Band[]>

		@Field(String)
		lead: string

		constructor(doc?: NewBand) {
			super()
		}
	}

	@Model()
	@SchemaOptions({
		toObject: { virtuals: true },
	})
	class Album extends Model.I {
		@Field([mongoose.Schema.Types.ObjectId])
		trackIds: mongoose.Types.ObjectId[]

		@Virtual.Populate<Album, Track>({
			ref: 'Track',
			foreignField: '_id',
			localField: 'trackIds',
		})
		readonly tracks?: Track[]

		@Field({ type: mongoose.Schema.Types.ObjectId, required: true })
		bandId: mongoose.Types.ObjectId

		@Virtual.Populate<Album, Band>({
			ref: 'Band',
			foreignField: '_id',
			localField: 'bandId',
			justOne: true,
			options: { lean: true },
		})
		readonly band?: Band

		constructor(doc?: Plain<Album, { Omit: 'tracks' | 'band'; Optional: '_id' }>) {
			super()
		}
	}

	const virtualType = Album.schema.virtualpath('band')
	expect(virtualType).toBeInstanceOf(mongoose.VirtualType)

	const tracks = await Track.create([{ title: 'Yolo' }, { title: 'Yala' }])
	const band = await Band.create({ lead: 'Jeremy' })
	const album = await new Album({ trackIds: tracks.map((t) => t._id), bandId: band._id }).save()

	await album.populate('tracks band')

	expect(album.bandId.equals(album.band?._id)).toBe(true)
	expect(album.band?.lead).toBe('Jeremy')

	expect(album.tracks).toHaveLength(album.trackIds.length)
})
