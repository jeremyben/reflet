import { CronJob } from 'cron'

/**
 * @public
 */
export class CronJobMap<K> extends Map<K, CronJob> {
	startAll() {
		this.forEach((job) => job.start())
	}

	stopAll() {
		this.forEach((job) => job.stop())
	}

	// Only way to remove undefined from the union
	// @ts-ignore implementation
	get(key: K): CronJob
}
