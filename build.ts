import { join } from 'path'
import { build } from 'tsc-prog'
import * as ts from 'typescript'
import * as tsdoc from '@microsoft/tsdoc'
import { writeFileSync } from 'fs'

const basePath = process.cwd()
const dtsEntryPoint = 'index.d.ts'

build({
	basePath,
	configFilePath: 'tsconfig.json',
	compilerOptions: {
		rootDir: 'src',
		outDir: 'dist',
		declaration: true,
		skipLibCheck: true,
		stripInternal: true,
	},
	include: [`src/**/*`],
	exclude: ['**/__tests__', '**/test.ts', '**/*.test.ts', '**/*.spec.ts', 'node_modules'],
	clean: { outDir: true },
	bundleDeclaration: { entryPoint: dtsEntryPoint, augmentations: false },
})

syncOverloadsDoc()

function syncOverloadsDoc() {
	console.log('Syncing inherited docs for overloaded functions')

	const tsdocConfig = new tsdoc.TSDocConfiguration()
	tsdocConfig.setSupportForTags(tsdoc.StandardTags.allDefinitions, true)

	tsdocConfig.addTagDefinitions(
		[
			new tsdoc.TSDocTagDefinition({
				tagName: '@decorator',
				syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag,
			}),
		],
		true
	)

	const docParser = new tsdoc.TSDocParser(tsdocConfig)

	const dtsPath = join(basePath, 'dist', dtsEntryPoint)
	const dtsFile = ts.createProgram({ options: {}, rootNames: [dtsPath] }).getSourceFile(dtsPath)!
	const dtsText = dtsFile.getFullText()
	const docMap = new Map<string, string>()

	ts.visitNode(dtsFile, visitInheritedDoc)

	console.log('Rewriting typings file')
	// todo: use emitter with transformer instead of naive replace
	// https://stackoverflow.com/questions/43829884
	let dtsTextFinal = dtsText
	docMap.forEach((refDoc, inheritDoc) => {
		const inheritDocRe = new RegExp(escapeRegExp(inheritDoc), 'g')
		dtsTextFinal = dtsTextFinal.replace(inheritDocRe, refDoc)
	})

	// Rewrite ts-ignore jsdoc comment into basic comment.
	const tsIgnoreRe = /\/\*\* ?@ts-ignore(.*) ?\*\//g
	dtsTextFinal = dtsTextFinal.replace(tsIgnoreRe, '// @ts-ignore$1')

	writeFileSync(dtsPath, dtsTextFinal, 'utf8')

	function visitInheritedDoc(node: ts.Node): ts.VisitResult<ts.Node> {
		if (ts.isFunctionDeclaration(node)) {
			const [commentRange] = ts.getJSDocCommentRanges(node, dtsText) || []
			if (!commentRange) return
			const textRange = tsdoc.TextRange.fromStringRange(dtsText, commentRange.pos, commentRange.end)

			const docCommentText = textRange.toString()
			const { docComment, log } = docParser.parseRange(textRange)
			log.messages.forEach((m) => console.error(m.unformattedText))

			if (docComment.inheritDocTag && docComment.inheritDocTag.declarationReference) {
				const { memberReferences } = docComment.inheritDocTag.declarationReference
				const { memberIdentifier, selector: selectorWrapper } = memberReferences[0]

				if (!memberIdentifier || !selectorWrapper) {
					console.error('Missing reference or selector:', docCommentText)
					return
				}

				const { identifier } = memberIdentifier
				const { selector, selectorKind } = selectorWrapper

				if (selectorKind !== 'index') {
					console.error('Only index selector is supported:', docCommentText)
					return
				}

				docMap.set(docCommentText, getRefDocComment(identifier, selector))
			}
		}

		return node.forEachChild(visitInheritedDoc)
	}

	function getRefDocComment(identifier: string, selector: string): string {
		const declarations: ts.FunctionDeclaration[] = []
		ts.visitNode(dtsFile, getDeclarations)
		if (!declarations.length || declarations.length === 1) throw Error(`${identifier} not overloaded`)

		const ref = declarations[Number(selector) - 1]
		if (!ref) throw Error(`Cannot find ${identifier}: wrong selector (${selector})`)

		const [commentRange] = ts.getJSDocCommentRanges(ref, dtsText) || []
		if (!commentRange) return ''

		const textRange = tsdoc.TextRange.fromStringRange(dtsText, commentRange.pos, commentRange.end)
		return textRange.toString()

		function getDeclarations(node: ts.Node): ts.VisitResult<ts.Node> {
			if (ts.isFunctionDeclaration(node) && node.name && node.name.text === identifier) {
				declarations.push(node)
			}
			return node.forEachChild(getDeclarations)
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
	function escapeRegExp(value: string) {
		return value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
	}
}

declare module 'typescript' {
	/**
	 * Retrieves the JSDoc-style comments associated with a specific AST node.
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L997-L1010
	 */
	function getJSDocCommentRanges(node: Node, text: string): CommentRange[] | undefined
}
