import { defineMethod } from './faker-meta'
import { FakerStatic } from './interfaces'

/**
 * @see http://marak.github.io/faker.js/faker.name
 * @public
 */
export namespace FakeName {
	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-findName__anchor
	 * @public
	 */
	export function FindName(...args: Parameters<FakerStatic['name']['findName']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'findName'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-firstName__anchor
	 * @public
	 */
	export function FirstName(...args: Parameters<FakerStatic['name']['firstName']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'firstName'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-jobArea__anchor
	 * @public
	 */
	export function JobArea(...args: Parameters<FakerStatic['name']['jobArea']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'jobArea'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-jobDescriptor__anchor
	 * @public
	 */
	export function JobDescriptor(...args: Parameters<FakerStatic['name']['jobDescriptor']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'jobDescriptor'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-jobTitle__anchor
	 * @public
	 */
	export function JobTitle(...args: Parameters<FakerStatic['name']['jobTitle']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'jobTitle'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-jobType__anchor
	 * @public
	 */
	export function JobType(...args: Parameters<FakerStatic['name']['jobType']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'jobType'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-lastName__anchor
	 * @public
	 */
	export function LastName(...args: Parameters<FakerStatic['name']['lastName']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'lastName'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-prefix__anchor
	 * @public
	 */
	export function Prefix(...args: Parameters<FakerStatic['name']['prefix']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'prefix'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-suffix__anchor
	 * @public
	 */
	export function Suffix(...args: Parameters<FakerStatic['name']['suffix']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'suffix'], args })
	}

	/**
	 * @see http://marak.github.io/faker.js/faker.name#-static-title__anchor
	 * @public
	 */
	export function Title(...args: Parameters<FakerStatic['name']['title']>): PropertyDecorator {
		return defineMethod({ methodPath: ['name', 'title'], args })
	}
}
