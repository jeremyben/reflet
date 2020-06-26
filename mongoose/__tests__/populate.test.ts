import * as mongoose from 'mongoose'
import { Field, PopulateVirtual, Model, SchemaOptions } from '../src'

test('virtual populate', async () => {
	@Model()
	class Track extends Model.I<Track> {
		@Field(String)
		title: string
	}

	@Model()
	class Band extends Model.I<Band> {
		@Field(String)
		lead: string
	}

	@Model()
	@SchemaOptions({
		toObject: { virtuals: true },
	})
	class Album extends Model.I<Omit<Album, 'band' | 'tracks'>> {
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
