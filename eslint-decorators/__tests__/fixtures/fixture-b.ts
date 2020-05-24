// tslint:disable no-duplicate-imports
import { Get, Put, Params, Send, Method, Delete, Res, Patch, Post } from '@reflet/express'
import * as reflet from '@reflet/express'

import { Application, Request } from 'express'
import * as e from 'express'

const Options = (path: string) => Method('options', path)

class Controller {
	@Send()
	@Get('/users/:id/things/:name')
	get(@Params('id') id: string, @Params('nam') name: string) {
		return 'done'
	}

	@Put('')
	put(@Res res: any, @reflet.Req() req?: any, @Params param?: { [name: string]: string }) {
		res.send('done')
	}
}
