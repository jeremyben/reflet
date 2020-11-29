import { CronJob } from 'cron'

/**
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * @public
 */
export type ClassOrMethodDecorator = <TFunction extends Function>(
	target: TFunction | Object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * @public
 */
export type MethodKeys<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

/**
 * @public
 */
export interface Job extends CronJob {
	/**
	 * Returns `true` if the job's tick function is actually being run.
	 *
	 * _The original `running` property defines whether the job has been started or stopped._
	 */
	readonly firing: boolean
}
