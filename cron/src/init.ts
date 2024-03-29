import { JobMap, initialized } from './job-map'
import { extract } from './cron-decorators'
import { ClassType, Job, ObjectInstance } from './interfaces'

/**
 * Initializes cron jobs from a decorated class.
 *
 * @example
 * ```ts
 * class Jobs {
 *   ＠Cron(Expression.EVERY_SECOND)
 *   doSomething() {}
 *
 *   ＠Cron(Expression.EVERY_DAY_AT_MIDNIGHT)
 *   doSomethingElse() {}
 * }
 *
 * const jobs = initCronJobs(Jobs)
 * jobs.startAll()
 * ```
 * ---
 * @public
 */
export function initCronJobs<T extends (new () => any) | ObjectInstance>(target: T) {
	const targetInstance = isClass(target) ? new target() : target
	const targetClass = isClass(target) ? target : (targetInstance.constructor as ClassType)

	const jobMap = new JobMap<T extends ClassType ? InstanceType<T> : T>(targetInstance)
	const runOnInitJobs: Job[] = []

	const keys = Object.getOwnPropertyNames(targetClass.prototype)

	for (const key of keys) {
		if (/^(constructor)$/.test(key)) continue

		const cronTime = extract('cronTime', targetClass, key)
		if (!cronTime) continue

		const onComplete = extract('onComplete', targetClass, key) || extract('onComplete', targetClass)
		const start = extract('start', targetClass, key) || extract('start', targetClass)
		const timeZone = extract('timeZone', targetClass, key) || extract('timeZone', targetClass)
		const utcOffset = extract('utcOffset', targetClass, key) || extract('utcOffset', targetClass)
		const unrefTimeout = extract('unrefTimeout', targetClass, key) || extract('unrefTimeout', targetClass)
		const catchError = extract('catch', targetClass, key) || extract('catch', targetClass)
		const retry = extract('retry', targetClass, key) || extract('retry', targetClass)
		const preFire = extract('preFire', targetClass, key) || extract('preFire', targetClass)
		const postFire = extract('postFire', targetClass, key) || extract('postFire', targetClass)
		const preRetry = extract('preRetry', targetClass, key) || extract('preRetry', targetClass)

		if (preRetry && !retry) {
			console.log(
				`RefletCronWarning: @Cron.PreRetry needs @Cron.Retry to work properly in class "${targetClass.name}".`
			)
		}

		const onTick = Object.getOwnPropertyDescriptor(targetClass.prototype, key)!.value

		jobMap.set(<any>key, {
			cronTime,
			onTick,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
			catch: catchError,
			retry,
			preFire,
			postFire,
			preRetry,
		})

		// Don't pass runOnInit to the parameters.
		// launch later instead of relying on library, to be able to get all context, like private methods.
		// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
		const runOnInit = extract('runOnInit', targetClass, key) ?? extract('runOnInit', targetClass)
		if (runOnInit) {
			runOnInitJobs.push(jobMap.get(<any>key))
		}
	}

	// Add runOnInit logic
	// https://github.com/kelektiv/node-cron/blob/3111ecdd00e950c8d9bf292b9e61f4c27c4e7330/src/job.ts#L94-L95
	for (const runOnInitJob of runOnInitJobs) {
		runOnInitJob.lastExecution = new Date()
		runOnInitJob.fireOnTick()
	}

	jobMap[initialized] = true

	return jobMap
}

/**
 * Abstract class to extend from, which have static `init` method.
 *
 * @example
 * ```ts
 * class Jobs extends CronInit<typeof Jobs> {
 *   ＠Cron(Expression.EVERY_SECOND)
 *   doSomething() {}
 * }
 *
 * const jobs = Jobs.init()
 * ```
 * ---
 * @public
 */
export abstract class CronInit<C extends ClassType> {
	private $typeof?: C

	/**
	 * Initializes cron jobs.
	 */
	/** @ts-ignore private */
	static init<T extends CronInit<any>>(this: ClassType<T>, ...deps: ConstructorParameters<T['$typeof']>) {
		return initCronJobs(new this(...deps))
	}
}

/**
 * Simply checks if given object is a function to distinguish between a class and its instance.
 * @internal
 */
function isClass(obj: object): obj is ClassType {
	return typeof obj === 'function'
}
