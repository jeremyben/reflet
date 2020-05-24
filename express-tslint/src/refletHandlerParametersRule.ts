import * as ts from 'typescript'
import { Rules, RuleFailure, IRuleMetadata, WalkContext, Replacement, IOptions, Utils } from 'tslint'
import { pathToRegexp, Key } from 'path-to-regexp'
import {
	makeTypeFix,
	getInstalledModuleSourceFile,
	getTopLevelInterface,
	extendsType,
	getExpressionName,
	getObjectProperties,
} from './utils'

export class Rule extends Rules.TypedRule {
	static metadata: IRuleMetadata = {
		ruleName: 'reflet-handler-parameters',
		type: 'functionality',
		description: 'Make sure handler parameters are correctly typed.',
		options: null,
		optionsDescription: '',
		hasFix: true,
		typescriptOnly: true,
	}

	applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[] {
		return this.applyWithFunction(sourceFile, walk, this.getOptions(), program)
	}
}

type Route = {
	path: string
	keys: Key[]
	name: string
	decorator: ts.Decorator & { expression: ts.CallExpression }
}

let checker: ts.TypeChecker

const cache = {
	refletSourceFile: undefined as ts.SourceFile | undefined,
	expressSourceFile: undefined as ts.SourceFile | undefined,
	expressInterfaces: {
		Request: undefined as ts.InterfaceDeclaration | undefined,
		Response: undefined as ts.InterfaceDeclaration | undefined,
		NextFunction: undefined as ts.InterfaceDeclaration | undefined,
	},
}

function walk(ctx: WalkContext<IOptions>, program: ts.Program) {
	if (ctx.sourceFile.isDeclarationFile) return

	cache.refletSourceFile =
		cache.refletSourceFile || getInstalledModuleSourceFile('@reflet/express', ctx.sourceFile, program)
	if (!cache.refletSourceFile) return

	cache.expressSourceFile =
		cache.expressSourceFile || getInstalledModuleSourceFile('express', ctx.sourceFile, program)
	if (!cache.expressSourceFile) {
		const fix = Replacement.appendText(
			0,
			`// "yarn add -D @types/express" or "npm i -D @types/express"${ts.sys.newLine}`
		)
		ctx.addFailure(0, 0, '@types/express should be installed', fix)
		return
	}

	checker = program.getTypeChecker()

	return ts.forEachChild(ctx.sourceFile, function cb(node): void {
		if (!ts.isClassDeclaration(node)) return ts.forEachChild(node, cb)

		const { router, mergeParamsShouldBeTrue } = getRefletRouter(node)

		if (router && mergeParamsShouldBeTrue) {
			ctx.addFailureAtNode(
				router.decorator,
				`If you want named parameters to work with the router,\nyou should pass 'mergeParams: true' in its options.`
			)
		}

		// ─── Class methods ───
		for (const member of node.members) {
			// Look only for decorated methods.
			if (!ts.isMethodDeclaration(member) || !member.decorators) continue

			// Retrieve paths from route decorators (could have multiple route decorators on one method).
			const routes = getRefletRoutes(member)
			// Look no further if there's no routes (no Reflet decorator).
			if (!routes.length) continue

			// First see if there's at least one decoratored parameter, to enforce decorators on all parameters,
			// as they are required if at least one exists.
			const hasParameterDecorators = member.parameters.some((p) => Boolean(p.decorators))

			if (hasParameterDecorators) {
				for (const param of member.parameters) {
					checkDecoratedParameter(param, router, routes, ctx)
				}
			} else {
				checkMethodWithNonDecoratedParameters(member, ctx)
			}
		}

		return ts.forEachChild(node, cb)
	})
}

