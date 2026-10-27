import * as express from 'express'
import { register } from './register'
import { ClassType, Registration } from './interfaces'
import { RefletExpressError } from './reflet-error'
import { defineMetadata, getMetadata } from './metadata-map'

/**
 * @internal
 */
export type ApplicationMeta = {
	readonly class: ClassType
	registered: boolean
}

const METAKEY_APPLICATION = Symbol('application')

export interface ExpressApplication extends express.Application {}

/**
 * Express application class to extend, to apply the decorators with a global behavior.
 *
 * _Constructor simply returns an express application, augmented with `register` method._
 *
 * @example
 * ```ts
 * ＠Send({ json: true })
 * ＠Use(express.json())
 * class App extends ExpressApplication {
 *   ＠Get('/healthcheck')
 *   healthcheck() {
 *     return { success: true }
 *   }
 * }
 *
 * ＠Controller('/foo')
 * class FooController {
 *   ＠Get()
 *   list() {
 *     return db.collection('foo').find({})
 *   }
 * }
 *
 * const app = new App()
 * app.register([FooController])
 * app.listen(3000)
 * ```
 * ------
 * @public
 */
export class ExpressApplication {
	constructor() {
		const app = express()
		mixinApplication(app, this.constructor)

		// As the constructor returns an express app, we must keep the class reference
		// to retrieve metadata attached to its children.
		const metadata: ApplicationMeta = {
			class: this.constructor as ClassType,
			registered: false,
		}
		defineMetadata(METAKEY_APPLICATION, metadata, app)

		return app as unknown as this
	}

	register(routers: Registration[] = []) {
		register(this, routers)

		return this
	}
}

/**
 * Formerly named `Application`, which conflicts with the express `Application` interface.
 *
 * @deprecated Renamed `ExpressApplication`. Will be removed in the next major version.
 * @public
 */
export const Application = ExpressApplication

/**
 * @deprecated Renamed `ExpressApplication`. Will be removed in the next major version.
 * @public
 */
export type Application = ExpressApplication

/**
 * @internal
 */
function mixinApplication(target: express.Application, source: Function) {
	// Build the prototype chain with the top parent as first item, to apply inheritance in the right order.
	const protoChain = []
	let protoChainLink = source

	do {
		protoChain.unshift(protoChainLink)
		protoChainLink = Object.getPrototypeOf(protoChainLink)
	} while (protoChainLink !== Function.prototype && protoChainLink !== Object.prototype)

	// Keys defined by the class chain itself, which can be overridden by subclasses.
	const ownKeys = new Set<string>()

	for (const proto of protoChain) {
		const keys = Object.getOwnPropertyNames(proto.prototype)

		for (const key of keys) {
			if (key === 'constructor') continue

			if (key in target && !ownKeys.has(key)) {
				throw new RefletExpressError(
					'EXPRESS_PROPERTY_PROTECTED',
					`Cannot overwrite "${key}" on express application.`
				)
			}

			const descriptor = Object.getOwnPropertyDescriptor(proto.prototype, key)!
			Object.defineProperty(target, key, descriptor)
			ownKeys.add(key)
		}
	}
}

/**
 * @internal
 */
export function extractApplicationClass(target: object): ApplicationMeta | undefined {
	return getMetadata(METAKEY_APPLICATION, target)
}
