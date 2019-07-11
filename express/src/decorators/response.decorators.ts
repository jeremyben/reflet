import META from './metadata-keys'

/**
 * Defines a template to be rendered by the controller.
 * @alpha
 */
export function Render(template: string): MethodDecorator {
	return (target, methodKey, descriptor) => {
		Reflect.defineMetadata(META.RENDER, template, descriptor.value!)
		return descriptor
	}
}
