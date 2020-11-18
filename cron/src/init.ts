import { CronJob } from 'cron'
import { CronJobMap } from './cron-job-map'
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
	Cron,
} from './cron-decorators'
import { isOverlapping, setOverlapping } from './overlap'
import { ClassType, MethodKeys } from './interfaces'

/**
 * @public
 */
export function initCronJobs<T extends object>(target: T) {
	type MethodKey = T extends ClassType ? MethodKeys<InstanceType<T>> : MethodKeys<T>

	const targetInstance: object = isClass(target) ? new target() : target
	const targetClass = isClass(target) ? target : (targetInstance.constructor as ClassType)

	const cronJobMap = new CronJobMap<MethodKey>()

	const methodkeys = Object.getOwnPropertyNames(targetClass.prototype)

	const runOnInitJobs: CronJob[] = []

	for (const methodKey of methodkeys) {
		if (/^(constructor)$/.test(methodKey)) continue

		const cronTime = extractCronTime(targetClass, methodKey)
		if (!cronTime) continue

		const onComplete = extractOnComplete(targetClass, methodKey) || extractOnComplete(targetClass)
		const start = extractStart(targetClass, methodKey) || extractStart(targetClass)
		const timeZone = extractTimeZone(targetClass, methodKey) || extractTimeZone(targetClass)
		const utcOffset = extractUtcOffset(targetClass, methodKey) || extractUtcOffset(targetClass)
		const unrefTimeout = extractUnrefTimeout(targetClass, methodKey) || extractUnrefTimeout(targetClass)
		const handleError = extractCatch(targetClass, methodKey) || extractCatch(targetClass)
		const preventOverlap = extractPreventOverlap(targetClass, methodKey) || extractPreventOverlap(targetClass)

		const methodDescriptor = Object.getOwnPropertyDescriptor(targetClass.prototype, methodKey)!
		const method = methodDescriptor.value as (...args: any[]) => void | Promise<void>

		const onTick = async function (this: object, ...args: any[]) {
			try {
				if (preventOverlap) {
					if (isOverlapping(targetClass, methodKey)) return
					setOverlapping(true, targetClass, methodKey)
				}
				await method.apply(this, args)
			} catch (error) {
				if (handleError) handleError(error)
				else console.error(error)
			} finally {
				if (preventOverlap) {
					setOverlapping(false, targetClass, methodKey)
				}
			}
		}

		const job = new CronJob({
			cronTime,
			onTick,
			context: targetInstance,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
		})

		const runOnInit = extractRunOnInit(targetClass, methodKey) || extractRunOnInit(targetClass)
		if (runOnInit) {
			runOnInitJobs.push(job)
		}

		cronJobMap.set(<MethodKey>methodKey, job)
	}

	if (targetInstance instanceof Cron.Container) {
		Object.defineProperty(targetInstance, 'container', { value: cronJobMap })
	}

	// launch runOnInit here instead of relying on library, to be able to get all context.
	// https://github.com/kelektiv/node-cron/blob/v1.8.2/lib/cron.js#L570
	for (const runOnInitJob of runOnInitJobs) {
		;(runOnInitJob as any).lastExecution = new Date()
		runOnInitJob.fireOnTick()
	}

	return cronJobMap
}

/**
 * Simply checks if given object is a function to distinguish between a class and its instance.
 * @internal
 */
function isClass(obj: object): obj is ClassType {
	return typeof obj === 'function'
}
