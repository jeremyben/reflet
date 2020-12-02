import { ClassOrMethodDecorator, ClassType, JobParameters, Offset, RetryOptions, Zone } from './interfaces'

const META: Partial<Record<keyof JobParameters, symbol>> = {
	cronTime: Symbol('cron-time'),
	onComplete: Symbol('cron-oncomplete'),
	runOnInit: Symbol('cron-runoninit'),
	start: Symbol('cron-start'),
	timeZone: Symbol('cron-timezone'),
	utcOffset: Symbol('cron-utcoffset'),
	unrefTimeout: Symbol('cron-unreftimeout'),
	errorHandler: Symbol('cron-catch'),
	preventOverlap: Symbol('cron-preventoverlap'),
	retryOptions: Symbol('cron-retry'),
}

/**
 * The time to fire off your job.
 * This can be in the form of cron syntax or a JS `Date` object.
 * @public
 */
export function Cron(cronTime: string | Date): MethodDecorator {
	return (target, key, descriptor) => {
		Reflect.defineMetadata(META.cronTime, cronTime, target, key)
	}
}

export namespace Cron {
	/**
	 * A function that will fire when the job is stopped with `job.stop()`, and may also be called by onTick at the end of each run.
	 * @public
	 */
	export function OnComplete(onComplete: () => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.onComplete, onComplete, target, key)
			else Reflect.defineMetadata(META.onComplete, onComplete, target)
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
			if (key) Reflect.defineMetadata(META.runOnInit, true, target, key)
			else Reflect.defineMetadata(META.runOnInit, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META.runOnInit, true, target, key)
				else Reflect.defineMetadata(META.runOnInit, true, target)
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
				Reflect.defineMetadata(META.runOnInit, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META.runOnInit, false, target, key)
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
			if (key) Reflect.defineMetadata(META.start, true, target, key)
			else Reflect.defineMetadata(META.start, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META.start, true, target, key)
				else Reflect.defineMetadata(META.start, true, target)
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
				Reflect.defineMetadata(META.start, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META.start, false, target, key)
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
	export function TimeZone(timezone: Zone): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.timeZone, timezone, target, key)
			else Reflect.defineMetadata(META.timeZone, timezone, target)
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
	export function UtcOffset(offset: Offset | number): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.utcOffset, offset, target, key)
			else Reflect.defineMetadata(META.utcOffset, offset, target)
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
			if (key) Reflect.defineMetadata(META.unrefTimeout, true, target, key)
			else Reflect.defineMetadata(META.unrefTimeout, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META.unrefTimeout, true, target, key)
				else Reflect.defineMetadata(META.unrefTimeout, true, target)
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
				Reflect.defineMetadata(META.unrefTimeout, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META.unrefTimeout, false, target, key)
				}
			}
		}
	}

	/**
	 * @public
	 */
	export function Catch(errorHandler: (error: unknown) => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.errorHandler, errorHandler, target, key)
			else Reflect.defineMetadata(META.errorHandler, errorHandler, target)
		}
	}

	/**
	 * @public
	 */
	export function PreventOverlap(...args: Parameters<ClassOrMethodDecorator>): void
	export function PreventOverlap(): ClassOrMethodDecorator
	export function PreventOverlap(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) Reflect.defineMetadata(META.preventOverlap, true, target, key)
			else Reflect.defineMetadata(META.preventOverlap, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(META.preventOverlap, true, target, key)
				else Reflect.defineMetadata(META.preventOverlap, true, target)
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
				Reflect.defineMetadata(META.preventOverlap, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					Reflect.defineMetadata(META.preventOverlap, false, target, key)
				}
			}
		}
	}

	/**
	 * @public
	 */
	export function Retry(options: RetryOptions): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.retryOptions, options, target, key)
			else Reflect.defineMetadata(META.retryOptions, options, target)
		}
	}
}

/**
 * @internal
 */
export function extract<T extends Exclude<keyof JobParameters, 'onTick'>>(
	parameter: T,
	target: ClassType,
	methodKey?: string
): JobParameters[T] {
	if (methodKey) return Reflect.getOwnMetadata(META[parameter], target.prototype, methodKey)
	return Reflect.getOwnMetadata(META[parameter], target)
}
