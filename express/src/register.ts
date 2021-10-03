import * as express from 'express'
import { wrapAsync, wrapAsyncError } from './async-wrapper'
import { ClassType, RegistrationArray, ClassInstance } from './interfaces'
import { isPromise, isReadableStream, isClass, isExpressApp, isExpressRouter, isAsyncFunction } from './type-guards'

// Extractors
import { defineChildRouters, DYNAMIC_PATH, extractRouterMeta } from './router-decorator'
import { extractRoutes, hasRoutes } from './route-decorators'
import { extractMiddlewares } from './middleware-decorator'
import { extractErrorHandlers } from './error-handler-decorator'
import { extractParams, extractParamsMiddlewares } from './param-decorators'
import { extractSend } from './send-decorator'
import { ApplicationMeta, extractApplicationClass } from './application-class'

/**
 * Main method to register routers into an express application.
 * @param app - express application.
 * @param routers - decorated classes or instances.
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
export function register(app: express.Application, routers: RegistrationArray): express.Application

/**
 * Attaches children routers to a parent router, to have nested routers.
 *
 * To be used in the **constructor** of a `@Router` decorated class.
 *
 * @param parent - should simply be `this`.
 * @param children - classes or instances with decorated routes.
 *
 * @example
 * ```ts
 * ＠Router('/foo')
 * class ParentRouter {
 *   constructor() {
 *     register(this, [NestedRouter])
 *   }
 * }
 *
 * ＠Router('/bar')
 * class NestedRouter {}
 * ```
 * ------
 * @public
 */
export function register(parent: ClassInstance, children: RegistrationArray): void

export function register(appInstance: object, routers: RegistrationArray): express.Application | void {
	if (isExpressApp(appInstance)) {
		const appMeta = extractApplicationClass(appInstance)

		registerRootHandlers(appInstance, appMeta)

		// Retrieve all global middlewares from plain `use` and from application class decorators if any.
		const globalMwares = getGlobalMiddlewares(appInstance)

		for (const router of routers) {
			registerRouter(router, appInstance, globalMwares, [], appMeta?.class)
		}

		registerRootErrorHandlers(appInstance, appMeta)

		if (appMeta && !appMeta.registered) {
			appMeta.registered = true
		}

		return appInstance
	}

	// Register call from router constructor
	else {
		const parentClass = appInstance.constructor as ClassType
		const routerMeta = extractRouterMeta(parentClass)

		if (routerMeta?.path == null) {
			if (hasRoutes(parentClass)) {
				throw Error(`"${parentClass.name}" must be decorated with @Router.`)
			}

			throw Error(`First argument should be an express application or an instance decorated with @Router.`)
		}

		defineChildRouters(parentClass, routerMeta, routers)
	}
}

/**
 * @internal
 */