function checkDecoratedParameter(
	param: ts.ParameterDeclaration,
	router: Route | null,
	routes: Route[],
	ctx: WalkContext<IOptions>
) {
	// Enforce decorators on all parameters.
	if (!param.decorators) {
		return ctx.addFailureAtNode(param, `Must be decorated with a Reflet decorator.`)
	}

	// Get only Reflet decorators
	const handlerParamDecorators = param.decorators.filter((deco) => isHandlerParameterDecorator(deco))

	if (handlerParamDecorators.length === 0) {
		return ctx.addFailureAtNode(param, `Must be decorated with a Reflet decorator.`)
	}

	if (handlerParamDecorators.length > 1) {
		for (let index = 0; index < handlerParamDecorators.length; index++) {
			const decorator = handlerParamDecorators[index]
			const lastIndex = handlerParamDecorators.length - 1

			// Keep last remaining decorator.
			if (index !== lastIndex) {
				ctx.addFailureAtNode(
					decorator,
					`Only one Reflet decorator per parameter.`,
					Replacement.deleteFromTo(decorator.pos, decorator.end)
				)
			}
		}
		return
	}

	const [refletDecorator] = handlerParamDecorators
	// Get invoked decorators' arguments.
	const inputs = ts.isCallExpression(refletDecorator.expression) ? refletDecorator.expression.arguments : null

	// ─── @Req ───

	if (isHandlerParameterDecorator(refletDecorator, 'Req')) {
		checkIsExpressType(param, 'Request', ctx)
		return
	}

	// ─── @Res ───

	if (isHandlerParameterDecorator(refletDecorator, 'Res')) {
		checkIsExpressType(param, 'Response', ctx)
		return
	}

	// ─── @Next ───

	if (isHandlerParameterDecorator(refletDecorator, 'Next')) {
		checkIsExpressType(param, 'NextFunction', ctx)
		return
	}

	// ─── @Body ───

	if (isHandlerParameterDecorator(refletDecorator, 'Body')) {
	}

	// ─── @Params ───

	if (isHandlerParameterDecorator(refletDecorator, 'Params')) {
		checkParamDecorator(param, inputs, router, routes, ctx)
		return
	}

	// ─── @Query ───

	if (isHandlerParameterDecorator(refletDecorator, 'Query')) {
		const paramType = checker.getTypeAtLocation(param)
		const indexType = paramType.getStringIndexType()
		// indexType?.isUnion() && indexType.types.some((t) => !!(t.flags & ts.TypeFlags.StringLike))
		// makeTypeFix(param, 'ParsedUrlQuery', 'querystring', ctx.sourceFile)
	}

	// ─── @Headers ───

	if (isHandlerParameterDecorator(refletDecorator, 'Headers')) {
		// makeTypeFix(param, 'IncomingHttpHeaders', 'http', ctx.sourceFile)
	}
}

