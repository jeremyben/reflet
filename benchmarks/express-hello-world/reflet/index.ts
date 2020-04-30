import 'reflect-metadata'

import * as express from 'express'
import { register } from '@reflet/express'
import { AppController } from './app.controller'

const app = express()

register(app, [AppController])

app.listen(3001)
