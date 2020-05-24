import { ESLintUtils, TSESTree, AST_NODE_TYPES, TSESLint, ASTUtils } from '@typescript-eslint/experimental-utils'
import * as ts from 'typescript'
import {
	hasTypeAnnotation,
	isCallExpression,
	isClassProperty,
	isStringLiteralType,
	isStringType,
	isUnionType,
	matchTypeKeyword,
} from './ast-utils'
import { getRefletRouter } from './reflet-utils'
import { getInstalledModuleSourceFile } from './ts-utils'

export default ESLintUtils.RuleCreator((ruleName) => ruleName)({
	name: 'reflet-handler-parameter',
	meta: {
		type: 'problem',
		docs: {
			description: 'Reflet/express decorators',
			category: 'Possible Errors',
			recommended: false,
			requiresTypeChecking: true,
			suggestion: true,
		},
		messages: {
			handlerParameterType: '',
			singleRouteDecorator: '',
			routerDecorator: '',
			mergeParams: `If you want named parameters to work with the router,\nyou should pass 'mergeParams: true' in its options.`,
		},
		schema: [],
	},
	defaultOptions: [],
	create(ctx) {
		const { program, esTreeNodeToTSNodeMap, tsNodeToESTreeNodeMap } = ESLintUtils.getParserServices(ctx)

		// console.log('context.options', context.options)
		const checker = program.getTypeChecker()

		const cache = {
			refletSourceFile: undefined as ts.SourceFile | undefined,
			expressSourceFile: undefined as ts.SourceFile | undefined,
			expressInterfaces: {
				Request: undefined as ts.InterfaceDeclaration | undefined,
				Response: undefined as ts.InterfaceDeclaration | undefined,
				NextFunction: undefined as ts.InterfaceDeclaration | undefined,
			},
		}

		// program.getRootFileNames().forEach((f) => console.log(f, program.getSourceFile(f)!.text))
		// console.log(program.getSemanticDiagnostics().map((d) => d.messageText))

		return {
			// 'ClassProperty[decorators]'(node: TSESTree.ClassProperty & { decorators: TSESTree.Decorator[] }) {
			ClassDeclaration(node) {
				const tsNode = esTreeNodeToTSNodeMap.get(node) as ts.ClassDeclaration
				const { router, mergeParamsShouldBeTrue } = getRefletRouter(checker, tsNode)

				if (router && mergeParamsShouldBeTrue) {
					ctx.report({ messageId: 'mergeParams', node: tsNodeToESTreeNodeMap.get(router.decorator) })
				}
			},

			Decorator(node) {
				// console.log('parent', node.parent)
				// const prop = esTreeNodeToTSNodeMap.get(node.parent!)

				const tsDecorator = esTreeNodeToTSNodeMap.get(node)

				if (ts.isCallExpression(tsDecorator.expression)) {
					// const type = checker.getTypeAtLocation(tsDecorator.expression.expression)
					// console.log('tags', type.symbol.getJsDocTags())

					const sig = checker.getResolvedSignature(tsDecorator.expression)!
					const tags = sig.getJsDocTags()
					const decoratorTag = tags.find((tag) => tag.name === 'decorator')

					if (decoratorTag && decoratorTag.text) {
						const [{ text }] = decoratorTag.text
						const keyword = matchTypeKeyword(text)
						// console.log('keyword', keyword)

						if (hasTypeAnnotation(node.parent)) {
							const typeNode = node.parent.typeAnnotation.typeAnnotation
							// console.log('typeNode', typeNode)
						} else {
						}
					}
				}
			},
			ImportDeclaration(node) {
				// const tsNode = esTreeNodeToTSNodeMap.get(node)
				// const symbol = checker.getSymbolAtLocation(tsNode)
				// console.log('symbol', symbol)
			},
		}
	},
})

function compareTypes<C extends TSESLint.RuleContext<string, []>>(
	valueNode: TSESTree.Expression,
	typeNode: TSESTree.TypeNode,
	context: C,
	canFix?: boolean
): void {
	if (
		valueNode.type === AST_NODE_TYPES.Literal &&
		typeNode.type === AST_NODE_TYPES.TSLiteralType &&
		'raw' in typeNode.literal &&
		valueNode.raw === typeNode.literal.raw
	) {
		if (canFix) {
			context.report({
				node: typeNode,
				messageId: 'preferConstAssertion',
				fix: (fixer) => fixer.replaceText(typeNode, 'const'),
			})
		} else {
			context.report({
				node: typeNode,
				messageId: 'variableConstAssertion',
				suggest: [
					{
						messageId: 'variableSuggest',
						fix: (fixer): TSESLint.RuleFix[] => [
							fixer.remove(typeNode.parent!),
							fixer.insertTextAfter(valueNode, ' as const'),
						],
					},
				],
			})
		}
	}
}