function checkParamDecorator(
	param: ts.ParameterDeclaration,
	inputs: ts.NodeArray<ts.Expression> | null,
	router: Route | null,
	routes: Route[],
	ctx: WalkContext<IOptions>
) {
	// Invoked with a named parameter: `@Params('id')`
	if (inputs?.length) {
		const [input] = inputs
		if (!ts.isStringLiteral(input)) return

		// Look for route param in the router.
		const keyInRouter = router?.keys.find((k) => k.name === input.text)

		if (keyInRouter) {
			const keyInRouterIsOptional = keyInRouter.modifier === '?' || keyInRouter.modifier === '*'

			if (keyInRouterIsOptional && !isTypedAsStringOrUndefined(param)) {
				ctx.addFailureAtNode(
					param.type || param.name,
					`Route parameter ${input.text} is optional in router ${router!.name}.`,
					makeTypeFix(param, 'string | undefined')
				)
			} else if (!keyInRouterIsOptional && isTypedAsStringOrUndefined(param)) {
				// Aknowledge questionToken fix.
				const fixes: Replacement[] = [makeTypeFix(param, 'string')]
				if (param.questionToken) fixes.push(Replacement.replaceNode(param.questionToken, ''))

				ctx.addFailureAtNode(
					param.type || param.name,
					`Route parameter ${input.text} is not optional in router ${
						router!.name
					},\nit should only be of type string.`,
					fixes
				)
			} else {
				checkIsTypedAsString(param, ctx)
			}

			return
		}
		// from there, keyInRouter is undefined.

		const { keyIsInAllRoutes, keyIsInNoRoute, keyIsOptional, routeNames } = getNamedParamInfos(input.text, routes)

		// Did not find the route param in any of the routes or the router.
		if (keyIsInNoRoute) {
			let message = `Could not find route parameter ${input.text} in route ${routeNames.join(' or ')}`
			if (router) message += `, or router ${router.name}`
			ctx.addFailureAtNode(input, `${message}.`, Replacement.replaceNode(input, ''))
			return // do not continue with other checks on the same prop.
		}
		// From here, key is at least in one route.

		if (!keyIsInAllRoutes && !isTypedAsStringOrUndefined(param)) {
			ctx.addFailureAtNode(
				param.type || param.name,
				`Route parameter ${input.text} is not in one of the routes ${routeNames.join(
					' or '
				)},\nit should be of type string | undefined.`,
				makeTypeFix(param, 'string | undefined')
			)
		} else if (keyIsOptional && !isTypedAsStringOrUndefined(param)) {
			ctx.addFailureAtNode(
				param.type || param.name,
				`Route parameter ${input.text} is optional in route ${routeNames.join(
					' or '
				)},\nit should be of type string | undefined.`,
				//we don't specify the context sourceFile node could be in another sourceFile.
				makeTypeFix(param, 'string | undefined')
			)
		} else if (!keyIsOptional && keyIsInAllRoutes && isTypedAsStringOrUndefined(param)) {
			// Aknowledge questionToken fix.
			const fixes: Replacement[] = [makeTypeFix(param, 'string')]
			if (param.questionToken) fixes.push(Replacement.replaceNode(param.questionToken, ''))

			ctx.addFailureAtNode(
				param.type || param.name,
				`Route parameter ${input.text} is not optional in route ${routeNames.join(
					' and '
				)},\nit should only be of type string.`,
				fixes
			)
		} else {
			checkIsTypedAsString(param, ctx)
		}
	}

	// Not invoked with a named parameter: `@Params` or `Params()`
	else {
		const paramType = checker.getNonNullableType(checker.getTypeAtLocation(param))
		const props = getObjectProperties(paramType)

		// Check existing object type and its properties.
		for (const propSymbol of props) {
			const propText = propSymbol.name
			const propNode = propSymbol.valueDeclaration as ts.PropertySignature

			const keyInRouter = router?.keys.find((k) => k.name === propText)

			if (keyInRouter) {
				const keyInRouterIsOptional = keyInRouter.modifier === '?' || keyInRouter.modifier === '*'

				if (keyInRouterIsOptional && !isTypedAsStringOrUndefined(propNode)) {
					ctx.addFailureAtNode(
						propNode.type || propNode.name,
						`Route parameter ${propText} is optional in router ${
							router!.name
						},\nit should be of type string | undefined.`,
						Replacement.appendText(propNode.name.end, '?')
					)
				} else if (!keyInRouterIsOptional && isTypedAsStringOrUndefined(propNode)) {
					// Aknowledge questionToken fix.
					const fixes: Replacement[] = [makeTypeFix(propNode, 'string')]
					if (propNode.questionToken) fixes.push(Replacement.replaceNode(propNode.questionToken, ''))

					ctx.addFailureAtNode(
						propNode.type || propNode.name,
						`Route parameter ${propText} is not optional in router ${
							router!.name
						},\nit should only be of type string.`,
						fixes
					)
				} else {
					checkIsTypedAsString(propNode, ctx)
				}

				continue
			}
			// From here, keyInRouter is always undefined

			const { keyIsInAllRoutes, keyIsInNoRoute, keyIsOptional, routeNames } = getNamedParamInfos(propText, routes)

			// Did not find the route param in any of the routes or the router.
			if (keyIsInNoRoute) {
				let message = `Could not find route parameter ${propText} in route ${routeNames.join(' or ')}`
				if (router) message += `, or router ${router.name}`
				ctx.addFailureAtNode(propNode, `${message}.`, Replacement.replaceNode(propNode, ''))
				continue // do not continue with other checks on the same prop.
			}
			// From here, key is at least in one route.

			if (!keyIsInAllRoutes && !isTypedAsStringOrUndefined(propNode)) {
				ctx.addFailureAtNode(
					propNode.type || propNode.name,
					`Route parameter ${propText} is not in one of the routes ${routeNames.join(
						' or '
					)},\nit should be of type string | undefined.`,
					Replacement.appendText(propNode.name.end, '?')
				)
			} else if (keyIsOptional && !isTypedAsStringOrUndefined(propNode)) {
				ctx.addFailureAtNode(
					propNode.type || propNode.name,
					`Route parameter ${propText} is optional in route ${routeNames.join(
						' or '
					)},\nit should be of type string | undefined.`,
					Replacement.appendText(propNode.name.end, '?')
				)
			} else if (!keyIsOptional && keyIsInAllRoutes && isTypedAsStringOrUndefined(propNode)) {
				// Aknowledge questionToken fix.
				const fixes: Replacement[] = [makeTypeFix(propNode, 'string')]
				if (propNode.questionToken) fixes.push(Replacement.replaceNode(propNode.questionToken, ''))

				ctx.addFailureAtNode(
					param.type || param.name,
					`Route parameter ${propText} is not optional in route ${routeNames.join(
						' and '
					)},\nit should only be of type string.`,
					fixes
				)
			} else {
				checkIsTypedAsString(propNode, ctx)
			}
		}

		// Now check missing properties.
		// todo: better fix with the optional properties (right now, fix for optional must be done in two steps).

		const propsNames = props.map((s) => s.name)
		const missingKeys = new Map<string, Key>()

		const routerAndRoutes = router ? [router, ...routes] : routes
		for (const routerOrRoute of routerAndRoutes) {
			for (const key of routerOrRoute.keys) {
				if (!propsNames.includes(key.name.toString())) {
					missingKeys.set(key.name.toString(), key)
				}
			}
		}

		if (missingKeys.size) {
			const missingKeysMessage = Array.from(missingKeys.keys()).join(', ')

			const missingKeysFix = Array.from(missingKeys)
				.map(([keyName, key]) => {
					// Can't detect if the key is in multiple routes and is only optional in one
					// (because of the Map deduplication).
					const questionToken = key.modifier === '?' || key.modifier === '*' ? '?' : ''
					return `${keyName}${questionToken}: string`
				})
				.join('; ')

			if (!(paramType.flags & ts.TypeFlags.Object)) {
				ctx.addFailureAtNode(
					param.type || param.name,
					`Should be an object with following properties: ${missingKeysMessage}`,
					makeTypeFix(param, `{ ${missingKeysFix} }`)
				)
			} else {
				ctx.addFailureAtNode(
					param.type || param.name,
					`Missing properties: ${missingKeysMessage}`,
					makeTypeFix(
						param,
						// Not the most reliable fix, but the simplest for now.
						// https://regex101.com/r/vEK4jU/1
						checker.typeToString(paramType).replace(/}\s*$/m, `${missingKeysFix} }`)
					)
				)
			}
		}
	}

	function getNamedParamInfos(namedParam: string, routes: Route[]) {
		// Loop to check that the key exists or not in all routes,
		// also check that if it's optional in one of the routes, it should be optional in the properties,
		// no matter if it's mandatory in another route.
		let keyIsInAllRoutes = true
		let keyIsInNoRoute = true
		let keyIsOptional = false
		const routeNames: string[] = []

		for (const route of routes) {
			routeNames.push(route.name)

			if (keyIsInAllRoutes) {
				keyIsInAllRoutes = route.keys.some((k) => k.name.toString() === namedParam)
			}

			if (keyIsInNoRoute) {
				keyIsInNoRoute = route.keys.every((k) => k.name.toString() !== namedParam)
			}

			if (!keyIsOptional) {
				// prettier-ignore
				keyIsOptional = route.keys.some((k) => k.name.toString() === namedParam && (k.modifier === '?' || k.modifier === '*'))
			}
		}

		return { keyIsInAllRoutes, keyIsInNoRoute, keyIsOptional, routeNames }
	}
}

