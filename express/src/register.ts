import { Router } from 'express'
import { ClassType, Application } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { getRouterMeta } from './decorators/router.decorators'
import { getRoutesMeta } from './decorators/route.decorators'
import { extractRouteParams } from './decorators/route-param.decorators'
import {
	getBeforeMiddlewares,
	getAfterMiddlewares,
	getCatchMiddlewares,
} from './decorators/middleware.decorators'

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

/**
 * Attach a single routing class and all its middlewares/handlers to an express app or router.
 * @internal
 */
function attach(expressInstance: Application | Router, routingClass: ClassType) {
	const isRouter = expressInstance.name === 'router'

	const routes = getRoutesMeta(routingClass)
	const sharedMwares = getBeforeMiddlewares(routingClass)
	const afterSharedMwares = getAfterMiddlewares(routingClass)
	const catchSharedMwares = getCatchMiddlewares(routingClass)

	// apply shared middlewares to the router instance
	// or to each of the routes if we attach the controller to an app instance

	if (isRouter) {
		for (const mware of sharedMwares) expressInstance.use(promisifyHandler(mware))
	}

	for (const { path, verb, methodKey } of routes) {
		const routeMwares = getBeforeMiddlewares(routingClass, methodKey)
		const afterRouteMwares = getAfterMiddlewares(routingClass, methodKey)
		const catchRouteMwares = getCatchMiddlewares(routingClass, methodKey)

		const routeHandler = promisifyHandler((req, res, next) => {
			const args = extractRouteParams(routingClass, methodKey, { req, res, next })
			return routingClass.prototype[methodKey].apply(routingClass.prototype, args)
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
				...catchRouteMwares.map(promisifyErrorHandler),
				...afterSharedMwares.map(promisifyHandler),
				...catchSharedMwares.map(promisifyErrorHandler)
			)
		}
	}

	if (isRouter) {
		for (const mware of afterSharedMwares) expressInstance.use(promisifyHandler(mware))
		for (const mware of catchSharedMwares) expressInstance.use(promisifyErrorHandler(mware))
	}
}
