import Mongoose from 'mongoose'

let mongoose: typeof Mongoose

beforeAll(async () => {
	// https://github.com/shelfio/jest-mongodb#3-configure-mongodb-client
	mongoose = await Mongoose.connect(process.env.MONGO_URL!, { useNewUrlParser: true, useUnifiedTopology: true })
})

afterAll(async () => {
	await mongoose.connection.close()
})
