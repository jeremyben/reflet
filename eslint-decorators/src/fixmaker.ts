import * as ts from 'typescript'
import { getImportDeclaration } from './ts-utils'

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
): any {
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
		// return Replacement.replaceNode(node.type, `${namespace()}${type}`)
	}

	// Add missing optional type
	if (node.questionToken) {
		// return Replacement.appendText(node.questionToken.end, `: ${namespace()}${type}`)
	}

	// Add missing type
	// return Replacement.appendText(node.name.end, `: ${namespace()}${type}`)
}
