import { JobMap, Container, initialized } from './job-map'
import { extract } from './cron-decorators'
import { ClassType, Job } from './interfaces'

/**
 * @public
 */
export function initCronJobs<T extends object>(target: T) {
	const targetInstance = isClass(target) ? new target() : target
	const targetClass = isClass(target) ? target : (targetInstance.constructor as ClassType)

	const jobMap = new JobMap<T extends ClassType ? InstanceType<T> : T>(targetInstance)

	const keys = Object.getOwnPropertyNames(targetClass.prototype)

	const runOnInitJobs: Job[] = []

	for (const key of keys) {
		if (/^(constructor)$/.test(key)) continue

		const cronTime = extract('cronTime', targetClass, key)
		if (!cronTime) continue

		const onComplete = extract('onComplete', targetClass, key)
		const start = extract('start', targetClass, key)
		const timeZone = extract('timeZone', targetClass, key)
		const utcOffset = extract('utcOffset', targetClass, key)
		const unrefTimeout = extract('unrefTimeout', targetClass, key)
		const errorHandler = extract('errorHandler', targetClass, key)
		const retryOptions = extract('retryOptions', targetClass, key)
		const preventOverlap = extract('preventOverlap', targetClass, key)

		const methodDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, key)!
		const method = methodDescriptor.value as (...args: any[]) => void | Promise<void>

		jobMap.set(key, {
			cronTime,
			onTick: method,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
			errorHandler,
			preventOverlap,
			retryOptions,
		})

		// Don't pass runOnInit to the parameters.
		// launch later instead of relying on library, to be able to get all context,
		// like private methods and `container`.
		// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
		const runOnInit = extract('runOnInit', targetClass, key) ?? extract('runOnInit', targetClass)
		if (runOnInit) {
			runOnInitJobs.push(jobMap.get(<any>key))
		}
	}

	if (targetInstance instanceof Container) {
		Object.defineProperty(targetInstance, 'container', { value: jobMap })
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
