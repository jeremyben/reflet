import { ClassType } from './interfaces'

const META_OVERLAP = Symbol('overlap')

export function isOverlapping(target: ClassType, methodKey: string): boolean | undefined {
	return Reflect.getMetadata(META_OVERLAP, target, methodKey)
}

export function setOverlapping(bool: boolean, target: ClassType, methodKey: string) {
	Reflect.defineMetadata(META_OVERLAP, bool, target, methodKey)
}
