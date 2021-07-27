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
		// Because the constructor returns an express app instead,
		// We keep the original class reference to be able
		// to retrieve metadata attached to its children.
		const metadata: ApplicationMeta = {
			class: this.constructor as ClassType,
			registered: false,
		}

		Reflect.defineMetadata(META, metadata, this)

		const app = express()

		// This keeps methods from this class and its children on the express app.
		Object.setPrototypeOf(app, this)

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
export function extractApplicationClass(target: object): ApplicationMeta | undefined {
	return Reflect.getMetadata(META, target)
}
