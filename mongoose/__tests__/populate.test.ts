import * as mongoose from 'mongoose'
import { Field, PopulateVirtual, Model, SchemaOptions, Plain } from '../src'

test('virtual populate', async () => {
	type NewTrack = Plain<Track, { Optional: '_id' }>

	@Model()
	class Track extends Model.I {
		@Field(String)
		title: string

		constructor(doc?: NewTrack) {
			super()
		}
	}

	type NewBand = Plain<Band, { Optional: '_id' }>

	@Model()
	class Band extends Model.I {
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

		@PopulateVirtual<Track, Album>({
			ref: Track,
			foreignField: '_id',
			localField: 'trackIds',
		})
		readonly tracks?: Track[]

		@Field({ type: mongoose.Schema.Types.ObjectId, required: true })
		bandId: mongoose.Types.ObjectId

		@PopulateVirtual<Band, Album>({
			ref: Band,
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

	await album.populate('tracks band').execPopulate()

	expect(album.bandId.equals(album.band?._id)).toBe(true)
	expect(album.band?.lead).toBe('Jeremy')

	expect(album.tracks).toHaveLength(album.trackIds.length)
})
