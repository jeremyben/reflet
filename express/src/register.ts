import * as express from 'express'
import { wrapAsync, wrapAsyncError } from './async-wrapper'
import { ClassType, Registration } from './interfaces'
import { isPromise, isClass, isExpressApp, isExpressRouter, isAsyncFunction } from './type-guards'

// Extractors
import { DYNAMIC_PATH, extractRouterMeta } from './router-decorator'
import { extractRoutes } from './route-decorators'
import { extractMiddlewares } from './middleware-decorator'
import { extractErrorHandlers } from './error-handler-decorator'
import { extractParams, extractParamsMiddlewares } from './param-decorators'
import { extractSendHandler } from './send-decorator'
import { ApplicationMeta, extractApplicationClass } from './application-class'
import { RefletExpressError } from './reflet-error'

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
export function register(app: express.Application, routers: Registration[]): express.Application {
	if (!isExpressApp(app)) {
		throw new RefletExpressError('INVALID_EXPRESS_APP', 'This is not an Express application.')
	}

	const appMeta = extractApplicationClass(app)

	registerRootHandlers(app, appMeta)

	// Retrieve all global middlewares from plain `use` and from application class decorators if any.
	const globalMwares = getGlobalMiddlewares(app)

	for (const router of routers) {
		registerRouter(router, app, globalMwares, [], appMeta?.class)
	}

	registerRootErrorHandlers(app, appMeta)

	if (appMeta && !appMeta.registered) {
		appMeta.registered = true
	}

	return app
}

/**
 * @internal
 */