/**
 * Asserts Reflet route's method without decorators.
 * No decorator => parameters order is known.
 */
function checkMethodWithNonDecoratedParameters(method: ts.MethodDeclaration, ctx: WalkContext<IOptions>): void {
	const [reqParam, resParam, nextParam, ...otherParams] = method.parameters

	if (reqParam) checkIsExpressType(reqParam, 'Request', ctx)
	if (resParam) checkIsExpressType(resParam, 'Response', ctx)
	if (nextParam) checkIsExpressType(nextParam, 'NextFunction', ctx)

	if (otherParams && otherParams.length) {
		const start = otherParams[0].getStart(ctx.sourceFile)
		const end = otherParams[otherParams.length - 1].end
		ctx.addFailure(start, end, `A request handler has 3 parameters max.`, Replacement.deleteFromTo(start, end))
	}
}

/**
 * Asserts node is of type `string` (could be nullable `string` as well).
 */
function checkIsTypedAsString(node: ts.ParameterDeclaration | ts.PropertySignature, ctx: WalkContext<IOptions>): void {
	const type = checker.getNonNullableType(checker.getTypeAtLocation(node))

	let isTypedAsString = false

	if (type.isUnion()) {
		isTypedAsString = type.types.every((t) => !!(t.flags & ts.TypeFlags.StringLike))
	} else {
		isTypedAsString = !!(type.flags & ts.TypeFlags.StringLike)
	}

	if (!isTypedAsString) {
		ctx.addFailureAtNode(
			node.type || node.name,
			`Should be of type string.`,
			makeTypeFix(node, 'string') // node could be in another sourceFile
		)
	}
}

