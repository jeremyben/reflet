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

		const onComplete = extract('onComplete', targetClass, key)
		const start = extract('start', targetClass, key)
		const timeZone = extract('timeZone', targetClass, key)
		const utcOffset = extract('utcOffset', targetClass, key)
		const unrefTimeout = extract('unrefTimeout', targetClass, key)
		const catchError = extract('catchError', targetClass, key)
		const retry = extract('retry', targetClass, key)
		const preventOverlap = extract('preventOverlap', targetClass, key)
		const passCurrentJob = extract('passCurrentJob', targetClass, key)

		const methodDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, key)!

		jobMap.set(<any>key, {
			cronTime,
			onTick: methodDescriptor.value,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
			catchError,
			preventOverlap,
			retry,
			passCurrentJob,
		})

		// Don't pass runOnInit to the parameters.
		// launch later instead of relying on library, to be able to get all context, like private methods.
		// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
		const runOnInit = extract('runOnInit', targetClass, key) ?? extract('runOnInit', targetClass)
		if (runOnInit) {
			runOnInitJobs.push(jobMap.get(<any>key))
		}
	}

	for (const runOnInitJob of runOnInitJobs) {
		;(runOnInitJob as any).lastExecution = new Date()
		runOnInitJob.fireOnTick()
	}

	jobMap[initialized] = true

	return jobMap
}

/**
 * Simply checks if given object is a function to distinguish between a class and its instance.
 * @internal
 */
function isClass(obj: object): obj is ClassType {
	return typeof obj === 'function'
}
