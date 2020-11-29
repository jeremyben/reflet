import { CronJob } from 'cron'
import { Job, JobParameters } from './interfaces'

/**
 * @public
 */
export class JobMap<K> extends Map<K, Job> {
	private firing = new Set<string>()
	private instance: any

	startAll() {
		this.forEach((job) => job.start())
	}

	stopAll() {
		this.forEach((job) => job.stop())
	}

	// @ts-ignore override parameters
	set(key: any, parameters: JobParameters) {
		const {
			cronTime,
			context,
			onComplete,
			start,
			timeZone,
			utcOffset,
			onTick,
			unrefTimeout,
			runOnInit,
			preventOverlap,
			errorHandler,
		} = parameters

		if (!this.instance) {
			this.instance = context
		}

		const onTickExtended = async (...args: any[]) => {
			if (preventOverlap && this.firing.has(key)) return

			this.firing.add(key)
				try {
					await onTick.apply(context || this.instance, args)
				} catch (error) {
					if (errorHandler) errorHandler(error)
					else console.error(error)
				} finally {
					this.firing.delete(key)
				}
		}

		const job = new CronJob({
			cronTime,
			onTick: onTickExtended,
			context: context || this.instance,
			onComplete,
			start,
			runOnInit,
			timeZone,
			utcOffset,
			unrefTimeout,
		})

		Object.defineProperty(job, 'firing', {
			enumerable: true,
			get: () => this.firing.has(key),
		})

		super.set(key, job as Job)

		return this
	}

	// Only way to remove undefined from the union
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