/**
 * Asserts param is of Express parameter handler type.
 */
function checkIsExpressType(
	param: ts.ParameterDeclaration,
	name: 'Request' | 'Response' | 'NextFunction',
	ctx: WalkContext<IOptions>
): void {
	const nodeType = checker.getTypeAtLocation(param)

	if (!cache.expressInterfaces[name]) {
		// Could not properly cache the ts.Type directly (reference changes every time).
		cache.expressInterfaces[name] = getTopLevelInterface(name, cache.expressSourceFile!)
	}
	const expressType = checker.getTypeAtLocation(cache.expressInterfaces[name]!)

	const isExpressType = extendsType(nodeType, expressType)

	if (!isExpressType) {
		ctx.addFailureAtNode(
			param.type || param,
			`Should be of type ${name}.`,
			makeTypeFix(param, name, 'express', ctx.sourceFile)
		)
	}

	if (param.questionToken) {
		ctx.addFailureAtNode(
			param.questionToken,
			`Should not be optional.`,
			Replacement.replaceNode(param.questionToken, '')
		)
	}
}

/**
 * Guards node is of type `string | undefined`.
 */
function isTypedAsStringOrUndefined(node: ts.ParameterDeclaration | ts.PropertySignature): boolean {
	const type = checker.getTypeAtLocation(node)

	let isTypedAsString = false
	let isTypedAsUndefined = false

	// todo?: aknowledge cases where strictNullChecks is false, and the compiler API won't detect an union with undefined.
	if (type.isUnion()) {
		for (const t of type.types) {
			if (!!(t.flags & ts.TypeFlags.StringLike)) isTypedAsString = true
			if (!!(t.flags & ts.TypeFlags.Undefined)) isTypedAsUndefined = true
		}
	}

	return isTypedAsString && isTypedAsUndefined
}

/**
 * Retrieves root path from `@Router` decorator.
 */
