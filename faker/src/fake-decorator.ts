import { FakerStatic } from './interfaces'

// export function Faker<T>(callback: (faker: FakerStatic) => T): ClassDecorator {
// 	return (target) => {}
// }

/**
 * @public
 */
export function Faker<T>(obj: { [P in keyof T]: FakerLazy<T[P]> }): ClassDecorator {
	return (target) => {}
}

export namespace Faker {
	export function fake(str: string): FakerLazy<string> {
		return (faker: FakerStatic) => faker.fake(str)
	}
}

type FakerLazy<T> = (faker: FakerStatic) => T
