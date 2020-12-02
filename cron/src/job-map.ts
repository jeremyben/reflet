import { CronJob } from 'cron'
import { Job, JobParameters } from './interfaces'

/**
 * @public
 */
export class JobMap<K> extends Map<K, Job> {
	private firing = new Set<string>()
	private context: object

	constructor(context: object) {
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

	// @ts-ignore override parameters
	set(key: string, parameters: JobParameters) {
		const {
			cronTime,
			onComplete,
			start,
			timeZone,
			utcOffset,
			onTick,
			unrefTimeout,
			runOnInit,
			preventOverlap,
			errorHandler,
			retryOptions,
		} = parameters

		const onTickExtended = async (...args: any[]) => {
			if (preventOverlap && this.firing.has(key)) return

			this.firing.add(key)

			if (retryOptions) {
				// Clone to avoid mutation of original decorator options
				let retries = retryOptions.maxRetries
				let delay = retryOptions.delay || 0
				const { delayFactor, delayMax, condition } = retryOptions

				do {
					try {
						await onTick.apply(this.context, args)
						break
					} catch (error) {
						if (--retries < 0 || (condition && !condition(error))) {
							if (errorHandler) errorHandler(error)
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
					await onTick.apply(this.context, args)
				} catch (error) {
					if (errorHandler) errorHandler(error)
					else console.error(error)
				}
			}

			this.firing.delete(key)
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
			get: () => this.firing.has(key),
		})

		Object.defineProperty(job, 'name', {
			enumerable: true,
			value: `${this.context.constructor.name}.${key}`,
		})

		super.set(<any>key, <Job>job)

		// Launch runOnInit of the dynamic job after setting the job to have all context.
		if (runOnInit) {
			;(<any>job).lastExecution = new Date()
			job.fireOnTick()
		}

		return this
	}

	// @ts-ignore implementation
	get<P extends K>(key: P): P extends K ? Job : Job | undefined
}

/**
 * Creates a `container` property, to allow retrieving actual cron job context from instance methods.
 *
 * @example
 * ```ts
 * class Jobs extends Container<Jobs> {
 *   ＠Cron('* * * * * *')
 *   logMessage() {
 *     console.log('message')
 *     this.container.get('logMessage').stop()
 *   }
 * }
 * ```
 * ---
 * @public
 */
export class Container<T extends object> {
	// Dont use Omit and MethodKeys together to avoid a weird type signature on inference.
	container!: JobMap<{ [P in keyof T]: P extends 'container' ? never : T[P] extends Function ? P : never }[keyof T]>
}
