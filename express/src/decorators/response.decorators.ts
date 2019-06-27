const META = '_RENDER_'

/**
 * Defines a template to be rendered by the controller.
 */
export function Render(template: string): MethodDecorator {
	return (target, methodKey, descriptor) => {
		Reflect.defineMetadata(META, template, descriptor.value!)
		return descriptor
	}
}
