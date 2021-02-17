import {
	ClassOrMethodDecorator,
	ClassType,
	JobParameters,
	Offset,
	Zone,
	RetryOptions,
	RedisLockOption,
} from './interfaces'

/* istanbul ignore file - lots of branches with no logic */

const META: Partial<Record<keyof JobParameters, symbol>> = {
	cronTime: Symbol('cron-time'),
	onComplete: Symbol('cron-oncomplete'),
	runOnInit: Symbol('cron-runoninit'),
	start: Symbol('cron-start'),
	timeZone: Symbol('cron-timezone'),
	utcOffset: Symbol('cron-utcoffset'),
	unrefTimeout: Symbol('cron-unreftimeout'),
	catchError: Symbol('cron-catch'),
	preventOverlap: Symbol('cron-preventoverlap'),
	retry: Symbol('cron-retry'),
	passCurrentJob: Symbol('current-job'),
}

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
		Reflect.defineMetadata(META.cronTime, cronTime, target, key)
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
			if (key) Reflect.defineMetadata(META.onComplete, onComplete, target, key)
			else Reflect.defineMetadata(META.onComplete, onComplete, target)
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
			if (key) Reflect.defineMetadata(META.timeZone, timezone, target, key)
			else Reflect.defineMetadata(META.timeZone, timezone, target)
		}
	}

	/**
	 * This allows you to specify the offset of your timezone rather than using the `timeZone` param.
	 *
	 * _Probably don't use both `timeZone` and `utcOffset` together or weird things may happen._
	 *
	 * @example
	 * ```ts
	 * ＠Cron.UtcOffset('+01:00')
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
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
	export function Catch<T = unknown>(errorHandler: (error: T) => void): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META.catchError, errorHandler, target, key)
			else Reflect.defineMetadata(META.catchError, errorHandler, target)
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
			if (key) Reflect.defineMetadata(META.retry, options, target, key)
			else Reflect.defineMetadata(META.retry, options, target)
		}
	}

	/**
	 * Prevents the job from being fired if the previous occurence is not finished.
	 * Useful for potentially long jobs firing every second.
	 *
	 * @example
	 * ```ts
	 * ＠Cron.PreventOverlap
	 * class Jobs {
	 *   ＠Cron(Expression.EVERY_SECOND)
	 *   doSomething() {}
	 * }
	 * ```
	 * ---
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
		 * Cron lock to prevent distributed cron jobs from overlapping, with the help of Redis.
		 * _Requires [node-redlock](https://github.com/mike-marcacci/node-redlock)._
		 *
		 * @param lock - function that should return the lock promise
		 * @see [node-redlock#usage-promise-style](https://github.com/mike-marcacci/node-redlock#usage-promise-style)
		 *
		 * @example
		 * ```ts
		 * ＠Cron.PreventOverlap((job) => {
		 *   const redlock = new Redlock([redisClient], { retryCount: 0 })
		 *   return redlock.lock(`lock:${job.name}`, 1000)
		 * })
		 * class Jobs {
		 *   ＠Cron(Expression.EVERY_SECOND)
		 *   async doSomething() {}
		 * }
		 * ```
		 * ---
		 * @public
		 */
		export function RedisLock(lock: RedisLockOption['lock']): ClassOrMethodDecorator {
			// Check that redlock module has been installed (throw a MODULE_NOT_FOUND error if not).
			require.resolve('redlock')

			return (target, key, descriptor) => {
				const redlocker: RedisLockOption = { type: 'redis', lock }

				if (key) Reflect.defineMetadata(META.preventOverlap, redlocker, target, key)
				else Reflect.defineMetadata(META.preventOverlap, redlocker, target)
			}
		}

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
	export function Options(
		options: Omit<JobParameters, 'onTick' | 'cronTime' | 'passCurrentJob'>
	): ClassOrMethodDecorator {
		return (target, key, descriptor) => {
			if (key) {
				if (options.onComplete) Reflect.defineMetadata(META.onComplete, options.onComplete, target, key)
				if (options.start) Reflect.defineMetadata(META.start, options.start, target, key)
				if (options.runOnInit) Reflect.defineMetadata(META.runOnInit, options.runOnInit, target, key)
				if (options.timeZone) Reflect.defineMetadata(META.timeZone, options.timeZone, target, key)
				if (options.utcOffset) Reflect.defineMetadata(META.utcOffset, options.utcOffset, target, key)
				if (options.unrefTimeout) Reflect.defineMetadata(META.unrefTimeout, options.unrefTimeout, target, key)
				if (options.retry) Reflect.defineMetadata(META.retry, options.retry, target, key)
				if (options.preventOverlap) {
					Reflect.defineMetadata(META.preventOverlap, options.preventOverlap, target, key)
				}
				if (options.catchError) Reflect.defineMetadata(META.catchError, options.catchError, target, key)
			} else {
				if (options.onComplete) Reflect.defineMetadata(META.onComplete, options.onComplete, target)
				if (options.start) Reflect.defineMetadata(META.start, options.start, target)
				if (options.runOnInit) Reflect.defineMetadata(META.runOnInit, options.runOnInit, target)
				if (options.timeZone) Reflect.defineMetadata(META.timeZone, options.timeZone, target)
				if (options.utcOffset) Reflect.defineMetadata(META.utcOffset, options.utcOffset, target)
				if (options.unrefTimeout) Reflect.defineMetadata(META.unrefTimeout, options.unrefTimeout, target)
				if (options.retry) Reflect.defineMetadata(META.retry, options.retry, target)
				if (options.preventOverlap) Reflect.defineMetadata(META.preventOverlap, options.preventOverlap, target)
				if (options.catchError) Reflect.defineMetadata(META.catchError, options.catchError, target)
			}
		}
	}
}

/**
 * Access current job from its own `onTick` function.
 *
 * @example
 * ```ts
 * class Jobs {
 *   ＠Cron(Expression.EVERY_SECOND)
 *   doSomething(＠CurrentJob job: Job) {
 *     job.stop()
 *   }
 * }
 * ```
 * ---
 * @public
 */
export function CurrentJob(...args: Parameters<ParameterDecorator>): void
export function CurrentJob(): ParameterDecorator
export function CurrentJob(target?: object, key?: string | symbol, index?: number): ParameterDecorator | void {
	if (arguments.length && typeof index === 'number') {
		Reflect.defineMetadata(META.passCurrentJob, true, target!, key!)
	} else {
		// tslint:disable-next-line: no-shadowed-variable
		return (target, key, index) => {
			Reflect.defineMetadata(META.passCurrentJob, true, target, key)
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
