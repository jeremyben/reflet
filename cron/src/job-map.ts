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

	/**
	 * Adds a dynamic cron job.
	 * @param key - name (typed to prevent overriding decorated jobs).
	 * @param parameters - cron job parameters.
	 */
	// @ts-ignore override parameters
	set<K extends string, PassJob extends boolean = false>(
		key: K extends MethodKeys<T> ? never : K,
		parameters: JobParameters<T, PassJob>
	) {
		const contextClass = this.context.constructor as ClassType

		const cronTime = parameters.cronTime
		const onTick = parameters.onTick as Function
		const onComplete = parameters.onComplete || extract('onComplete', contextClass)
		const start = parameters.start ?? extract('start', contextClass)
		const timeZone = parameters.timeZone || extract('timeZone', contextClass)
		const utcOffset = parameters.utcOffset ?? extract('utcOffset', contextClass)
		const unrefTimeout = parameters.unrefTimeout ?? extract('unrefTimeout', contextClass)
		const catchError = parameters.catchError || extract('catchError', contextClass)
		const retry = parameters.retry || extract('retry', contextClass)
		const preventOverlap = parameters.preventOverlap || extract('preventOverlap', contextClass)
		const passCurrentJob = parameters.passCurrentJob

		const onTickExtended = async (onCompleteArg?: () => void) => {
			const currentJob = this.get(<any>key)

			if (preventOverlap && currentJob.firing) {
				return
			}

			;(currentJob as any).firing = true

			if (retry) {
				// Clone to avoid mutation of original decorator options
				let retries = retry.maxRetries
				let delay = retry.delay || 0
				const { delayFactor, delayMax, condition } = retry

				do {
					try {
						if (passCurrentJob) {
							await onTick.call(this.context, currentJob)
						} else {
							await onTick.call(this.context, onCompleteArg)
						}
						break
					} catch (error) {
						if (--retries < 0 || (condition && !condition(error))) {
							if (catchError) catchError(error)
							else console.error(error)
							break
						}

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
					if (passCurrentJob) {
						await onTick.call(this.context, currentJob)
					} else {
						await onTick.call(this.context, onCompleteArg)
					}
				} catch (error) {
					if (catchError) catchError(error)
					else console.error(error)
				}
			}

			;(currentJob as any).firing = false
		}

		// Rename to the name of the instance method, for a better error stack.
		Object.defineProperty(onTickExtended, 'name', { value: key })

		const job = new CronJob({
			cronTime,
			onTick: onTickExtended,
			context: this.context,
			onComplete,
			start,
			timeZone,
			utcOffset,
			unrefTimeout,
		})

		Object.defineProperty(job, 'firing', {
			enumerable: true,
			writable: true,
			value: false,
		})

		Object.defineProperty(job, 'name', {
			enumerable: true,
			value: `${contextClass.name}.${key}`,
		})

		super.set(<any>key, <Job>job)

		// runOnInit logic for dynamic jobs
		if (this[initialized]) {
			const runOnInit = parameters.runOnInit ?? extract('runOnInit', contextClass)
			if (runOnInit) {
				;(<any>job).lastExecution = new Date()
				job.fireOnTick()
			}
		}

		return this
	}

	// @ts-ignore implementation
	get(key: MethodKeys<T>): Job
}
