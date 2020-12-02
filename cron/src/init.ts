import { JobMap, Container } from './job-map'
import { extract } from './cron-decorators'
import { ClassType, Job, MethodKeys } from './interfaces'

/**
 * @public
 */
export function initCronJobs<T extends object>(target: T) {
	type MethodKey = T extends ClassType ? MethodKeys<InstanceType<T>> : MethodKeys<T>

	const targetInstance: object = isClass(target) ? new target() : target
	const targetClass = isClass(target) ? target : (targetInstance.constructor as ClassType)

	const jobMap = new JobMap<MethodKey>(targetInstance)

	const methodkeys = Object.getOwnPropertyNames(targetClass.prototype)

	const runOnInitJobs: Job[] = []

	for (const methodKey of methodkeys) {
		if (/^(constructor)$/.test(methodKey)) continue

		const cronTime = extract('cronTime', targetClass, methodKey)
		if (!cronTime) continue

		const onComplete =
			extract('onComplete', targetClass, methodKey) || extract('onComplete', targetClass, methodKey)
		const start = extract('start', targetClass, methodKey) ?? extract('start', targetClass)
		const timeZone = extract('timeZone', targetClass, methodKey) || extract('timeZone', targetClass)
		const utcOffset = extract('utcOffset', targetClass, methodKey) ?? extract('utcOffset', targetClass)
		const unrefTimeout = extract('unrefTimeout', targetClass, methodKey) ?? extract('unrefTimeout', targetClass)
		const errorHandler = extract('errorHandler', targetClass, methodKey) || extract('errorHandler', targetClass)
		const retryOptions = extract('retryOptions', targetClass, methodKey) || extract('retryOptions', targetClass)
		const preventOverlap =
			extract('preventOverlap', targetClass, methodKey) ?? extract('preventOverlap', targetClass)

		const methodDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, methodKey)!
		const method = methodDescriptor.value as (...args: any[]) => void | Promise<void>

		jobMap.set(methodKey, {
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

		// Don't pass runOnInit:
		// launch later instead of relying on library, to be able to get all context, like `container`.
		// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
		const runOnInit = extract('runOnInit', targetClass, methodKey) ?? extract('runOnInit', targetClass)
		if (runOnInit) {
			runOnInitJobs.push(jobMap.get<any>(methodKey)!)
		}
	}

	if (targetInstance instanceof Container) {
		Object.defineProperty(targetInstance, 'container', { value: jobMap })
	}

	for (const runOnInitJob of runOnInitJobs) {
		;(runOnInitJob as any).lastExecution = new Date()
		runOnInitJob.fireOnTick()
	}

	return jobMap
}

/**
 * Simply checks if given object is a function to distinguish between a class and its instance.
 * @internal
 */
function isClass(obj: object): obj is ClassType {
	return typeof obj === 'function'
}
