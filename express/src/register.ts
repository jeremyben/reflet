import { Router, Application, RequestHandler, Response } from 'express'
import { promisifyHandler, promisifyErrorHandler } from './async-wrapper'
import { globalErrorHandler, makeGlobalErrorHandlerRemovable } from './global-error-handler'
import { ClassType, ObjectNotFunction } from './interfaces'
import { isPromise, isReadableStream, isClass } from './type-guards'
import { concatFast } from './array-manipulation'

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
 * @param controllers - classes or instances with decorated routes.
 *
 * @example
 * ```ts
 * class Foo {
 *   ＠Get('/some')
 *   get() {}
 * }
 * const app = express()
 * register(app, [Foo])
 * app.listen(3000)
 *
 * // ------
 * // or with instantiation:
 * register(app, [new Foo()])
 * ```
 * ------
 * @public
 */
export function register(app: Application, controllers: (new () => any)[] | ObjectNotFunction[]): Application {
	const globalMwares = getGlobalMiddlewares(app)

	for (const controller of controllers) {
		attach(controller, app, globalMwares)
	}

	app.use(globalErrorHandler)
	makeGlobalErrorHandlerRemovable(app)

	return app
}

/**
 * @internal
 */
function attach(
	controller: object,
	app: Router,
	globalMwares: RequestHandler[],
	parentSharedMwares: RequestHandler[] = []
) {
	const controllerInstance = isClass(controller) ? new controller() : controller
	const controllerClass = isClass(controller) ? controller : (controllerInstance.constructor as ClassType)

	// Either attach middlewares/handlers to an intermediary router or directly to the app.
	const routerMeta = extractRouter(controllerClass)
	const appInstance = routerMeta ? Router(routerMeta.options) : app

	const routes = extractRoutes(controllerClass)

	const sharedMwares = extractMiddlewares(controllerClass)
	const sharedErrHandlers = extractErrorHandlers(controllerClass)

	if (!routes.length && !routerMeta) {
		console.warn(`"${controllerClass.name}" doesn't have any route or router to register.`)
	}

	// Apply shared middlewares to the router instance
	// or to each of the routes if the class is attached on the base app.
	if (routerMeta) {
		for (const mware of sharedMwares) appInstance.use(promisifyHandler(mware))
	}

	for (const { path, method, key } of routes) {
		const routeMwares = extractMiddlewares(controllerClass, key)
		const routeErrHandlers = extractErrorHandlers(controllerClass, key)
		const paramsMwares = extractParamsMiddlewares(controllerClass, key, [
			globalMwares,
			parentSharedMwares,
			sharedMwares,
			routeMwares,
		])
		const toSend = extractSend(controllerClass, key)

		const handler = promisifyHandler((req, res, next) => {
			const args = extractParams(controllerClass, key, { req, res, next })
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
					throw Error('Cannot send the whole Response object')
				}

				if (json) return res.json(value)
				else return res.send(value)
			}
		})

		if (routerMeta) {
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

	// Recursively attach children controllers
	if (routerMeta?.children) {
		// Keep track of all shared middlewares for dedupe.
		concatFast(parentSharedMwares, sharedMwares)

		for (const child of routerMeta.children) {
			// Undocumented and untyped feature to attach normal express Routers. Will be removed.
			if (Array.isArray(child) && typeof child[0] === 'string' && typeof child[1] === 'function') {
				appInstance.use(child[0], child[1])
			} else {
				attach(child, appInstance, globalMwares, parentSharedMwares)
			}
		}
	}

	if (routerMeta) {
		for (const errHandler of sharedErrHandlers) appInstance.use(promisifyErrorHandler(errHandler))

		// Finally attach the router to the app
		app.use(routerMeta.root, appInstance)
	}
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
