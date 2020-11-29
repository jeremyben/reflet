import { Job } from './interfaces'

/**
 * @public
 */
export class JobMap<K> extends Map<K, Job> {
	startAll() {
		this.forEach((job) => job.start())
	}

	stopAll() {
		this.forEach((job) => job.stop())
	}

	// Only way to remove undefined from the union
	// @ts-ignore implementation
	get(key: K): Job
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
