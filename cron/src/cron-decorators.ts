import { ClassOrMethodDecorator, ClassType, JobParameters, Zone, RetryOptions, Job } from './interfaces'
import { defineMetadata, getOwnMetadata } from './metadata-map'

/* istanbul ignore file - lots of branches with no logic */

const META = {
	cronTime: Symbol('cron-time'),
	onComplete: Symbol('cron-oncomplete'),
	runOnInit: Symbol('cron-runoninit'),
	start: Symbol('cron-start'),
	timeZone: Symbol('cron-timezone'),
	utcOffset: Symbol('cron-utcoffset'),
	unrefTimeout: Symbol('cron-unreftimeout'),
	catch: Symbol('cron-catch'),
	retry: Symbol('cron-retry'),
	preFire: Symbol('cron-prefire'),
	postFire: Symbol('cron-postfire'),
} satisfies Partial<Record<keyof JobParameters, symbol>>

/**
 * The time to fire off your job.
 * This can be in the form of cron syntax or a JS `Date` object.
 *
 * @remarks
 * To help with cron syntax:
 * - use `Expression` enum
 * - [crontab guru](https://crontab.guru)
 *
 * ---
 * @example
 * ```ts
 * class Jobs {
 *   ＠Cron('* * * * * *')
 *   doSomething() {}
 * }
 * ```
 * ---
 * @public
 */
export function Cron(cronTime: string | Date): MethodDecorator {
	return (target, key, descriptor) => {
		defineMetadata(META.cronTime, cronTime, target, key)
	}
}

