import { Router, Application, RequestHandler, Response } from 'express'
import { ClassType } from './interfaces'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { globalErrorHandler, makeGlobalErrorHandlerRemovable } from './global-error-handler'
import { isPromise, isReadableStream } from './type-guards'

// Extractors
import { extractRouter } from './router-decorator'
import { extractRoutes } from './route-decorators'
import { extractMiddlewares } from './middleware-decorator'
import { extractErrorHandlers } from './error-handler-decorator'
import { extractParams, extractParamsMiddlewares } from './param-decorators'
import { extractSend } from './send-decorator'

/**
 * Main method to register controllers into an express application.
 * @param app - express application.
 * @param controllers - classes with decorated routes.
 *
 * @example
 * ```ts
 * class Foo {
 *   ＠Get('/some')
 *   get() {}
 * }
 * const app = express()
 * register(app, [Foo]) // where the magic happens
 * app.listen(3000)
 * ```
 * ------
 * @public
 */
export function register(app: Application, controllers: ClassType<any>[]): Application {
	const globalMwares = getGlobalMiddlewares(app)

	for (const controller of controllers) {
		// Create an instance if the user wants to define and use class properties
		// (before, Reflet only used the prototype, because a controller is mostly about methods).
		const controllerInstance = new controller()

		// Either attach middlewares/handlers to an intermediary router or directly to the app.
		const router = extractRouter(controller)
		const appInstance = router ? Router(router.options) : app

		const routes = extractRoutes(controller)
		const sharedMwares = extractMiddlewares(controller)
		const sharedErrHandlers = extractErrorHandlers(controller)

		if (!routes.length) {
			console.warn(`${controller.name} doesn't have any route to register.`)
		}

		// Apply shared middlewares to the router instance
		// or to each of the routes if the class is attached on the base app.

		if (router) {
			for (const mware of sharedMwares) appInstance.use(promisifyHandler(mware))
		}

		for (const { path, method, key } of routes) {
			const routeMwares = extractMiddlewares(controller, key)
			const routeErrHandlers = extractErrorHandlers(controller, key)
			const paramsMwares = extractParamsMiddlewares(controller, key, [globalMwares, sharedMwares, routeMwares])
			const toSend = extractSend(controller, key)

			const handler = promisifyHandler((req, res, next) => {
				const args = extractParams(controller, key, { req, res, next })
				const result = controllerInstance[key].apply(controllerInstance, args)

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

			if (router) {
				appInstance[method](
					path,
					routeMwares.map(promisifyHandler),
					paramsMwares.map(promisifyHandler),
					handler,
					routeErrHandlers.map(promisifyErrorHandler)
				)
			} else {
				// Have same order of middlewares by surrounding route specific ones by shared ones.
				appInstance[method](
					path,
					sharedMwares.map(promisifyHandler),
					routeMwares.map(promisifyHandler),
					paramsMwares.map(promisifyHandler),
					handler,
					routeErrHandlers.map(promisifyErrorHandler),
					sharedErrHandlers.map(promisifyErrorHandler)
				)
			}
		}

		if (router) {
			for (const errHandler of sharedErrHandlers) appInstance.use(promisifyErrorHandler(errHandler))

			// Finally attach the router to the app
			app.use(router.root, appInstance)
		}
	}

	app.use(globalErrorHandler)
	makeGlobalErrorHandlerRemovable(app)

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
