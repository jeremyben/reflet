import { ClassOrMethodDecorator, ClassType } from './interfaces'

const META_TIME = Symbol('cron-time')
const META_ONCOMPLETE = Symbol('cron-oncomplete')
const META_RUNONINIT = Symbol('cron-runoninit')
const META_START = Symbol('cron-start')
const META_TIMEZONE = Symbol('cron-timezone')
const META_UTCOFFSET = Symbol('cron-utcoffset')
const META_UNREFTIMEOUT = Symbol('cron-unreftimeout')
const META_CATCH = Symbol('cron-catch')
const META_PREVENTOVERLAP = Symbol('cron-preventoverlap')

/**
 * The time to fire off your job.
 * This can be in the form of cron syntax or a JS `Date` object.
 * @public
 */
export function Cron(cronTime: string | Date): MethodDecorator {
	return (target, key, descriptor) => {
		Reflect.defineMetadata(META_TIME, cronTime, target, key)
	}
}

export namespace Cron {
	/**
	 * A function that will fire when the job is stopped with `job.stop()`, and may also be called by onTick at the end of each run.
	 * @public
	 */
	export function OnComplete(onComplete: () => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META_ONCOMPLETE, onComplete, target, key)
			else Reflect.defineMetadata(META_ONCOMPLETE, onComplete, target)
		}
	}

	/**
	 * This will immediately fire your `onTick` function as soon as the requisit initialization has happened.
	 * @public
	 */
	export function RunOnInit(...args: Parameters<ClassOrMethodDecorator>): void
	export function RunOnInit(): ClassOrMethodDecorator
	export function RunOnInit(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) Reflect.defineMetadata(META_RUNONINIT, true, target, key)
			else Reflect.defineMetadata(META_RUNONINIT, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META_RUNONINIT, true, target, key)
				else Reflect.defineMetadata(META_RUNONINIT, true, target)
			}
		}
	}

	export namespace RunOnInit {
		/**
		 * Override and remove class-defined `Cron.RunOnInit` behavior on a specific method.
		 * @public
		 */
		export function Dont(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>): void
		export function Dont(): MethodDecorator
		export function Dont(
			target?: object,
			key?: string | symbol,
			descriptor?: TypedPropertyDescriptor<any>
		): void | MethodDecorator {
			if (arguments.length === 3 && typeof target === 'object') {
				Reflect.defineMetadata(META_RUNONINIT, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META_RUNONINIT, false, target, key)
				}
			}
		}
	}

	/**
	 * Specifies whether to start the job just before exiting the constructor. By default this is set to false.
	 * If left at default you will need to call `job.start()` in order to start the job.
	 * This does not immediately fire your `onTick` function, it just gives you more control over the behavior of your jobs.
	 * @public
	 */
	export function Start(...args: Parameters<ClassOrMethodDecorator>): void
	export function Start(): ClassOrMethodDecorator
	export function Start(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) Reflect.defineMetadata(META_START, true, target, key)
			else Reflect.defineMetadata(META_START, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META_START, true, target, key)
				else Reflect.defineMetadata(META_START, true, target)
			}
		}
	}

	export namespace Start {
		/**
		 * Override and remove class-defined `Cron.Start` behavior on a specific method.
		 * @public
		 */
		export function Dont(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>): void
		export function Dont(): MethodDecorator
		export function Dont(
			target?: object,
			key?: string | symbol,
			descriptor?: TypedPropertyDescriptor<any>
		): void | MethodDecorator {
			if (arguments.length === 3 && typeof target === 'object') {
				Reflect.defineMetadata(META_START, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META_START, false, target, key)
				}
			}
		}
	}

	/**
	 * Specify the timezone for the execution. This will modify the actual time relative to your timezone.
	 * If the timezone is invalid, an error is thrown.
	 *
	 * You can check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/).
	 *
	 * _Probably don't use both `timeZone` and `utcOffset` together or weird things may happen._
	 *
	 * @public
	 */
	export function TimeZone(timezone: string): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META_TIMEZONE, timezone, target, key)
			else Reflect.defineMetadata(META_TIMEZONE, timezone, target)
		}
	}

	/**
	 * This allows you to specify the offset of your timezone rather than using the `timeZone` param.
	 *
	 * _Probably don't use both `timeZone` and `utcOffset` together or weird things may happen._
	 *
	 * @see https://momentjs.com/docs/#/manipulating/utc-offset/
	 * @public
	 */
	export function UtcOffset(offset: string | number): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META_UTCOFFSET, offset, target, key)
			else Reflect.defineMetadata(META_UTCOFFSET, offset, target)
		}
	}

	/**
	 * If you have code that keeps the event loop running and want to stop the node process when that finishes regardless of the state of your cronjob,
	 * you can do so making use of this parameter.
	 * This is off by default and cron will run as if it needs to control the event loop.
	 * For more information take a look at [timers#timers_timeout_unref](https://nodejs.org/api/timers.html#timers_timeout_unref) from the NodeJS docs.
	 * @public
	 */
	export function UnrefTimeout(...args: Parameters<ClassOrMethodDecorator>): void
	export function UnrefTimeout(): ClassOrMethodDecorator
	export function UnrefTimeout(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) Reflect.defineMetadata(META_UNREFTIMEOUT, true, target, key)
			else Reflect.defineMetadata(META_UNREFTIMEOUT, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META_UNREFTIMEOUT, true, target, key)
				else Reflect.defineMetadata(META_UNREFTIMEOUT, true, target)
			}
		}
	}

	export namespace UnrefTimeout {
		/**
		 * Override and remove class-defined `Cron.UnrefTimeout` behavior on a specific method.
		 * @public
		 */
		export function Dont(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>): void
		export function Dont(): MethodDecorator
		export function Dont(
			target?: object,
			key?: string | symbol,
			descriptor?: TypedPropertyDescriptor<any>
		): void | MethodDecorator {
			if (arguments.length === 3 && typeof target === 'object') {
				Reflect.defineMetadata(META_UNREFTIMEOUT, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META_UNREFTIMEOUT, false, target, key)
				}
			}
		}
	}

	/**
	 * @public
	 */
	export function Catch(handler: (error: unknown) => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META_CATCH, handler, target, key)
			else Reflect.defineMetadata(META_CATCH, handler, target)
		}
	}

	/**
	 * @public
	 */
	export function PreventOverlap(...args: Parameters<ClassOrMethodDecorator>): void
	export function PreventOverlap(): ClassOrMethodDecorator
	export function PreventOverlap(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) Reflect.defineMetadata(META_PREVENTOVERLAP, true, target, key)
			else Reflect.defineMetadata(META_PREVENTOVERLAP, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META_PREVENTOVERLAP, true, target, key)
				else Reflect.defineMetadata(META_PREVENTOVERLAP, true, target)
			}
		}
	}

	export namespace PreventOverlap {
		/**
		 * Override and remove class-defined `Cron.PreventOverlap` behavior on a specific method.
		 * @public
		 */
		export function Dont(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>): void
		export function Dont(): MethodDecorator
		export function Dont(
			target?: object,
			key?: string | symbol,
			descriptor?: TypedPropertyDescriptor<any>
		): void | MethodDecorator {
			if (arguments.length === 3 && typeof target === 'object') {
				Reflect.defineMetadata(META_PREVENTOVERLAP, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META_PREVENTOVERLAP, false, target, key)
				}
			}
		}
	}
}

