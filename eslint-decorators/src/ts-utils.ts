import * as ts from 'typescript'

/**
 * Gets the text of an expression. Useful for decorators.
 */
export function getExpressionName(expression: ts.LeftHandSideExpression): string {
	const realExpression = ts.isCallExpression(expression) ? expression.expression : expression

	return ts.isIdentifier(realExpression)
		? realExpression.text
		: ts.isPropertyAccessExpression(realExpression)
		? realExpression.name.text // namespaced
		: ''
}

export function getInstalledModuleSourceFile(
	moduleName: string,
	sourceFile: ts.SourceFile,
	program: ts.Program
): ts.SourceFile | undefined {
	if (typeof ts.getResolvedModule !== 'function') {
		throw Error('typescript internal "getResolvedModule" has not been found')
	}

	const resolvedModule = ts.getResolvedModule(sourceFile, moduleName)
	if (!resolvedModule) {
		return undefined
	}

	const resolvedSourceFile = program.getSourceFile(resolvedModule.resolvedFileName)

	if (!resolvedSourceFile) {
		throw Error(`Should not happen: Cannot find "${resolvedModule.resolvedFileName}"`)
	}

	return resolvedSourceFile
}

/**
 * Checks if module is installed.
 */
export function hasInstalledModule(moduleName: string, sourceFile: ts.SourceFile): boolean {
	if (typeof ts.getResolvedModule !== 'function') {
		throw Error('typescript internal "getResolvedModule" has not been found')
	}

	return !!ts.getResolvedModule(sourceFile, moduleName)
}

/**
 * Retrieves import declaration from specified module.
 */
export function getImportDeclaration(moduleName: string, sourceFile: ts.SourceFile) {
	if (!moduleName) return undefined

	for (const statement of sourceFile.statements) {
		if (
			ts.isImportDeclaration(statement) &&
			ts.isStringLiteral(statement.moduleSpecifier) &&
			statement.moduleSpecifier.text === moduleName &&
			statement.importClause !== undefined
		) {
			return statement as ts.ImportDeclaration & {
				moduleSpecifier: ts.Expression & ts.StringLiteral
				importClause: ts.ImportClause
			}
		}
	}

	return undefined
}

/**
 * Retrieves exported interface by name.
 */
export function getTopLevelInterface(interfaceName: string, { statements }: ts.SourceFile) {
	for (const statement of statements) {
		if (ts.isInterfaceDeclaration(statement) && statement.name.text === interfaceName) {
			return statement
		}

		// Retrieves also from toplevel namespace (as it is the case for express).
		if (ts.isModuleDeclaration(statement) && statement.body && ts.isModuleBlock(statement.body)) {
			const moduleStatements = statement.body.statements

			for (const moduleStatement of moduleStatements) {
				if (ts.isInterfaceDeclaration(moduleStatement) && moduleStatement.name.text === interfaceName) {
					return moduleStatement
				}
			}
		}
	}

	return undefined
}

/**
 * Checks if `type` is or extends `baseType`, based on symbol (not structural typing).
 */
export function extendsType(type: ts.Type, baseType: ts.Type): boolean {
	if (type.symbol === baseType.symbol) {
		return true
	}

	if (type.isIntersection()) {
		return type.types.some((t) => extendsType(t, baseType))
	}

	if (type.isUnion()) {
		return type.types.every((t) => extendsType(t, baseType))
	}

	const baseTypes = type.getBaseTypes()
	if (baseTypes) {
		return baseTypes.some((t) => extendsType(t, baseType))
	}

	return false
}

/**
 * Checks referenced type.
 * Won't check primitive or native types.
 */
export function isTypeReferenceName(typeNode: ts.TypeNode | undefined, name: string): boolean {
	if (!typeNode) return false

	if (ts.isTypeReferenceNode(typeNode)) {
		if (ts.isIdentifier(typeNode.typeName)) return typeNode.typeName.text === name
		if (ts.isQualifiedName(typeNode.typeName)) return typeNode.typeName.right.text === name
	}

	if (ts.isImportTypeNode(typeNode) && typeNode.qualifier) {
		if (ts.isIdentifier(typeNode.qualifier)) return typeNode.qualifier.text === name
		if (ts.isQualifiedName(typeNode.qualifier)) return typeNode.qualifier.right.text === name
	}

	if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
		return typeNode.types.some((t) => isTypeReferenceName(t, name))
	}

	return false
}

/**
 * Gets actual properties of a litteral object. Returns an empty array if not a litteral object.
 */
export function getObjectProperties(type: ts.Type): ts.Symbol[] {
	if (!(type.flags & ts.TypeFlags.Object)) return []
	return type.getProperties()
}

/**
 * Checks if module is imported.
 */
export function hasImportedModule(
	moduleName: string,
	sourceFile: ts.SourceFile,
	stringMethod: keyof Pick<string, 'includes' | 'startsWith' | 'endsWith'> | '' = ''
): boolean {
	return sourceFile.statements.some(
		(node) =>
			ts.isImportDeclaration(node) &&
			ts.isStringLiteral(node.moduleSpecifier) &&
			(stringMethod
				? node.moduleSpecifier.text[stringMethod](moduleName)
				: node.moduleSpecifier.text === moduleName)
	)
}

/**
 * Gets last position of import declarations.
 */
export function getEndOfImportDeclarations(sourceFile: ts.SourceFile): number {
	let end = 0

	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) end = statement.end
	}

	return end
}
