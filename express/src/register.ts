import { Router, Application } from 'express'
import { ClassType } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { extractRouter } from './decorators/router.decorators'
import { extractRoutingMethods } from './decorators/route.decorators'
import { extractRouteParams, extractRouteParamsMiddlewares } from './decorators/route-param.decorators'
import {
	extractBeforeMiddlewares,
	extractAfterMiddlewares,
	extractCatchMiddlewares,
} from './decorators/middleware.decorators'

/**
 * Register routing classes into an express application.
 * @public
 */
export function register(expressApp: Application, routingClasses: ClassType[]) {
	for (const routingClass of routingClasses) {
		const routerMeta = extractRouter(routingClass)

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

	const routes = extractRoutingMethods(routingClass)
	const sharedBeforeMwares = extractBeforeMiddlewares(routingClass)
	const sharedAfterMwares = extractAfterMiddlewares(routingClass)
	const sharedCatchMwares = extractCatchMiddlewares(routingClass)

	// apply shared middlewares to the router instance
	// or to each of the routes if we attach the controller to an app instance

	if (isRouter) {
		for (const beforeMware of sharedBeforeMwares) expressInstance.use(promisifyHandler(beforeMware))
	}

	for (const { path, verb, methodKey } of routes) {
		const routeBeforeMwares = extractBeforeMiddlewares(routingClass, methodKey)
		const routeAfterMwares = extractAfterMiddlewares(routingClass, methodKey)
		const routeCatchMwares = extractCatchMiddlewares(routingClass, methodKey)

		const routeParamsMwares = extractRouteParamsMiddlewares(routingClass, methodKey, [
			sharedBeforeMwares,
			routeBeforeMwares,
		])

		const routeHandler = promisifyHandler((req, res, next) => {
			const args = extractRouteParams(routingClass, methodKey, { req, res, next })
			return routingClass.prototype[methodKey].apply(routingClass.prototype, args)
		})

		if (isRouter) {
			expressInstance[verb](
				path,
				routeParamsMwares.map(promisifyHandler),
				routeBeforeMwares.map(promisifyHandler),
				routeHandler,
				routeAfterMwares.map(promisifyHandler),
				routeCatchMwares.map(promisifyErrorHandler)
			)
		} else {
			// Have same order of middlewares by surrounding route specific ones by shared ones
			expressInstance[verb](
				path,
				sharedBeforeMwares.map(promisifyHandler),
				routeParamsMwares.map(promisifyHandler),
				routeBeforeMwares.map(promisifyHandler),
				routeHandler,
				routeAfterMwares.map(promisifyHandler),
				routeCatchMwares.map(promisifyErrorHandler),
				sharedAfterMwares.map(promisifyHandler),
				sharedCatchMwares.map(promisifyErrorHandler)
			)
		}
	}

	if (isRouter) {
		for (const afterMware of sharedAfterMwares) expressInstance.use(promisifyHandler(afterMware))
		for (const catchMware of sharedCatchMwares) expressInstance.use(promisifyErrorHandler(catchMware))
	}
}
