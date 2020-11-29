import { JobMap, Container } from './job-map'
import {
	extractCatch,
	extractCronTime,
	extractOnComplete,
	extractPreventOverlap,
	extractRunOnInit,
	extractStart,
	extractTimeZone,
	extractUnrefTimeout,
	extractUtcOffset,
} from './cron-decorators'
import { ClassType, Job, MethodKeys } from './interfaces'

/**
 * @public
 */
export function initCronJobs<T extends object>(target: T) {
	type MethodKey = T extends ClassType ? MethodKeys<InstanceType<T>> : MethodKeys<T>

	const targetInstance: object = isClass(target) ? new target() : target
	const targetClass = isClass(target) ? target : (targetInstance.constructor as ClassType)

	const jobMap = new JobMap<MethodKey>()

	const methodkeys = Object.getOwnPropertyNames(targetClass.prototype)

	const runOnInitJobs: Job[] = []

	for (const methodKey of methodkeys) {
		if (/^(constructor)$/.test(methodKey)) continue

		const cronTime = extractCronTime(targetClass, methodKey)
		if (!cronTime) continue

		const onComplete = extractOnComplete(targetClass, methodKey) || extractOnComplete(targetClass)
		const start = extractStart(targetClass, methodKey) ?? extractStart(targetClass)
		const timeZone = extractTimeZone(targetClass, methodKey) || extractTimeZone(targetClass)
		const utcOffset = extractUtcOffset(targetClass, methodKey) ?? extractUtcOffset(targetClass)
		const unrefTimeout = extractUnrefTimeout(targetClass, methodKey) ?? extractUnrefTimeout(targetClass)
		const errorHandler = extractCatch(targetClass, methodKey) || extractCatch(targetClass)
		const preventOverlap = extractPreventOverlap(targetClass, methodKey) ?? extractPreventOverlap(targetClass)
		// const retryOptions = extractRetry(targetClass, methodKey) || extractRetry(targetClass)

		const methodDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, methodKey)!
		const method = methodDescriptor.value as (...args: any[]) => void | Promise<void>

		jobMap.set(methodKey, {
			cronTime,
			onTick: method,
			context: targetInstance,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
			errorHandler,
			preventOverlap,
			retryOptions,
		})

		// launch runOnInit later instead of relying on library, to be able to get all context, like `container`.
		// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
		const runOnInit = extractRunOnInit(targetClass, methodKey) ?? extractRunOnInit(targetClass)
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