/**
 * @internal
 */
export function extractCronTime(target: ClassType, methodKey: string): string | Date | undefined {
	return Reflect.getOwnMetadata(META_TIME, target.prototype, methodKey)
}

/**
 * @internal
 */
export function extractOnComplete(target: ClassType, methodKey?: string): () => void | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_ONCOMPLETE, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_ONCOMPLETE, target)
}

/**
 * @internal
 */
export function extractStart(target: ClassType, methodKey?: string): boolean | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_START, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_START, target)
}

/**
 * @internal
 */
export function extractRunOnInit(target: ClassType, methodKey?: string): boolean | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_RUNONINIT, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_RUNONINIT, target)
}

/**
 * @internal
 */
export function extractTimeZone(target: ClassType, methodKey?: string): string | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_TIMEZONE, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_TIMEZONE, target)
}

/**
 * @internal
 */
export function extractUtcOffset(target: ClassType, methodKey?: string): string | number | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_UTCOFFSET, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_UTCOFFSET, target)
}

/**
 * @internal
 */
export function extractUnrefTimeout(target: ClassType, methodKey?: string): boolean | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_UNREFTIMEOUT, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_UNREFTIMEOUT, target)
}

/**
 * @internal
 */
export function extractCatch(target: ClassType, methodKey?: string): ((error: unknown) => void) | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_CATCH, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_CATCH, target)
}

/**
 * @internal
 */
export function extractPreventOverlap(target: ClassType, methodKey?: string): boolean | undefined {
	if (methodKey) return Reflect.getOwnMetadata(META_PREVENTOVERLAP, target.prototype, methodKey)
	return Reflect.getOwnMetadata(META_PREVENTOVERLAP, target)
}
