import * as mongoose from 'mongoose'

let Mongoose: typeof mongoose

beforeAll(async () => {
	// https://github.com/shelfio/jest-mongodb#3-configure-mongodb-client
	Mongoose = await mongoose.connect(process.env.MONGO_URL!)
})

afterAll(async () => {
	await Mongoose.connection.close()
})
