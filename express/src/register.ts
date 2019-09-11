import { Router, Application, RequestHandler, Response } from 'express'
import { ClassType } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { defaultErrorHandler, makeErrorHandlerRemovable } from './error-handler'
import { isPromise, isReadableStream } from './type-guards'

// Extractors
import { extractRouter } from './router-decorator'
import { extractRoutes } from './route-decorators'
import { extractParams, extractParamsMiddlewares } from './param-decorators'
import { extractMiddlewares, extractCatch } from './middleware-decorators'
import { extractSend } from './send-decorator'

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
			const toSend = extractSend(routingClass, key)

			const handler = promisifyHandler((req, res, next) => {
				const args = extractParams(routingClass, key, { req, res, next })
				const result = routingClass.prototype[key].apply(routingClass.prototype, args)

				// Handle or bypass sending the method's result according to @Send decorator,
				// if the response has already been sent to the client, we also bypass.
				if (!toSend || res.headersSent) return result

				const { json, status, nullStatus, undefinedStatus } = toSend

				if (isPromise(result)) return result.then((value) => send(value))
				else return send(result)

				function send(value: any): Response {
					// Default status
					if (status) res.status(status)

					// Undefined and null status
					if (value === undefined && undefinedStatus) {
						res.status(undefinedStatus)
					} else if (value === null && nullStatus) {
						res.status(nullStatus)
					}

					// Readable stream
					if (isReadableStream(value)) return value.pipe(res)

					// Response object itself
					if (value === res) {
						// A stream is piping to the response so we let it go
						if (res.listenerCount('unpipe') > 0) return res

						// The response will try to send itself, which will cause a cryptic error
						// ('TypeError: Converting circular structure to JSON')
						throw Error('You tried to send the whole Response object')
					}

					if (json) return res.json(value)
					else return res.send(value)
				}
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
