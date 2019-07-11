import META from './metadata-keys'
import { ClassType, Request, Response, NextFunction } from '../interfaces'

enum PARAM {
	REQUEST,
	RESPONSE,
	NEXT,
	BODY,
	QUERY,
	PARAM,
	HEADERS,
	SESSION,
}

type ParamMeta = {
	index: number
	type: PARAM
	subKey?: string
}

function defineMeta(type: PARAM, subKey?: string): ParameterDecorator {
	return (target, methodKey, index) => {
		const params: ParamMeta[] = Reflect.getOwnMetadata(META.PARAMS, target, methodKey) || []
		params.push({ index, type, subKey })
		Reflect.defineMetadata(META.PARAMS, params, target, methodKey)
	}
}

/**
 * @see https://expressjs.com/en/4x/api.html#req
 * @public
 */
export const Req = () => defineMeta(PARAM.REQUEST)

/**
 * @see https://expressjs.com/en/4x/api.html#res
 * @public
 */
export const Res = () => defineMeta(PARAM.RESPONSE)

/**
 * @see https://expressjs.com/en/guide/writing-middleware.html
 * @public
 */
export const Next = () => defineMeta(PARAM.NEXT)

/**
 * @see https://expressjs.com/en/4x/api.html#req.body
 * @public
 */
export const Body = <T = object>(key?: keyof T) => defineMeta(PARAM.BODY, key as string | undefined)

/**
 * @see https://expressjs.com/en/4x/api.html#req.params
 * @public
 */
export const Param = (key?: string) => defineMeta(PARAM.PARAM, key)

/**
 * @see https://expressjs.com/en/4x/api.html#req.query
 * @public
 */
export const Query = (key?: string) => defineMeta(PARAM.QUERY, key)

/**
 * @public
 */
export const Headers = (key?: string) => defineMeta(PARAM.HEADERS, key)

export function extractParams(
	target: ClassType,
	methodKey: string | symbol,
	{ req, res, next }: { req: Request; res: Response; next: NextFunction }
) {
	const params: ParamMeta[] | undefined = Reflect.getOwnMetadata(META.PARAMS, target.prototype, methodKey)

	if (!params || !params.length) return [req, res, next]

	const args: any[] = []

	for (const { type, index, subKey } of params) {
		switch (type) {
			case PARAM.REQUEST:
				args[index] = req
				break
			case PARAM.RESPONSE:
				args[index] = res
				break
			case PARAM.NEXT:
				args[index] = next
				break
			case PARAM.BODY:
				args[index] = subKey ? req.body[subKey] : req.body
				break
			case PARAM.PARAM:
				args[index] = subKey ? req.params[subKey] : req.params
				break
			case PARAM.QUERY:
				args[index] = subKey ? req.query[subKey] : req.query
				break
			case PARAM.HEADERS:
				args[index] = subKey ? req.headers[subKey] : req.headers
				break
			default:
				throw Error('Route parameter type not recognized')
		}
	}

	return args
}
