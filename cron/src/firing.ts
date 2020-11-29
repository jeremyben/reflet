import { ClassType } from './interfaces'

const META_FIRING = Symbol('firing')

export function isFiring(target: ClassType, methodKey: string): boolean {
	return Reflect.getMetadata(META_FIRING, target, methodKey) ?? false
}

export function setFiring(bool: boolean, target: ClassType, methodKey: string) {
	Reflect.defineMetadata(META_FIRING, bool, target, methodKey)
}