function registerRouter(
	registration: Registration,
	app: express.Router,
	globalMwares: express.RequestHandler[],
	parentSharedMwares: express.RequestHandler[] = [],
	appClass?: ClassType
) {
	const [constrainedPath, router] = isPathRouterTuple(registration) ? registration : [null, registration]

	// Attach plain express routers.
	if (constrainedPath && isExpressRouter(router)) {
		app.use(constrainedPath, router as express.Router)
		return
	}

	const routerInstance = isClass(router) ? new router() : router
	const routerClass = isClass(router) ? router : (routerInstance.constructor as ClassType)

	// Must be after instanciation to properly retrieve child routers from metadata.
	const routerMeta = extractRouterMeta(routerClass, appClass)

	if (!routerMeta || routerMeta.path == null) {
		throw new RefletExpressError(
			'ROUTER_DECORATOR_MISSING',
			`"${routerClass.name}" must be decorated with @Router.`
		)
	}

	checkPathConstraint(constrainedPath, routerMeta, routerClass)

	// Either attach middlewares/handlers to an intermediary router or directly to the app.
	const appInstance = routerMeta ? express.Router(routerMeta.options) : app

	const routes = extractRoutes(routerClass)

	const sharedMwares = extractMiddlewares(routerClass)
	const sharedErrHandlers = extractErrorHandlers(routerClass)

	// Apply shared middlewares to the router instance
	// or to each of the routes if the class is attached on the base app.

	if (!routerMeta.scopedMiddlewares) {
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

		appInstance[method](
			path,
			routerMeta.scopedMiddlewares ? sharedMwares.map(wrapAsync) : [],
			routeMwares.map(wrapAsync),
			paramsMwares.map(wrapAsync),
			handler,
			routeErrHandlers.map(wrapAsyncError),
			routerMeta.scopedMiddlewares ? sharedErrHandlers.map(wrapAsyncError) : []
		)
	}

	// Recursively attach children routers
	if (routerMeta.children) {
		// Keep track of all shared middlewares for dedupe.
		const parentSharedMwares_ = parentSharedMwares.concat(sharedMwares)

		const children =
			typeof routerMeta.children === 'function'
				? routerMeta.children(...routerMeta.childrenDeps!)
				: routerMeta.children

		for (const child of children) {
			registerRouter(child, appInstance, globalMwares, parentSharedMwares_, appClass)
		}
	}

	if (!routerMeta.scopedMiddlewares) {
		for (const errHandler of sharedErrHandlers) {
			appInstance.use(wrapAsyncError(errHandler))
		}
	}

	const routerPath = routerMeta.path === DYNAMIC_PATH ? constrainedPath! : routerMeta.path

	// Finally attach the router to the app
	app.use(routerPath, appInstance)
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

	const globalErrorHandlers = extractErrorHandlers(appMeta.class)

	if (!globalErrorHandlers.length) {
		return
	}

	// Error handlers added at the end of the stack during the first `register` call,
	// are moved to the last position for subsequent calls, to keep their behavior global.
	if (appMeta.registered) {
		for (const errHandler of globalErrorHandlers) {
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
		for (const errHandler of globalErrorHandlers) {
			app.use(wrapAsyncError(errHandler))
		}
	}
}

/**
 * @internal
 */
function isPathRouterTuple(registration: object): registration is [path: string | RegExp, router: object] {
	return Array.isArray(registration) && registration.length === 2
}

/**
 * @internal
 */
function checkPathConstraint(
	constrainedPath: string | RegExp | null,
	router: Exclude<ReturnType<typeof extractRouterMeta>, undefined>,
	routerClass: ClassType
) {
	if (router.path === DYNAMIC_PATH) {
		if (constrainedPath === null) {
			throw new RefletExpressError(
				'DYNAMIC_ROUTER_PATH_UNDEFINED',
				`"${routerClass.name}" is dynamic and must be registered with a path.`
			)
		}

		// Stop there if dynamic path
		return
	}

	// Stop there if no constraint on path
	if (constrainedPath === null) {
		return
	}

	const notSameString =
		typeof router.path === 'string' && typeof constrainedPath === 'string' && router.path !== constrainedPath

	if (notSameString) {
		throw new RefletExpressError(
			'ROUTER_PATH_CONSTRAINED',
			`"${routerClass.name}" expects "${constrainedPath}" as root path. Actual: "${router.path}".`
		)
	}

	const notSameRegex =
		router.path instanceof RegExp &&
		constrainedPath instanceof RegExp &&
		router.path.source !== constrainedPath.source

	if (notSameRegex) {
		throw new RefletExpressError(
			'ROUTER_PATH_CONSTRAINED',
			`"${routerClass.name}" expects "${constrainedPath}" as root path. Actual: "${router.path}".`
		)
	}

	const shouldBeString = router.path instanceof RegExp && typeof constrainedPath === 'string'

	if (shouldBeString) {
		throw new RefletExpressError(
			'ROUTER_PATH_CONSTRAINED',
			`"${routerClass.name}" expects string "${constrainedPath}" as root path. Actual: "${router.path}" (regex).`
		)
	}

	const shouldBeRegex = typeof router.path === 'string' && constrainedPath instanceof RegExp

	if (shouldBeRegex) {
		throw new RefletExpressError(
			'ROUTER_PATH_CONSTRAINED',
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
): express.Handler {
	const sendHandler = extractSendHandler(routerClass, key, appClass)

	// get from the instance instead of the prototype, so this can be a function property and not only a method.
	const fn = routerInstance[key] as Function

	const codePath = `${routerClass.name}.${String(key)}`

	if (typeof fn !== 'function') {
		throw new RefletExpressError('INVALID_ROUTE_TYPE', `"${codePath}" should be a function.`)
	}

	const isAsync = isAsyncFunction(fn)

	return (req, res, next) => {
		const args = extractParams(routerClass, key, { req, res, next })
		const result = fn.apply(routerInstance, args)

		// Handle or bypass sending the method's result according to @Send decorator,
		// if the response has already been sent to the client, we also bypass.
		if (!sendHandler || res.headersSent) {
			// We only use the async modifier in this case to decide to catch async errors, for performance.
			// If the user ever decides to return a promise in a non-async method while not using @Send,
			// it won't catch its errors, but that's an unlikely edge case.
			return isAsync ? (result as Promise<any>).catch(next) : result
		}

		if (isPromise(result)) {
			return result
				.then((value) => {
					return sendHandler(value, { req, res, next })
				})
				.catch(next)
		} else {
			try {
				const sendResult = sendHandler(result, { req, res, next })
				return isPromise(sendResult) ? sendResult.catch(next) : sendResult
			} catch (error) {
				next(error)
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
