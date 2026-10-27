import { Controller, Get, Send } from '@reflet/express'
import { Request, Response } from 'express'

@Send()
@Controller('')
export class AppController {
	@Get('/')
	get(req: Request, res: Response) {
		return 'Hello world'
	}
}