function registerRouter(
	registration: RegistrationArray[number],
	app: express.Router,
	globalMwares: express.RequestHandler[],
	parentSharedMwares: express.RequestHandler[] = [],
	appClass?: ClassType
) {
	const { path: constrainedPath, router } = isPathRouterObject(registration)
		? registration
		: { path: undefined, router: registration }

	// Attach plain express routers.
	if (constrainedPath && isExpressRouter(router)) {
		app.use(constrainedPath, router as express.Router)
		return
	}

	const routerInstance = isClass(router) ? new router() : router
	const routerClass = isClass(router) ? router : (routerInstance.constructor as ClassType)

	// Must be after instanciation to properly retrieve child routers from metadata.
	const routerMeta = extractRouterMeta(routerClass)

	checkPathConstraint(constrainedPath, routerMeta, routerClass)

	// Either attach middlewares/handlers to an intermediary router or directly to the app.
	const appInstance = routerMeta ? express.Router(routerMeta.options) : app

	const routes = extractRoutes(routerClass)

	if (!routes.length && !routerMeta) {
		console.warn(`"${routerClass.name}" doesn't have any route or router to register.`)
	}

	const sharedMwares = extractMiddlewares(routerClass)
	const sharedErrHandlers = extractErrorHandlers(routerClass)

	// Apply shared middlewares to the router instance
	// or to each of the routes if the class is attached on the base app.
	if (routerMeta) {
		for (const mware of sharedMwares) {
			appInstance.use(wrapAsync(mware))
		}
	}

	for (const { path, method, key } of routes) {
		const routeMwares = extractMiddlewares(routerClass, key)
		const routeErrHandlers = extractErrorHandlers(routerClass, key)
		const paramsMwares = extractParamsMiddlewares(routerClass, key, [
			globalMwares,
			parentSharedMwares,
			sharedMwares,
			routeMwares,
		])

		const handler = createHandler(routerClass, routerInstance, key, appClass)

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

	// Recursively attach children routers
	if (routerMeta?.children) {
		if (routerMeta.path == null) {
			throw Error(`"${routerClass.name}" must be decorated with @Router.`)
		}

		// Keep track of all shared middlewares for dedupe.
		const parentSharedMwares_ = parentSharedMwares.concat(sharedMwares)

		const children =
			typeof routerMeta.children === 'function'
				? routerMeta.children(...routerMeta.childrenDeps!)
				: routerMeta.children

		for (const child of children) {
			// Undocumented and untyped feature to attach plain express Routers with a tuple. Will be removed.
			if (Array.isArray(child) && typeof child[0] === 'string' && isExpressRouter(child[1])) {
				appInstance.use(child[0], child[1])
			} else {
				registerRouter(child, appInstance, globalMwares, parentSharedMwares_, appClass)
			}
		}
	}

	if (routerMeta?.path != null) {
		for (const errHandler of sharedErrHandlers) {
			appInstance.use(wrapAsyncError(errHandler))
		}

		const routerPath = routerMeta.path === DYNAMIC_PATH ? constrainedPath! : routerMeta.path

		// Finally attach the router to the app
		app.use(routerPath, appInstance)
	}
}

/**
 * Retrieves and attaches global middlewares and routes from an inherited `Application` class.
 * Only executed once, if the user calls `register` multiple times on the same app.
 * @internal
 */
function registerRootHandlers(app: express.Application, appMeta?: ApplicationMeta) {
	if (!appMeta || appMeta.registered) {
		return
	}

	// Probability that the user has already attached middlewares before calling `register`.
	const preexistingGlobalMwares = getGlobalMiddlewares(app)

	const newGlobalMwares = extractMiddlewares(appMeta.class)

	for (const globalMware of newGlobalMwares) {
		app.use(wrapAsync(globalMware))
	}

	const routes = extractRoutes(appMeta.class)

	for (const { key, method, path } of routes) {
		const routeMwares = extractMiddlewares(appMeta.class, key)
		const routeErrHandlers = extractErrorHandlers(appMeta.class, key)
		const paramsMwares = extractParamsMiddlewares(appMeta.class, key, [
			preexistingGlobalMwares,
			newGlobalMwares,
			routeMwares,
		])

		const handler = createHandler(appMeta.class, app, key)

		app[method](
			path,
			routeMwares.map(wrapAsync),
			paramsMwares.map(wrapAsync),
			handler,
			routeErrHandlers.map(wrapAsyncError)
		)
	}
}

/**
 * Retrieves and attaches global error handlers from an inherited `Application` class.
 * @internal
 */
function registerRootErrorHandlers(app: express.Application, appMeta?: ApplicationMeta) {
	if (!appMeta) {
		return
	}

	const customGlobalErrorHandlers = extractErrorHandlers(appMeta.class)

	if (!customGlobalErrorHandlers.length) {
		return
	}

	// Error handlers added at the end of the stack during the first `register` call,
	// are moved to the last position for subsequent calls, to keep their behavior global.
	if (appMeta.registered) {
		for (const errHandler of customGlobalErrorHandlers) {
			const layerIndex = app._router?.stack.findIndex((layer) => layer.handle === errHandler)

			// optimisation, not sure about side effects.
			// if (layerIndex === app._router.stack.length - 1) continue

			/* istanbul ignore else - user has removed error handler before calling register again */
			if (layerIndex >= 0) {
				app._router?.stack.splice(layerIndex, 1)
				app.use(wrapAsyncError(errHandler))
			}
		}
	} else {
		for (const errHandler of customGlobalErrorHandlers) {
			app.use(wrapAsyncError(errHandler))
		}
	}
}

/**
 * @internal
 */
function isPathRouterObject(
	registration: Record<string, any>
): registration is { path: string | RegExp | symbol; router: object } {
	return (
		registration.hasOwnProperty('path') &&
		registration.hasOwnProperty('router') &&
		(typeof registration.path === 'string' || registration.path instanceof RegExp) &&
		(typeof registration.router === 'function' || typeof registration.router === 'object')
	)
}

/**
 * @internal
 */
function checkPathConstraint(
	constrainedPath: string | RegExp | undefined,
	router: ReturnType<typeof extractRouterMeta>,
	routerClass: ClassType
) {
	if (!constrainedPath) {
		if (router?.path === DYNAMIC_PATH) {
			throw Error(`"${routerClass.name}" is dynamic and must be registered with a path.`)
		}

		return
	}

	if (!router) {
		throw Error(
			`"${routerClass.name}" is constrained to the specific path "${constrainedPath}" and must be decorated with @Router.`
		)
	}

	if (router.path === DYNAMIC_PATH) {
		return
	}

	const notSameString =
		typeof router.path === 'string' && typeof constrainedPath === 'string' && router.path !== constrainedPath

	if (notSameString) {
		throw Error(`"${routerClass.name}" expects "${constrainedPath}" as root path. Actual: "${router.path}".`)
	}

	const notSameRegex =
		router.path instanceof RegExp &&
		constrainedPath instanceof RegExp &&
		router.path.source !== constrainedPath.source

	if (notSameRegex) {
		throw Error(`"${routerClass.name}" expects "${constrainedPath}" as root path. Actual: "${router.path}".`)
	}

	const shouldBeString = router.path instanceof RegExp && typeof constrainedPath === 'string'

	if (shouldBeString) {
		throw Error(
			`"${routerClass.name}" expects string "${constrainedPath}" as root path. Actual: "${router.path}" (regex).`
		)
	}

	const shouldBeRegex = typeof router.path === 'string' && constrainedPath instanceof RegExp

	if (shouldBeRegex) {
		throw Error(
			`"${routerClass.name}" expects regex "${constrainedPath}" as root path. Actual: "${router.path}" (string).`
		)
	}
}

/**
 * @internal
 */
function createHandler(
	routerClass: ClassType, // different from `routerInstance.constructor` in case of decorated Application class.
	routerInstance: any,
	key: string | symbol,
	appClass?: ClassType
) {
	const toSend = extractSend(routerClass, key, appClass)

	// get from the instance instead of the prototype, so this can be a function property and not only a method.
	const fn = routerInstance[key] as Function

	if (typeof fn !== 'function') {
		throw Error(`"${routerClass.name}.${key.toString()}" should be a function.`)
	}

	const isAsync = isAsyncFunction(fn)

	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const args = extractParams(routerClass, key, { req, res, next })
		const result = fn.apply(routerInstance, args)

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

		function send(value: any) {
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
				return value.pipe(res as any)
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

	// `_router` might be undefined before express app is properly initialized.
	for (const layer of app._router?.stack || []) {
		if (
			layer.name !== 'query' &&
			layer.name !== 'expressInit' &&
			layer.name !== 'router' &&
			layer.name !== 'bound dispatch'
		) {
			globalMwares.push(layer.handle as express.RequestHandler)
		}
	}

	return globalMwares
}
