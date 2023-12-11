import { CronJob } from 'cron'
import { extract } from './cron-decorators'
import { ClassType, Job, JobParameters, MethodKeys } from './interfaces'

export const initialized = Symbol('initialized')

/**
 * @public
 */
export class JobMap<T extends object> extends Map<MethodKeys<T>, Job> {
	/** Reference to the decorated instance */
	private context: T

	/** Switch turned `true` when all the static jobs have been initialized. Helps with runOnInit logic. */
	private [initialized] = false

	constructor(context: T) {
		super()
		this.context = context
	}

	/**
	 * Starts all cron jobs.
	 */
	startAll() {
		this.forEach((job) => job.start())
	}

	/**
	 * Stops all cron jobs.
	 */
	stopAll() {
		this.forEach((job) => job.stop())
	}

	// @ts-ignore implementation
	get(key: MethodKeys<T>): Job

	/**
	 * Adds a dynamic cron job.
	 * @param key - name (typed to prevent overriding decorated jobs).
	 * @param parameters - cron job parameters.
	 */
	/** @ts-ignore override parameters */
	set<K extends string>(
		key: K extends MethodKeys<T> ? never : K,
		parameters: JobParameters<T>
	) {
		const contextClass = this.context.constructor as ClassType

		const cronTime = parameters.cronTime
		const onComplete = parameters.onComplete || extract('onComplete', contextClass)
		const start = parameters.start ?? extract('start', contextClass)
		const timeZone = parameters.timeZone || extract('timeZone', contextClass)
		const utcOffset = parameters.utcOffset ?? extract('utcOffset', contextClass)
		const unrefTimeout = parameters.unrefTimeout ?? extract('unrefTimeout', contextClass)

		const onTickExtended = this.extendOnTick(key, parameters)

		const job = CronJob.from({
			cronTime,
			onTick: onTickExtended,
			context: this.context,
			onComplete,
			start,
			timeZone,
			utcOffset: utcOffset as any,
			unrefTimeout,
		})

		Object.defineProperty(job, 'firing', {
			enumerable: true,
			value: false,
			writable: true,
		})

		Object.defineProperty(job, 'name', {
			enumerable: true,
			value: `${contextClass.name}.${key}`,
		})

		super.set(<any>key, <any>job)

		// Add runOnInit logic for dynamic jobs
		// https://github.com/kelektiv/node-cron/blob/3111ecdd00e950c8d9bf292b9e61f4c27c4e7330/src/job.ts#L94-L95
		if (this[initialized]) {
			const runOnInit = parameters.runOnInit ?? extract('runOnInit', contextClass)
			if (runOnInit) {
				job.lastExecution = new Date()
				job.fireOnTick()
			}
		}

		return this
	}

	private extendOnTick(key: string, parameters: JobParameters<T>) {
		const contextClass = this.context.constructor as ClassType

		const onTick = parameters.onTick as Function
		const catchError = parameters.catchError || extract('catchError', contextClass)
		const retry = parameters.retry || extract('retry', contextClass)
		const preventOverlap = parameters.preventOverlap ?? extract('preventOverlap', contextClass)

		const onTickExtended = async (onCompleteArg?: () => void) => {
			const currentJob = this.get(<any>key)

			// todo: HOOK on fire

			if (preventOverlap) {
				if (currentJob.firing) return
			}

			;(currentJob as any).firing = true

			if (retry) {
				// Clone to avoid mutation of original decorator options
				let attempts = retry.attempts
				let delay = retry.delay || 0
				const { delayFactor, delayMax, condition } = retry

				do {
					try {
						await onTick.call(this.context, currentJob)
						break
					} catch (error) {
						if (--attempts < 0 || (condition && !condition(error))) {
							if (catchError) catchError(error)
							else console.error(error)
							break
						}

						// todo: HOOK on failed retry

						if (delay) {
							await new Promise((resolve) => setTimeout(resolve, delay))

							if (delayFactor) {
								delay = delay * delayFactor
							}

							if (delayMax && delay > delayMax) {
								delay = delayMax
							}
						}
					}
				} while (true)
			}

			// Without retry
			else {
				try {
					await onTick.call(this.context, currentJob)
				} catch (error) {
					if (catchError) catchError(error)
					else console.error(error)
				}
			}

			;(currentJob as any).firing = false

			// todo: HOOK on end
		}

		// Rename to the name of the instance method, for a better error stack.
		Object.defineProperty(onTickExtended, 'name', { value: key })

		return onTickExtended
	}
}
