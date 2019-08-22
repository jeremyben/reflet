import { Router } from 'express'
import { ClassType, Application } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { getRouterMeta } from './decorators/router.decorators'
import { getRoutesMeta } from './decorators/route.decorators'
import { extractRouteParams, extractRouteParamsMiddlewares } from './decorators/route-param.decorators'
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
	const sharedBeforeMwares = getBeforeMiddlewares(routingClass).map(promisifyHandler)
	const sharedAfterMwares = getAfterMiddlewares(routingClass).map(promisifyHandler)
	const sharedCatchMwares = getCatchMiddlewares(routingClass).map(promisifyErrorHandler)

	// apply shared middlewares to the router instance
	// or to each of the routes if we attach the controller to an app instance

	if (isRouter) {
		for (const beforeMware of sharedBeforeMwares) expressInstance.use(beforeMware)
	}

	for (const { path, verb, methodKey } of routes) {
		const routeBeforeMwares = getBeforeMiddlewares(routingClass, methodKey).map(promisifyHandler)
		const routeAfterMwares = getAfterMiddlewares(routingClass, methodKey).map(promisifyHandler)
		const routeCatchMwares = getCatchMiddlewares(routingClass, methodKey).map(promisifyErrorHandler)

		const routeParamsMwares = extractRouteParamsMiddlewares(routingClass, methodKey)

		const routeHandler = promisifyHandler((req, res, next) => {
			const args = extractRouteParams(routingClass, methodKey, { req, res, next })
			return routingClass.prototype[methodKey].apply(routingClass.prototype, args)
		})

		if (isRouter) {
			expressInstance[verb](
				path,
				routeParamsMwares,
				routeBeforeMwares,
				routeHandler,
				routeAfterMwares,
				routeCatchMwares
			)
		} else {
			// Have same order of middlewares by surrounding route specific ones by shared ones
			expressInstance[verb](
				path,
				sharedBeforeMwares,
				routeParamsMwares,
				routeBeforeMwares,
				routeHandler,
				routeAfterMwares,
				routeCatchMwares,
				sharedAfterMwares,
				sharedCatchMwares
			)
		}
	}

	if (isRouter) {
		for (const afterMware of sharedAfterMwares) expressInstance.use(afterMware)
		for (const catchMware of sharedCatchMwares) expressInstance.use(catchMware)
	}
}
