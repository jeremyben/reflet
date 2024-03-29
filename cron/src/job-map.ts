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
	set<K extends string>(key: K extends MethodKeys<T> ? never : K, parameters: JobParameters<T>) {
		const contextClass = this.context.constructor as ClassType

		// Retrieve shared options from class as a fallback for dynamic jobs.
		const cronTime = parameters.cronTime
		const onComplete = parameters.onComplete || extract('onComplete', contextClass)
		const start = parameters.start ?? extract('start', contextClass)
		const timeZone = parameters.timeZone || extract('timeZone', contextClass)
		const utcOffset = parameters.utcOffset ?? extract('utcOffset', contextClass)
		const unrefTimeout = parameters.unrefTimeout ?? extract('unrefTimeout', contextClass)

		const onTickExtended = this.#extendOnTick(key, parameters)

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
			value: key,
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

	#extendOnTick(key: string, parameters: JobParameters<T>) {
		const contextClass = this.context.constructor as ClassType

		const onTick = parameters.onTick
		const catchError = parameters.catch || extract('catch', contextClass)
		const retry = parameters.retry || extract('retry', contextClass)
		const preFire = parameters.preFire || extract('preFire', contextClass)
		const postFire = parameters.postFire || extract('postFire', contextClass)
		const preRetry = parameters.preRetry || extract('preRetry', contextClass)

		const onTickExtended = async () => {
			const job = this.get(<any>key)

			let metadata: any

			if (preFire) {
				const hookRes = preFire(job, (val) => (metadata = val))
				const ok = hookRes instanceof Promise ? await hookRes : hookRes

				if (!ok) return
			}

			;(job as any).firing = true

			if (retry) {
				const { delayFactor, delayMax } = retry
				// Clone to avoid mutation of original decorator options.
				let attempts = Math.floor(retry.attempts)
				let delay = retry.delay || 0

				do {
					try {
						await onTick.call(this.context, job)
						break
					} catch (error) {
						attempts--

						if (attempts < 0) {
							if (catchError) catchError(error, job)
							else console.error(error)
							break
						}

						if (preRetry) {
							const hookRes = preRetry(error, job, attempts, delay, metadata)
							const ok = hookRes instanceof Promise ? await hookRes : hookRes

							if (!ok) {
								if (catchError) catchError(error, job)
								else console.error(error)
								break
							}
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
					await onTick.call(this.context, job)
				} catch (error) {
					if (catchError) catchError(error, job)
					else console.error(error)
				}
			}

			;(job as any).firing = false

			postFire?.(job, metadata)
		}

		// Rename to the name of the instance method, for a better error stack.
		Object.defineProperty(onTickExtended, 'name', { value: key })

		return onTickExtended
	}
}
