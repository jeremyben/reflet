import * as ts from 'typescript'
import { Replacement } from 'tslint'
import { relative } from 'path'

/**
 * Creates type replacements.
 *
 * @param node - node to which the fix will be applied.
 * @param type - new type to add or replace.
 * @param from - if the type is from an external module.
 * @param sourceFile - sourceFile node of the declaration.
 *
 * We check existing imports but don't mess with them.
 * If we chose to fix import declarations, simultaneous fixes would conflict with each other.
 * As a viable alternative, we simply use the dynamic 'import()' type.
 */
export function makeTypeFix(
	node: ts.ParameterDeclaration | ts.PropertyDeclaration | ts.PropertySignature,
	type: string,
	from: string | null = null,
	sourceFile: ts.SourceFile = node.getSourceFile()
): Replacement {
	// Define prefix/namespace if necessary like so: `value: namespace.type`
	const namespace = () => {
		if (!from) return ''

		const importDeclaration = getImportDeclaration(from, sourceFile)

		// Not imported => add dynamic `import()` type
		if (!importDeclaration) return `import("${from}").`

		const { importClause } = importDeclaration

		// Default import: 'X from'
		if (importClause.name) {
			return importClause.name.text + '.'
		}

		// Binding imports
		if (importClause.namedBindings) {
			// Namespace import: '* as X from'
			if (ts.isNamespaceImport(importClause.namedBindings)) {
				return importClause.namedBindings.name.text + '.'
			}

			// Property import: '{ X } from'
			else if (ts.isNamedImports(importClause.namedBindings)) {
				const hasType = importClause.namedBindings.elements.some(({ name }) => name.text === type)

				if (!hasType) return `import("${from}").`
			}
		}

		// Type is alreary directly imported as a property '{ X } from'
		return ''
	}

	// Replace wrong type
	if (node.type) {
		return Replacement.replaceNode(node.type, `${namespace()}${type}`)
	}

	// Add missing optional type
	if (node.questionToken) {
		return Replacement.appendText(node.questionToken.end, `: ${namespace()}${type}`)
	}

	// Add missing type
	return Replacement.appendText(node.name.end, `: ${namespace()}${type}`)
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
 * Retrieves source file of module.
 */
export function getInstalledModuleSourceFile(
	moduleName: string,
	sourceFile: ts.SourceFile,
	program: ts.Program
): ts.SourceFile | undefined {
	if (typeof ts.getResolvedModule !== 'function') {
		throw Error('typescript internal "getResolvedModule" has not been found')
	}

	const resolvedModule = ts.getResolvedModule(sourceFile, moduleName)
	if (!resolvedModule) return undefined

	const resolvedSourceFile = program.getSourceFile(resolvedModule.resolvedFileName)

	// Should not happen.
	if (!resolvedSourceFile) throw Error(`Cannot find ${resolvedModule.resolvedFileName}`)

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
 * Gets last position of import declarations.
 */
export function getEndOfImportDeclarations(sourceFile: ts.SourceFile): number {
	let end = 0

	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) end = statement.end
	}

	return end
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

/**
 * Checks if `type` is or extends `baseType`.
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
 * Gets actual properties of a litteral object. Returns an empty array if not a litteral object.
 */
export function getObjectProperties(type: ts.Type): ts.Symbol[] {
	if (!(type.flags & ts.TypeFlags.Object)) return []
	return type.getProperties()
}

/**
 * Checks if a file is is within the specified directory.
 */
export function fileIsWithin(filePath: string, dirPath: string) {
	const rel = relative(dirPath, filePath)
	return !rel.startsWith('../') && rel !== '..'
}
