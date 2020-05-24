import * as ts from 'typescript'
import { pathToRegexp, Key } from 'path-to-regexp'
import { getExpressionName } from './ts-utils'

/**
 * Retrieves root path from `@Router` decorator.
 */
export function getRefletRouter(
	checker: ts.TypeChecker,
	clas: ts.ClassDeclaration
): { router: Route | null; mergeParamsShouldBeTrue: boolean } {
	let mergeParamsShouldBeTrue = false
	let router: Route | null = null

	if (!clas.decorators) return { router, mergeParamsShouldBeTrue }

	for (const decorator of clas.decorators) {
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
export function getRefletRoutes(checker: ts.TypeChecker, method: ts.MethodDeclaration): Route[] {
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

/**
 * Guard: decorator is a Reflet route decorator
 */
function isHandlerParameterDecorator(
	checker: ts.TypeChecker,
	deco: ts.Decorator,
	name?: HandlerParameterDecorator
): boolean {
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

type HandlerParameterDecorator = 'Req' | 'Res' | 'Next' | 'Body' | 'Params' | 'Query' | 'Headers'

type Route = {
	path: string
	keys: Key[]
	name: string
	decorator: ts.Decorator & { expression: ts.CallExpression }
}
