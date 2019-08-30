import { Router, Application } from 'express'
import { ClassType } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { extractRouter } from './decorators/router.decorators'
import { extractRoutingMethods } from './decorators/route.decorators'
import { extractParams, extractParamsMiddlewares } from './decorators/param.decorators'
import { extractMiddlewares } from './decorators/middleware.decorators'
import { extractCatch } from './decorators/catch.decorators'

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
	const sharedMwares = extractMiddlewares(routingClass)
	const sharedCatch = extractCatch(routingClass)

	// apply shared middlewares to the router instance
	// or to each of the routes if we attach the controller to an app instance

	if (isRouter) {
		for (const mware of sharedMwares) expressInstance.use(promisifyHandler(mware))
	}

	for (const { path, verb, methodKey } of routes) {
		const routeMwares = extractMiddlewares(routingClass, methodKey)
		const routeCatch = extractCatch(routingClass, methodKey)

		const paramsMwares = extractParamsMiddlewares(routingClass, methodKey, [sharedMwares, routeMwares])

		const routeHandler = promisifyHandler((req, res, next) => {
			const args = extractParams(routingClass, methodKey, { req, res, next })
			return routingClass.prototype[methodKey].apply(routingClass.prototype, args)
		})

		if (isRouter) {
			expressInstance[verb](
				path,
				routeMwares.map(promisifyHandler),
				paramsMwares.map(promisifyHandler),
				routeHandler,
				routeCatch.map(promisifyErrorHandler)
			)
		} else {
			// Have same order of middlewares by surrounding route specific ones by shared ones
			expressInstance[verb](
				path,
				sharedMwares.map(promisifyHandler),
				routeMwares.map(promisifyHandler),
				paramsMwares.map(promisifyHandler),
				routeHandler,
				routeCatch.map(promisifyErrorHandler),
				sharedCatch.map(promisifyErrorHandler)
			)
		}
	}

	if (isRouter) {
		for (const catch_ of sharedCatch) expressInstance.use(promisifyErrorHandler(catch_))
	}
}
