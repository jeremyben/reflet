import { Get, Router, Send } from '@reflet/express'
import { Request, Response } from 'express'

@Send()
@Router('')
export class AppController {
	@Get('/')
	get(req: Request, res: Response) {
		return 'Hello world'
	}
}
