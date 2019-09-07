import { Router, Application, RequestHandler } from 'express'
import { ClassType } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { defaultErrorHandler, makeErrorHandlerRemovable } from './error-handler'

// Extractors
import { extractRouter } from './router-decorator'
import { extractRoutes } from './route-decorators'
import { extractParams, extractParamsMiddlewares } from './param-decorators'
import { extractMiddlewares, extractCatch } from './middleware-decorators'

/**
 * Register routing classes to an express application.
 *
 * @param app - express app instance.
 * @param routingClasses - classes with decorated routes.
 *
 * @public
 */
export function register(app: Application, routingClasses: ClassType[]): Application {
	const globalMwares = getGlobalMiddlewares(app)

	for (const routingClass of routingClasses) {
		// Either attach middlewares/handlers to an intermediary router or directly to the app.
		const routerMeta = extractRouter(routingClass)
		const instance = routerMeta ? Router(routerMeta.options) : app

		const routes = extractRoutes(routingClass)
		const sharedMwares = extractMiddlewares(routingClass)
		const sharedCatch = extractCatch(routingClass)

		// Apply shared middlewares to the router instance
		// or to each of the routes if the class is attached on the base app.

		if (routerMeta) {
			for (const mware of sharedMwares) instance.use(promisifyHandler(mware))
		}

		for (const { path, method, key } of routes) {
			const routeMwares = extractMiddlewares(routingClass, key)
			const routeCatch = extractCatch(routingClass, key)
			const paramsMwares = extractParamsMiddlewares(routingClass, key, [
				globalMwares,
				sharedMwares,
				routeMwares,
			])

			const handler = promisifyHandler((req, res, next) => {
				const args = extractParams(routingClass, key, { req, res, next })
				return routingClass.prototype[key].apply(routingClass.prototype, args)
			})

			if (routerMeta) {
				instance[method](
					path,
					routeMwares.map(promisifyHandler),
					paramsMwares.map(promisifyHandler),
					handler,
					routeCatch.map(promisifyErrorHandler)
				)
			} else {
				// Have same order of middlewares by surrounding route specific ones by shared ones.
				instance[method](
					path,
					sharedMwares.map(promisifyHandler),
					routeMwares.map(promisifyHandler),
					paramsMwares.map(promisifyHandler),
					handler,
					routeCatch.map(promisifyErrorHandler),
					sharedCatch.map(promisifyErrorHandler)
				)
			}
		}

		if (routerMeta) {
			for (const catch_ of sharedCatch) instance.use(promisifyErrorHandler(catch_))

			// Finally attach the router to the app
			app.use(routerMeta.prefix, instance)
		}
	}

	app.use(defaultErrorHandler)
	makeErrorHandlerRemovable(app)

	return app
}

/**
 * @internal
 */
export function getGlobalMiddlewares(app: Application): RequestHandler[] {
	const globalMwares: RequestHandler[] = []

	for (const layer of (app._router || []).stack || []) {
		if (
			layer.name !== 'query' &&
			layer.name !== 'expressInit' &&
			layer.name !== 'router' &&
			layer.name !== 'bound dispatch'
		) {
			globalMwares.push(layer.handle)
		}
	}

	return globalMwares
}
