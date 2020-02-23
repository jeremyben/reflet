import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

NestFactory.create(AppModule, { logger: false, bodyParser: false }).then((app) => {
	app.listen(3001)
})
