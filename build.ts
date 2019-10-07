import { join } from 'path'
import { build } from 'tsc-prog'
import ts from 'typescript'
import * as ae from '@microsoft/api-extractor'
import * as tsdoc from '@microsoft/tsdoc'
import { writeFileSync } from 'fs'

const basePath = process.cwd()
const rootDir = 'src'
const outDir = 'dist'
const tmpDir = 'temp'

build({
	basePath,
	configFilePath: 'tsconfig.json',
	compilerOptions: {
		rootDir,
		outDir,
		// Emit declaration files in a temp folder so api-extractor can bundle them in the next step
		declaration: true,
		declarationDir: tmpDir,
		declarationMap: true,
		skipLibCheck: true,
	},
	include: [`${rootDir}/**/*`],
	exclude: ['**/__tests__', '**/test.ts', '**/*.test.ts', '**/*.spec.ts', 'node_modules'],
	clean: { outDir: true, declarationDir: true },
})

const dtsPath = join(basePath, 'dist', 'index.d.ts')
const state = bundleDefinitions('public')
syncOverloadsDoc(state.program.getCompilerOptions() as ts.CompilerOptions)

/**
 * @see https://api-extractor.com/pages/overview/demo_rollup/
 */
function bundleDefinitions(release: '' | 'beta' | 'public' = '') {
	const logLevel = {
		none: { logLevel: 'none' as ae.ExtractorLogLevel },
		warning: { logLevel: 'warning' as ae.ExtractorLogLevel },
		error: { logLevel: 'error' as ae.ExtractorLogLevel },
	}

	// https://api-extractor.com/pages/commands/config_file/
	const configObject: ae.IConfigFile = {
		projectFolder: basePath,
		mainEntryPointFilePath: '<projectFolder>/temp/index.d.ts',
		compiler: { tsconfigFilePath: '<projectFolder>/tsconfig.json' },
		dtsRollup: {
			enabled: true,
			untrimmedFilePath: release === '' ? dtsPath : '',
			betaTrimmedFilePath: release === 'beta' ? dtsPath : '',
			publicTrimmedFilePath: release === 'public' ? dtsPath : '',
			omitTrimmingComments: false,
		},
		messages: {
			compilerMessageReporting: {
				default: logLevel.error,
			},
			extractorMessageReporting: {
				default: logLevel.error,
				'ae-forgotten-export': logLevel.warning,
				'ae-unresolved-inheritdoc-reference': logLevel.none,
				'ae-internal-missing-underscore': logLevel.none,
			},
			tsdocMessageReporting: {
				default: logLevel.warning,
				'tsdoc-undefined-tag': logLevel.none,
				'tsdoc-unsupported-tag': logLevel.none,
			},
		},
	}

	const config = ae.ExtractorConfig.prepare({
		configObject,
		configObjectFullPath: undefined,
		packageJsonFullPath: join(basePath, 'package.json'),
	})

	const res = ae.Extractor.invoke(config, { localBuild: true, showVerboseMessages: true })

	if (res.succeeded) {
		console.log(`API Extractor succeeded with ${res.warningCount} warnings`)
	} else {
		console.error(`API Extractor failed with ${res.errorCount} errors and ${res.warningCount} warnings`)
		process.exit(1)
	}

	return res.compilerState
}

function syncOverloadsDoc(options: ts.CompilerOptions) {
	console.log('Syncing inherited docs for overloaded functions')

	const docConfig = new tsdoc.TSDocConfiguration()
	docConfig.setSupportForTags(tsdoc.StandardTags.allDefinitions, true)

	const customTagDefinitions = [
		new tsdoc.TSDocTagDefinition({
			tagName: '@decorator',
			syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag,
		}),
		new tsdoc.TSDocTagDefinition({
			tagName: '@see',
			syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
			allowMultiple: true,
		}),
	]
	docConfig.addTagDefinitions(customTagDefinitions, true)

	const docParser = new tsdoc.TSDocParser(docConfig)

	const program = ts.createProgram({ options, rootNames: [dtsPath] })
	const dtsFile = program.getSourceFile(dtsPath)!
	const dtsText = dtsFile.getFullText()
	const docMap = new Map<string, string>()

	ts.visitNode(dtsFile, visitInheritedDoc)

	console.log('Rewriting typings file')
	// todo: use emitter with transformer instead of naive replace
	// https://stackoverflow.com/questions/43829884
	let dtsTextFinal = dtsText
	docMap.forEach((refDoc, inheritDoc) => (dtsTextFinal = dtsTextFinal.replace(inheritDoc, refDoc)))
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
}

declare module 'typescript' {
	/**
	 * Retrieves the JSDoc-style comments associated with a specific AST node.
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L997-L1010
	 */
	function getJSDocCommentRanges(node: Node, text: string): CommentRange[] | undefined
}
