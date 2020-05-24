import { ESLintUtils, TSESTree, AST_NODE_TYPES, TSESLint, ASTUtils } from '@typescript-eslint/experimental-utils'
import { isIdentifier } from '@typescript-eslint/experimental-utils/dist/ast-utils'
import * as ts from 'typescript'
import {
	hasTypeAnnotation,
	isCallExpression,
	isClassProperty,
	isStringLiteralType,
	isStringType,
	isUnionType,
	matchTypeKeyword,
} from './utils'

export default ESLintUtils.RuleCreator((ruleName) => ruleName)({
	name: 'decorator-checker',
	meta: {
		type: 'problem',
		docs: {
			category: 'Possible Errors',
			description: '',
			recommended: false,
			requiresTypeChecking: true,
		},
		messages: {
			h: '',
		},
		schema: [
			{
				type: 'object',
				properties: { file: { type: 'string' } },
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [{ file: '' }],
	create(context) {
		const { program, esTreeNodeToTSNodeMap } = ESLintUtils.getParserServices(context)

		// console.log('context.options', context.options)
		const checker = program.getTypeChecker()

		// program.getRootFileNames().forEach((f) => console.log(f, program.getSourceFile(f)!.text))
		// console.log(program.getSemanticDiagnostics().map((d) => d.messageText))

		return {
			'ClassProperty[decorators]'(node: TSESTree.ClassProperty & { decorators: TSESTree.Decorator[] }) {
				const typeNode = node.typeAnnotation?.typeAnnotation
				if (!typeNode) return

				if (isUnionType(typeNode)) {
					for (const subType of typeNode.types) {
						if (isStringLiteralType(subType)) {
							// console.log(subType.literal)
						}
					}
				}

				// const isString = propType === AST_NODE_TYPES.TSStringKeyword

				for (const decorator of node.decorators) {
					// console.log('decorator', decorator)
					const tsDecorator = esTreeNodeToTSNodeMap.get(decorator)

					if (ts.isCallExpression(tsDecorator.expression)) {
						const { expression } = tsDecorator.expression
						// console.log('expression', expression)

						const sig: any = checker.getResolvedSignature(tsDecorator.expression)

						// console.log(sig.mapper)

						// mapper.target
						// mapper.targets

						// ;(sig as any)?.mapper

						// const symbol = checker.getSymbolAtLocation(expression)
						// const type = checker.getTypeAtLocation(expression)
						// const [callSignature] = type.getCallSignatures()
					}
				}
			},
			Decorator(node) {
				console.log('parent', node.parent)
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
						console.log('keyword', keyword)

						if (hasTypeAnnotation(node.parent)) {
							const typeNode = node.parent.typeAnnotation.typeAnnotation
							console.log('typeNode', typeNode)
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
