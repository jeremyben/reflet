import { RefletMongooseError } from './reflet-error'
import { ModelAny } from './interfaces'
import { defineMetadata, getOwnMetadata } from './metadata-map'

const MetaModel = Symbol('model')

/**
 * @internal
 */
export function registerModelDecorator(model: ModelAny, type: 'Model' | 'Model.Discriminator') {
	defineMetadata(MetaModel, type, model)
}

/**
 * Mecanism to prevent user from applying `@Model` and `@Model.Discriminator` before schema-related decorators.
 * @internal
 */
export function checkDecoratorsOrder(target: object): void {
	const appliedModelDecorator = getOwnMetadata(MetaModel, target)

	if (appliedModelDecorator) {
		throw new RefletMongooseError(
			'INVALID_DECORATORS_ORDER',
			`You must put @${appliedModelDecorator} at the top of "${(target as any).modelName}" decorators.`
		)
	}
}
