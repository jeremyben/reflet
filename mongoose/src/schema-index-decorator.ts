import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ClassType, PlainKeys } from './interfaces'

const MetaSchemaIndex = Symbol('schema-index')

/**
 * Defines indexes on the schema.
 *
 * @public
 */
export function SchemaIndex<T extends Record<string, any>>(
	index: SchemaIndex.IndexDefinition<T>,
	options?: mongoose.IndexOptions
): SchemaIndex.Decorator {
	return (target) => {
		checkDecoratorsOrder(target)

		const indexes = getIndexes(target)
		indexes.unshift({ index: index as mongoose.IndexDefinition, options })
		Reflect.defineMetadata(MetaSchemaIndex, indexes, target)
	}
}

export namespace SchemaIndex {
	/**
	 * @public
	 */
	export type IndexDefinition<T extends Record<string, any>> = { [K in PlainKeys<T>]?: mongoose.IndexDirection }

	/**
	 * @public
	 */
	export type Decorator = ClassDecorator & { __mongooseSchemaIndex?: never }
}

/**
 * @internal
 */
export function applyIndexes(schema: mongoose.Schema<any>, target: ClassType) {
	const indexes = getIndexes(target)

	for (const index of indexes) {
		schema.index(index.index!, index.options)
	}
}

/**
 * @internal
 */
function getIndexes(target: Function): IndexMeta[] {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return (Reflect.getMetadata(MetaSchemaIndex, target) || []).slice()
}

/**
 * @internal
 */
interface IndexMeta {
	index: mongoose.IndexDefinition
	options: mongoose.IndexOptions | undefined
}
