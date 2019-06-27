declare interface ClassType<T = any> extends Function {
	new (...args: any[]): T
}

type Application = import('express').Application
type RouterOptions = import('express').RouterOptions
type Request = import('express').Request
type Response = import('express').Response
type NextFunction = import('express').NextFunction
type RequestHandler = import('express').RequestHandler
type ErrorRequestHandler = import('express').ErrorRequestHandler
