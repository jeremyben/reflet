import { defineMetadata, getOwnMetadata } from './metadata-map'
import { parseBool, parseEmail, parseHost, parseJson, parseNum, parsePort, parseStr, parseUrl } from './parsers'
import type { ClassType, Parser, Spec, SpecOptions } from './interfaces'

const META = {
	spec: Symbol('env-spec'),
	props: Symbol('env-props'),
	computed: Symbol('env-computed'),
}

/**
 * Function used by `@Env.Computed` to derive a value from already-validated env properties.
 * @public
 */
export type ComputeFn<C, T> = (env: Readonly<C>) => T

function register<T>(type: string, parser: Parser<T>, options: SpecOptions<T> = {}): PropertyDecorator {
	return (target, propertyKey) => {
		const spec: Spec<T> = { type, parser, ...options }
		defineMetadata(META.spec, spec, target, propertyKey)

		const props: (string | symbol)[] = getOwnMetadata(META.props, target.constructor) || []
		if (!props.includes(propertyKey)) {
			props.push(propertyKey)
			defineMetadata(META.props, props, target.constructor)
		}
	}
}

/**
 * Marks a class property as an environment variable to be validated and injected.
 *
 * @example
 * ```ts
 * class Env {
 *   ＠Env.Str()
 *   NODE_ENV!: string
 *
 *   ＠Env.Port({ default: 3000 })
 *   PORT!: number
 *
 *   ＠Env.Bool({ default: false })
 *   DEBUG!: boolean
 * }
 *
 * const env = initEnv(Env)
 * ```
 * ---
 * @public
 */
export namespace Env {
	/** A string env variable. @public */
	export function Str<T extends string = string>(options?: SpecOptions<T>): PropertyDecorator {
		return register('str', parseStr as Parser<T>, options)
	}

	/** A number env variable. @public */
	export function Num(options?: SpecOptions<number>): PropertyDecorator {
		return register('num', parseNum, options)
	}

	/** A boolean env variable. Accepts `true|false|1|0|yes|no`. @public */
	export function Bool(options?: SpecOptions<boolean>): PropertyDecorator {
		return register('bool', parseBool, options)
	}

	/** An integer port number (1-65535). @public */
	export function Port(options?: SpecOptions<number>): PropertyDecorator {
		return register('port', parsePort, options)
	}

	/** A URL parsable by the `URL` constructor. @public */
	export function Url(options?: SpecOptions<string>): PropertyDecorator {
		return register('url', parseUrl, options)
	}

	/** An email address. @public */
	export function Email(options?: SpecOptions<string>): PropertyDecorator {
		return register('email', parseEmail, options)
	}

	/** A hostname or IP address. @public */
	export function Host(options?: SpecOptions<string>): PropertyDecorator {
		return register('host', parseHost, options)
	}

	/** A JSON-encoded value. @public */
	export function Json<T = unknown>(options?: SpecOptions<T>): PropertyDecorator {
		return register('json', parseJson as Parser<T>, options)
	}

	/**
	 * Custom env variable with a user-supplied parser.
	 * @public
	 */
	export function Custom<T>(parser: Parser<T>, options?: SpecOptions<T>): PropertyDecorator {
		return register('custom', parser, options)
	}

	/**
	 * A property whose value is derived from other (already-validated) properties
	 * of the same env class. Computed properties are resolved in declaration order
	 * after all source-backed properties have been parsed, so a computed property
	 * may depend on any earlier property — including earlier computed ones.
	 *
	 * @example
	 * ```ts
	 * class Env {
	 *   ＠Env.Str() HOST!: string
	 *   ＠Env.Port({ default: 3000 }) PORT!: number
	 *
	 *   ＠Env.Computed<Env>((e) => `http://${e.HOST}:${e.PORT}`)
	 *   BASE_URL!: string
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Computed<C, T = unknown>(fn: ComputeFn<C, T>): PropertyDecorator {
		return (target, propertyKey) => {
			defineMetadata(META.computed, fn, target, propertyKey)

			const props: (string | symbol)[] = getOwnMetadata(META.props, target.constructor) || []
			if (!props.includes(propertyKey)) {
				props.push(propertyKey)
				defineMetadata(META.props, props, target.constructor)
			}
		}
	}
}

/**
 * @internal
 */
export function extractSpec(target: ClassType, propertyKey: string | symbol): Spec<any> | undefined {
	return getOwnMetadata(META.spec, target.prototype, propertyKey)
}

/**
 * @internal
 */
export function extractProps(target: ClassType): (string | symbol)[] {
	return getOwnMetadata(META.props, target) || []
}

/**
 * @internal
 */
export function extractComputed(target: ClassType, propertyKey: string | symbol): ComputeFn<any, any> | undefined {
	return getOwnMetadata(META.computed, target.prototype, propertyKey)
}
