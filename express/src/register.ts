import * as express from 'express'
import { wrapAsync, wrapAsyncError } from './async-wrapper'
import { globalErrorHandler, makeGlobalErrorHandlerRemovable } from './global-error-handler'
import { ClassType, Controllers, ObjectInstance } from './interfaces'
import { isPromise, isReadableStream, isClass, isExpressApp, isExpressRouter, isAsyncFunction } from './type-guards'

// Extractors
import { defineChildRouters, extractRouter } from './router-decorator'
import { extractRoutes, hasRoutes } from './route-decorators'
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
export function register(app: express.Application, controllers: Controllers): express.Application

/**
 * Attaches children controllers to a parent router, to have nested routers.
 *
 * To be used in the **constructor** of a `@Router` decorated class.
 *
 * @param parent - should simply be `this`.
 * @param children - classes or instances with decorated routes.
 *
 * @example
 * ```ts
 * ＠Router('/foo', { mergeParams: true })
 * class Foo {
 *   constructor() {
 *     register(this, [Bar, Baz])
 *   }
 * }
 * ```
 * ------
 * @public
 */
export function register(parent: ObjectInstance, children: Controllers): void

export function register(app: object, controllers: Controllers): express.Application | void {
	if (isExpressApp(app)) {
		const globalMwares = getGlobalMiddlewares(app)

		for (const controller of controllers) {
			attach(controller, app, globalMwares)
		}

		app.use(globalErrorHandler)
		makeGlobalErrorHandlerRemovable(app)

		return app
	} else {
		const parentClass = app.constructor as ClassType
		const routerMeta = extractRouter(parentClass)

		if (!routerMeta) {
			if (hasRoutes(parentClass)) {
				throw Error(`"${parentClass.name}" must be decorated with @Router.`)
			}

			throw Error(`First argument should be an express application or an instance decorated with @Router.`)
		}

		defineChildRouters(parentClass, routerMeta, controllers)
	}
}

/**
 * @internal
 */
function attach(
	controller: Controllers[number],
	app: express.Router,
	globalMwares: express.RequestHandler[],
	parentSharedMwares: express.RequestHandler[] = []
) {
	const { path: rootPath, router } = isPathRouterObject(controller)
		? controller
		: { path: undefined, router: controller }

	// Attach plain express routers.
	if (rootPath && isExpressRouter(router)) {
		app.use(rootPath, router as express.Router)
		return
	}

	const controllerInstance = isClass(router) ? new router() : router
	const controllerClass = isClass(router) ? router : (controllerInstance.constructor as ClassType)

	// Must be after instanciation to properly retrieve child routers from metadata.
	const routerMeta = extractRouter(controllerClass)

	if (rootPath) {
		checkRouterPathConstraint(rootPath, routerMeta, controllerClass)
	}

	// Either attach middlewares/handlers to an intermediary router or directly to the app.
	const appInstance = routerMeta ? express.Router(routerMeta.options) : app

	const routes = extractRoutes(controllerClass)

	if (!routes.length && !routerMeta) {
		console.warn(`"${controllerClass.name}" doesn't have any route or router to register.`)
	}

	const sharedMwares = extractMiddlewares(controllerClass)
	const sharedErrHandlers = extractErrorHandlers(controllerClass)

	// Apply shared middlewares to the router instance
	// or to each of the routes if the class is attached on the base app.
	if (routerMeta) {
		for (const mware of sharedMwares) {
			appInstance.use(wrapAsync(mware))
		}
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

		const handler = createHandler(controllerClass, controllerInstance, key)

		if (routerMeta) {
			appInstance[method](
				path,
				routeMwares.map(wrapAsync),
				paramsMwares.map(wrapAsync),
				handler,
				routeErrHandlers.map(wrapAsyncError)
			)
		} else {
			// Have same order of middlewares by surrounding route specific ones by shared ones.
			appInstance[method](
				path,
				sharedMwares.map(wrapAsync),
				routeMwares.map(wrapAsync),
				paramsMwares.map(wrapAsync),
				handler,
				routeErrHandlers.map(wrapAsyncError),
				sharedErrHandlers.map(wrapAsyncError)
			)
		}
	}

	// Recursively attach children controllers
	if (routerMeta?.children) {
		// Keep track of all shared middlewares for dedupe.
		const parentSharedMwares_ = parentSharedMwares.concat(sharedMwares)

		for (const child of routerMeta.children) {
			// Undocumented and untyped feature to attach normal express Routers. Will be removed.
			if (Array.isArray(child) && typeof child[0] === 'string' && typeof child[1] === 'function') {
				appInstance.use(child[0], child[1])
			} else {
				attach(child, appInstance, globalMwares, parentSharedMwares_)
			}
		}
	}

	if (routerMeta) {
		for (const errHandler of sharedErrHandlers) {
			appInstance.use(wrapAsyncError(errHandler))
		}

		// Finally attach the router to the app
		app.use(routerMeta.root, appInstance)
	}
}

