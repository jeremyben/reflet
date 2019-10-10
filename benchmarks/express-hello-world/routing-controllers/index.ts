import { createExpressServer } from 'routing-controllers'
import { AppController } from './app.controller'

const app = createExpressServer({ controllers: [AppController] })

app.listen(3000)
