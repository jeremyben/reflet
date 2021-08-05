import * as express from 'express'
import { register } from './register'
import { ClassType, Controllers } from './interfaces'

/**
 * @internal
 */
export type ApplicationMeta = {
	readonly class: ClassType
	registered: boolean
}

const META = Symbol('application')

export interface Application extends express.Application {}

/**
 * Express application class to extend, to apply the decorators with a global behavior.
 *
 * _Constructor simply returns an express application, augmented with `register` method._
 *
 * @example
 * ```ts
 * ＠Send({ json: true })
 * ＠Use(express.json())
 * class App extends Application {
 *   ＠Get('/healthcheck')
 *   healthcheck() {
 *     return { success: true }
 *   }
 * }
 *
 * ＠Router('/foo')
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
export class Application {
	constructor() {
		const app = express()
		mixinApplication(app, this.constructor)

		// As the constructor returns an express app, we must keep the class reference
		// to retrieve metadata attached to its children.
		const metadata: ApplicationMeta = {
			class: this.constructor as ClassType,
			registered: false,
		}
		Reflect.defineMetadata(META, metadata, app)

		return app as unknown as this
	}

	register(controllers: Controllers = []) {
		register(this, controllers)

		return this
	}
}

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

	for (const proto of protoChain) {
		const keys = Object.getOwnPropertyNames(proto.prototype)

		for (const key of keys) {
			if (key === 'constructor') continue
			if (key in target) throw Error(`Cannot overwrite "${key}" on express application.`)

			const descriptor = Object.getOwnPropertyDescriptor(proto.prototype, key)!
			Object.defineProperty(target, key, descriptor)
		}
	}
}

/**
 * @internal
 */
export function extractApplicationClass(target: object): ApplicationMeta | undefined {
	return Reflect.getMetadata(META, target)
}
