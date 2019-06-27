import { Router } from 'express'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { getRouterMeta } from './decorators/router.decorators'
import { getRoutesMeta } from './decorators/route.decorators'
import {
	getBeforeMiddlewaresMeta,
	getAfterMiddlewaresMeta,
	getCatchMiddlewaresMeta,
} from './decorators/middleware.decorators'
import { extractParams } from './decorators/route-param.decorators'

/**
 * Register routing classes into an express application.
 * @public
 */
export function register(expressApp: Application, routingClasses: ClassType[]) {
	for (const routingClass of routingClasses) {
		const routerMeta = getRouterMeta(routingClass)

		if (routerMeta) {
			// Attach handlers to a new express router
			const expressRouter = Router(routerMeta.options)
			attach(expressRouter, routingClass)
			expressApp.use(routerMeta.prefix, expressRouter)
		} else {
			// Directly attach handlers to the express app
			attach(expressApp, routingClass)
		}
	}
}

function attach(expressInstance: Application | Router, routingClass: ClassType) {
	const isRouter = expressInstance.name === 'router'

	const routes = getRoutesMeta(routingClass)
	const sharedMwares = getBeforeMiddlewaresMeta(routingClass)
	const afterSharedMwares = getAfterMiddlewaresMeta(routingClass)
	const catchSharedMwares = getCatchMiddlewaresMeta(routingClass)

	// apply shared middlewares to the router instance or to each of the routes if we attach the controller to an app instance

	if (isRouter) {
		for (const mware of sharedMwares) expressInstance.use(promisifyHandler(mware))
	}

	for (const { path, verb, methodKey } of routes) {
		const routeMwares = getBeforeMiddlewaresMeta(routingClass, methodKey)
		const afterRouteMwares = getAfterMiddlewaresMeta(routingClass, methodKey)
		const catchRouteMwares = getCatchMiddlewaresMeta(routingClass, methodKey)

		const routeHandler = promisifyHandler((req, res, next) => {
			const args = extractParams(routingClass, methodKey, { req, res, next })
			const result = routingClass.prototype[methodKey].apply(routingClass.prototype, args)
			return result
		})

		if (isRouter) {
			expressInstance[verb](
				path,
				...routeMwares.map(promisifyHandler),
				routeHandler,
				...afterRouteMwares.map(promisifyHandler),
				...catchRouteMwares.map(promisifyErrorHandler)
			)
		} else {
			expressInstance[verb](
				path,
				...sharedMwares.map(promisifyHandler),
				...routeMwares.map(promisifyHandler),
				routeHandler,
				...afterRouteMwares.map(promisifyHandler),
				...afterSharedMwares.map(promisifyHandler),
				...catchRouteMwares.map(promisifyErrorHandler),
				...catchSharedMwares.map(promisifyErrorHandler)
			)
		}
	}

	if (isRouter) {
		for (const mware of afterSharedMwares) expressInstance.use(promisifyHandler(mware))
		for (const mware of catchSharedMwares) expressInstance.use(promisifyErrorHandler(mware))
	}
}
