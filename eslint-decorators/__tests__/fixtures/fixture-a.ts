import { Patch, Post, Method, Send, Next, Res, Req, Put, Params, Decorator, Router } from '@reflet/express'
import { Response, Request } from 'express'

type RequestWithUser = Request & { get: string }

function Options(path: string | RegExp = ''): Decorator.Route<'options'> & Decorator.Send<'method'> {
	return (target: any, key: any, descriptor: any) => {
		Send()(target, key, descriptor)
		return Method('options', path)(target, key, descriptor)
	}
}

// const Dummy: MethodDecorator = () => undefined
// const Get: (path: string) => MethodDecorator = (path) => () => undefined
@Router('/user/:class', { mergeParams: true })
class Controller {
	@Patch()
	patch(req: RequestWithUser, res: any, next: import('express').NextFunction) {
		res.send('done')
	}

	@Patch()
	@Post()
	post(@Req req: any, @Res res: Response, @Next next: any) {
		res.send('done')
	}

	@Options('/:foo/:id?/:o')
	@Put('/:foo/:id')
	put(
		@Res res: Response,
		@Params param: { class: string; foo: string; id?: string; o?: string },
		@Params('id') id: string | undefined,
		@Params('foo') foo: string
	) {}
}
