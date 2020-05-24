import { TSESTree, AST_NODE_TYPES } from '@typescript-eslint/experimental-utils'

export function isCallExpression(node: TSESTree.Node | undefined): node is TSESTree.CallExpression {
	if (!node) return false

	return node.type === AST_NODE_TYPES.CallExpression
}

export function hasTypeAnnotation(
	node: TSESTree.Node | undefined
): node is TSESTree.Node & { typeAnnotation: TSESTree.TSTypeAnnotation } {
	if (!node) return false

	return (
		node.hasOwnProperty('typeAnnotation') && (node as any).typeAnnotation.type === AST_NODE_TYPES.TSTypeAnnotation
	)
}

export function isClassProperty(node: TSESTree.Node | undefined): node is TSESTree.ClassProperty {
	if (!node) return false

	return node.type === AST_NODE_TYPES.ClassProperty
}

export function isUnionType(typeNode: TSESTree.TypeNode): typeNode is TSESTree.TSUnionType {
	return typeNode.type === AST_NODE_TYPES.TSUnionType
}

export function isStringType(typeNode: TSESTree.TypeNode): typeNode is TSESTree.TSStringKeyword {
	return typeNode.type === AST_NODE_TYPES.TSStringKeyword
}

export function isNullType(typeNode: TSESTree.TypeNode): typeNode is TSESTree.TSNullKeyword {
	return typeNode.type === AST_NODE_TYPES.TSNullKeyword
}

export function isStringLiteralType(typeNode: TSESTree.TypeNode): typeNode is TSStringLiteralType {
	if (!isLiteralType(typeNode)) return false

	return typeNode.literal.type === AST_NODE_TYPES.Literal && typeof typeNode.literal.value === 'string'
}

function isLiteralType(typeNode: TSESTree.TypeNode): typeNode is TSESTree.TSLiteralType {
	return typeNode.type === AST_NODE_TYPES.TSLiteralType
}

interface TSStringLiteralType extends TSESTree.TSLiteralType {
	literal: TSESTree.StringLiteral
}

export const TYPE_KEYWORDS = {
	any: AST_NODE_TYPES.TSAnyKeyword,
	bigint: AST_NODE_TYPES.TSBigIntKeyword,
	boolean: AST_NODE_TYPES.TSBooleanKeyword,
	never: AST_NODE_TYPES.TSNeverKeyword,
	null: AST_NODE_TYPES.TSNullKeyword,
	number: AST_NODE_TYPES.TSNumberKeyword,
	object: AST_NODE_TYPES.TSObjectKeyword,
	string: AST_NODE_TYPES.TSStringKeyword,
	symbol: AST_NODE_TYPES.TSSymbolKeyword,
	undefined: AST_NODE_TYPES.TSUndefinedKeyword,
	unknown: AST_NODE_TYPES.TSUnknownKeyword,
	void: AST_NODE_TYPES.TSVoidKeyword,
}

export function matchTypeKeyword(text: string): AST_NODE_TYPES | undefined {
	return TYPE_KEYWORDS[text as keyof typeof TYPE_KEYWORDS]
}
