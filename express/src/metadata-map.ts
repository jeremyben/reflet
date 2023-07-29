// Taken from https://github.com/abraham/reflection

const Metadata = new WeakMap()

type Key = string | symbol

export function getMetadata(metadataKey: Key, target: object, propertyKey?: Key): any {
	return (
		getOwnMetadata(metadataKey, target, propertyKey) ||
		(Object.getPrototypeOf(target)
			? getMetadata(metadataKey, Object.getPrototypeOf(target), propertyKey)
			: undefined)
	)
}

export function getOwnMetadata(metadataKey: Key, target: object, propertyKey?: Key): any {
	if (target === undefined) {
		throw new TypeError()
	}
	const metadataMap = getMetadataMap(target, propertyKey)
	return metadataMap && metadataMap.get(metadataKey)
}

export function defineMetadata(metadataKey: Key, metadataValue: any, target: object, propertyKey?: Key): void {
	if (propertyKey && !['string', 'symbol'].includes(typeof propertyKey)) {
		throw new TypeError()
	}

	;(getMetadataMap(target, propertyKey) || createMetadataMap(target, propertyKey)).set(metadataKey, metadataValue)
}

function getMetadataMap(target: object, propertyKey?: Key): Map<Key, any> {
	return Metadata.get(target) && Metadata.get(target).get(propertyKey)
}

function createMetadataMap(target: object, propertyKey?: Key): Map<Key, any> {
	const targetMetadata = Metadata.get(target) || new Map<Key | undefined, Map<Key, any>>()
	Metadata.set(target, targetMetadata)
	const metadataMap = targetMetadata.get(propertyKey) || new Map<Key, any>()
	targetMetadata.set(propertyKey, metadataMap)
	return metadataMap
}
