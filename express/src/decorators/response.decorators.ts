import Meta from './metadata-keys'

/**
 * Defines a template to be rendered by the controller.
 * @alpha
 */
export function Render(template: string): MethodDecorator {
	return (target, methodKey, descriptor) => {
		Reflect.defineMetadata(Meta.Render, template, descriptor.value!)
		return descriptor
	}
}