/**
 * @internal
 */
function isPathRouterObject(controller: Record<string, any>): controller is { path: string | RegExp; router: object } {
	return (
		controller.hasOwnProperty('path') &&
		controller.hasOwnProperty('router') &&
		(typeof controller.path === 'string' || controller.path instanceof RegExp) &&
		(typeof controller.router === 'function' || typeof controller.router === 'object')
	)
}

/**
 * @internal
 */
function checkRouterPathConstraint(
	constrainedPath: string | RegExp,
	routerMeta: ReturnType<typeof extractRouter>,
	controllerClass: ClassType
) {
	if (!routerMeta) {
		throw Error(
			`"${controllerClass.name}" is constrained to the specific path "${constrainedPath}" and must be decorated with @Router.`
		)
	}

	const notSameString =
		typeof routerMeta.root === 'string' &&
		typeof constrainedPath === 'string' &&
		routerMeta.root !== constrainedPath

	if (notSameString) {
		throw Error(
			`"${controllerClass.name}" expects "${constrainedPath}" as root path. Actual: "${routerMeta.root}".`
		)
	}

	const notSameRegex =
		routerMeta.root instanceof RegExp &&
		constrainedPath instanceof RegExp &&
		routerMeta.root.source !== constrainedPath.source

	if (notSameRegex) {
		throw Error(
			`"${controllerClass.name}" expects "${constrainedPath}" as root path. Actual: "${routerMeta.root}".`
		)
	}

	const shouldBeString = routerMeta.root instanceof RegExp && typeof constrainedPath === 'string'

	if (shouldBeString) {
		throw Error(
			`"${controllerClass.name}" expects string "${constrainedPath}" as root path. Actual: "${routerMeta.root}" (regex).`
		)
	}

	const shouldBeRegex = typeof routerMeta.root === 'string' && constrainedPath instanceof RegExp

	if (shouldBeRegex) {
		throw Error(
			`"${controllerClass.name}" expects regex "${constrainedPath}" as root path. Actual: "${routerMeta.root}" (string).`
		)
	}
}

/**
 * @internal
 */
function createHandler(controllerClass: ClassType, controllerInstance: any, key: string | symbol) {
	const toSend = extractSend(controllerClass, key)
	const fn = controllerInstance[key] as Function

	if (typeof fn !== 'function') {
		throw Error(`"${controllerClass.name}.${key.toString()}" should be a function.`)
	}

	const isAsync = isAsyncFunction(fn)

	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const args = extractParams(controllerClass, key, { req, res, next })
		const result = fn.apply(controllerInstance, args)

		// Handle or bypass sending the method's result according to @Send decorator,
		// if the response has already been sent to the client, we also bypass.
		if (!toSend || res.headersSent) {
			if (isAsync) {
				return (result as Promise<any>).catch(next)
			} else {
				// todo? If the user returns a promise (not with async),
				// and this promise throw an error, it won't be caught,
				// but that seems overkill.
				// if (isPromise(result)) return result.catch(next)
				return result
			}
		}

		const { json, status, nullStatus, undefinedStatus } = toSend

		if (isPromise(result)) {
			return result.then((value) => send(value)).catch(next)
		} else {
			return send(result)
		}

		function send(value: any): express.Response {
			// Default status
			if (status) {
				res.status(status)
			}

			// Undefined and null status
			if (value === undefined && undefinedStatus) {
				res.status(undefinedStatus)
			} else if (value === null && nullStatus) {
				res.status(nullStatus)
			}

			// Readable stream
			if (isReadableStream(value)) {
				return value.pipe(res)
			}

			// Response object itself
			if (value === res) {
				// A stream is piping to the response so we let it go
				if (res.listenerCount('unpipe') > 0) {
					return res
				}

				// The response will try to send itself, which will cause a cryptic error
				// ('TypeError: Converting circular structure to JSON')
				return next(Error('Cannot send the whole Response object.')) as any
			}

			if (json) {
				return res.json(value)
			} else {
				return res.send(value)
			}
		}
	}
}

/**
 * Exported for tests only.
 * @internal
 */
export function getGlobalMiddlewares(app: express.Application): express.RequestHandler[] {
	const globalMwares: express.RequestHandler[] = []

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