function getRefletRouter(class_: ts.ClassDeclaration): { router: Route | null; mergeParamsShouldBeTrue: boolean } {
	let mergeParamsShouldBeTrue = false
	let router: Route | null = null

	if (!class_.decorators) return { router, mergeParamsShouldBeTrue }

	for (const decorator of class_.decorators) {
		// Router is an invoked decorator.
		if (!ts.isCallExpression(decorator.expression)) continue

		const type = checker.getTypeAtLocation(decorator.expression.expression)
		const returnType = type.getCallSignatures()[0].getReturnType()
		const isRouterDecorator =
			returnType.isIntersection() && returnType.types.some((t) => t.getProperty('__expressRouter'))

		if (!isRouterDecorator) continue

		const name = getExpressionName(decorator.expression)
		const pathInput = decorator.expression.arguments[0] as ts.Expression | undefined
		const optionsInput = decorator.expression.arguments[1] as ts.Expression | undefined

		if (pathInput && (ts.isStringLiteral(pathInput) || ts.isRegularExpressionLiteral(pathInput))) {
			// https://github.com/pillarjs/path-to-regexp#usage
			const keys: Key[] = []

			// Avoid crashing the linter when typing the paths.
			try {
				pathToRegexp(pathInput.text, keys)
			} catch (err) {}

			// For the router keys to be handled in its routes, you must switch 'mergeParams' to true.
			if (keys.length) {
				const isMergeParamsTrue =
					optionsInput &&
					ts.isObjectLiteralExpression(optionsInput) &&
					optionsInput.properties.some((prop) => {
						const isMergeParams =
							!!prop.name && ts.isIdentifier(prop.name) && prop.name.text === 'mergeParams'

						const isTrue =
							ts.isPropertyAssignment(prop) && prop.initializer.kind === ts.SyntaxKind.TrueKeyword

						return isMergeParams && isTrue
					})

				if (!isMergeParamsTrue) mergeParamsShouldBeTrue = true
			}

			router = {
				path: pathInput.text,
				keys,
				name,
				decorator: decorator as ts.Decorator & { expression: ts.CallExpression },
			}
		}
	}

	return { router, mergeParamsShouldBeTrue }
}

/**
 * Retrieve paths of Reflet route decorators (could have multiple route decorators one one method).
 * Empty array means no route decorators.
 */
function getRefletRoutes(method: ts.MethodDeclaration): Route[] {
	const routes: Route[] = []

	for (const decorator of method.decorators || []) {
		if (!ts.isCallExpression(decorator.expression)) continue

		const type = checker.getTypeAtLocation(decorator.expression.expression)
		const returnType = type.getCallSignatures()[0].getReturnType()

		const isRouteDecorator =
			returnType.isIntersection() && returnType.types.some((t) => t.getProperty('__expressRoute'))

		if (!isRouteDecorator) continue

		const name = getExpressionName(decorator.expression)

		// todo: Won't work with @Method (2 arguments)
		const pathInput = decorator.expression.arguments[0] as ts.Expression | undefined

		if (pathInput === undefined) {
			// Handle optional parameter as in `@Get()`.
			routes.push({
				path: '',
				keys: [],
				name,
				decorator: decorator as ts.Decorator & { expression: ts.CallExpression },
			})
		} else if (ts.isStringLiteral(pathInput) || ts.isRegularExpressionLiteral(pathInput)) {
			// https://github.com/pillarjs/path-to-regexp#usage
			const keys: Key[] = []

			// Avoid crashing the linter when typing the paths.
			try {
				pathToRegexp(pathInput.text, keys)
			} catch (err) {}

			routes.push({
				path: pathInput.text,
				keys,
				name,
				decorator: decorator as ts.Decorator & { expression: ts.CallExpression },
			})
		}
	}

	return routes
}

type HandlerParameterDecorator = 'Req' | 'Res' | 'Next' | 'Body' | 'Params' | 'Query' | 'Headers'

/**
 * Guard: decorator is a Reflet route decorator
 */
function isHandlerParameterDecorator(deco: ts.Decorator, name?: HandlerParameterDecorator): boolean {
	const { expression } = ts.isCallExpression(deco.expression) ? deco.expression : deco
	const type = checker.getTypeAtLocation(expression)
	const signatures = type.getCallSignatures()

	// Each decorator have two signatures: invoked and not invoked,
	// the invoked signature will return the right type.
	return signatures.some((signature) => {
		const returnType = signature.getReturnType()
		if (!returnType.isIntersection()) return false

		return returnType.types.some((t) => {
			if (name) return t.getProperty('__expressHandlerParameter') && t.getProperty(`__express${name}`)
			return t.getProperty('__expressHandlerParameter')
		})
	})
}