export namespace Cron {
	/**
	 * A function that will fire when the job is stopped with `job.stop()`,
	 * and may also be called by onTick at the end of each run.
	 * @public
	 */
	export function OnComplete(onComplete: () => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.onComplete, onComplete, target, key)
			else defineMetadata(META.onComplete, onComplete, target)
		}
	}

	/**
	 * This will immediately fire your `onTick` function as soon as the requisit initialization has happened (with `initCronJobs`).
	 *
	 * @example
	 * ```ts
	 * ＠Cron.RunOnInit
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_HOUR)
	 *   doSomething() {}
	 * }
	 *
	 * const jobs = initCronJobs(Jobs) // Will run the jobs once without starting them
	 * jobs.startAll() // Will start the jobs (run every hour)
	 * ```
	 * ---
	 * @public
	 */
	export function RunOnInit(...args: Parameters<ClassOrMethodDecorator>): void
	export function RunOnInit(): ClassOrMethodDecorator
	export function RunOnInit(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) defineMetadata(META.runOnInit, true, target, key)
			else defineMetadata(META.runOnInit, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) defineMetadata(META.runOnInit, true, target, key)
				else defineMetadata(META.runOnInit, true, target)
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
				defineMetadata(META.runOnInit, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					defineMetadata(META.runOnInit, false, target, key)
				}
			}
		}
	}

	/**
	 * Specifies whether to start the job just before exiting the constructor. By default this is set to false.
	 * If left at default you will need to call `start()` or `startAll()` in order to start the job.
	 *
	 * This does not immediately fire your `onTick` function, it just gives you more control over the behavior of your jobs.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.Start
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 *
	 * const jobs = initCronJobs(Jobs) // Will start the jobs, no need to call `startAll()`
	 * ```
	 * ---
	 * @public
	 */
	export function Start(...args: Parameters<ClassOrMethodDecorator>): void
	export function Start(): ClassOrMethodDecorator
	export function Start(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) defineMetadata(META.start, true, target, key)
			else defineMetadata(META.start, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) defineMetadata(META.start, true, target, key)
				else defineMetadata(META.start, true, target)
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
				defineMetadata(META.start, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					defineMetadata(META.start, false, target, key)
				}
			}
		}
	}

	/**
	 * Specify the timezone for the execution. This will modify the actual time relative to your timezone.
	 * If the timezone is invalid, an error is thrown.
	 *
	 * _Probably don't use both `timeZone` and `utcOffset` together or weird things may happen._
	 *
	 * @example
	 * ```ts
	 * ＠Cron.TimeZone('Europe/Paris')
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function TimeZone(timezone: Zone): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.timeZone, timezone, target, key)
			else defineMetadata(META.timeZone, timezone, target)
		}
	}

	/**
	 * This allows you to specify the offset of your timezone rather than using the `timeZone` param.
	 *
	 * _Probably don't use both `timeZone` and `utcOffset` together or weird things may happen._
	 *
	 * @example
	 * ```ts
	 * ＠Cron.UtcOffset(60)
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @see https://momentjs.com/docs/#/manipulating/utc-offset/
	 * @public
	 */
	export function UtcOffset(offset: number): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.utcOffset, offset, target, key)
			else defineMetadata(META.utcOffset, offset, target)
		}
	}

	/**
	 * If you have code that keeps the event loop running and want to stop the node process when that finishes
	 * regardless of the state of your cronjob, you can do so making use of this parameter.
	 *
	 * This is off by default and cron will run as if it needs to control the event loop.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.UnrefTimeout
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @see https://nodejs.org/api/timers.html#timers_timeout_unref
	 * @public
	 */
	export function UnrefTimeout(...args: Parameters<ClassOrMethodDecorator>): void
	export function UnrefTimeout(): ClassOrMethodDecorator
	export function UnrefTimeout(target?: object, key?: string | symbol): ClassOrMethodDecorator | void {
		if (arguments.length && (typeof target === 'function' || typeof target === 'object')) {
			if (key) defineMetadata(META.unrefTimeout, true, target, key)
			else defineMetadata(META.unrefTimeout, true, target)
		} else {
			// tslint:disable-next-line: no-shadowed-variable
			return (target, key, descriptor) => {
				if (key) defineMetadata(META.unrefTimeout, true, target, key)
				else defineMetadata(META.unrefTimeout, true, target)
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
				defineMetadata(META.unrefTimeout, false, target, key!)
			} else {
				// tslint:disable-next-line: no-shadowed-variable
				return (target, key, descriptor) => {
					defineMetadata(META.unrefTimeout, false, target, key)
				}
			}
		}
	}

	/**
	 * Handles job errors. By default, errors are caught and logged to `stderr`.
	 * This decorator allows you to do something else with your errors.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.Catch(async (err) => {
	 *   console.error(err)
	 *   await db.insert(err)
	 * })
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Catch<T = unknown>(errorHandler: (error: T, currentJob: Job) => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.catch, errorHandler, target, key)
			else defineMetadata(META.catch, errorHandler, target)
		}
	}

	/**
	 *
	 * @example
	 * ```ts
	 * ＠Cron.Retry({ attempts: 3, delay: 100, delayFactor: 2, delayMax: 1000 })
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_HOUR)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Retry(options: RetryOptions): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.retry, options, target, key)
			else defineMetadata(META.retry, options, target)
		}
	}

	/**
	 * Hook before the job is fired.
	 *
	 * You can return `false` to prevent the job from firing,
	 * which is useful to implement a mechanism to avoid overlaps.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.PreFire((job) => {
	 *   if (job.firing) return false
	 * })
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function PreFire(fn: (currentJob: Job) => boolean | void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.preFire, fn, target, key)
			else defineMetadata(META.preFire, fn, target)
		}
	}

	/**
	 * Hook after the job has been fired.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.PostFire((job) => {
	 *   console.log(`Job ${job.name} has been successfully executed`)
	 * })
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function PostFire(fn: (currentJob: Job) => boolean | void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) defineMetadata(META.postFire, fn, target, key)
			else defineMetadata(META.postFire, fn, target)
		}
	}

	/**
	 * Options grouped in a single decorator.
	 * @example
	 * ```ts
	 * ＠Cron.Options({
	 *   start: true,
	 *   retry: { attempts: 2 }
	 * })
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Options(options: Omit<JobParameters, 'onTick' | 'cronTime'>): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (options.onComplete) defineMetadata(META.onComplete, options.onComplete, target, key)
			if (options.start) defineMetadata(META.start, options.start, target, key)
			if (options.runOnInit) defineMetadata(META.runOnInit, options.runOnInit, target, key)
			if (options.timeZone) defineMetadata(META.timeZone, options.timeZone, target, key)
			if (options.utcOffset) defineMetadata(META.utcOffset, options.utcOffset, target, key)
			if (options.unrefTimeout) defineMetadata(META.unrefTimeout, options.unrefTimeout, target, key)
			if (options.retry) defineMetadata(META.retry, options.retry, target, key)
			if (options.catch) defineMetadata(META.catch, options.catch, target, key)
			if (options.preFire) defineMetadata(META.preFire, options.preFire, target, key)
			if (options.postFire) defineMetadata(META.postFire, options.postFire, target, key)
		}
	}
}

/**
 * @internal
 */
export function extract<T extends keyof typeof META>(
	parameter: T,
	target: ClassType,
	methodKey?: string
): JobParameters[T] {
	if (methodKey) return getOwnMetadata(META[parameter], target.prototype, methodKey)
	return getOwnMetadata(META[parameter], target)
}
