import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ClassType, DocumentAny } from './interfaces'

const MetaSchemaPlugin = Symbol('schema-plugin')

/**
 * Defines plugin on the schema.
 *
 * Plugins will be applied after fields and virtuals/getters, and before hooks, embedded discriminators and schema callbacks.
 *
 * @remarks
 * You can apply as many `SchemaPlugin` decorators as you want.
 * Plugins are applied on the routes in the order they are written.
 *
 * @public
 */
export function SchemaPlugin<T extends DocumentAny, O = any>(
	fn: SchemaPlugin.Fn<T>,
	options?: O
): SchemaPlugin.Decorator {
	return (target) => {
		checkDecoratorsOrder(target)
		const plugins = getPlugins(target)
		plugins.unshift({ fn, options })
		Reflect.defineMetadata(MetaSchemaPlugin, plugins, target)
	}
}

export namespace SchemaPlugin {
	/**
	 * @public
	 */
	export type Fn<T> = Parameters<mongoose.Schema<T>['plugin']>[0]

	/**
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongooseSchemaPlugin?: never
	}
}

/**
 * @internal
 */
export function applyPlugins(schema: mongoose.Schema<any>, target: ClassType) {
	const plugins = getPlugins(target)

	for (const plugin of plugins) {
		schema.plugin(plugin.fn, plugin.options)
	}
}

/**
 * @internal
 */
function getPlugins(target: Function): PluginMeta[] {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return (Reflect.getMetadata(MetaSchemaPlugin, target) || []).slice()
}

/**
 * @internal
 */
interface PluginMeta {
	fn: SchemaPlugin.Fn<any>
	options: any
}
