import * as ts from 'typescript'

declare module 'typescript' {
	/**
	 * Retrieves the (cached) module resolution information for a module name that was exported from a SourceFile.
	 * The compiler populates this cache as part of analyzing the source file.
	 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L223-L225
	 */
	function getResolvedModule(sourceFile: SourceFile, moduleNameText: string): ResolvedModuleFull | undefined

	interface Program {
		sourceFileToPackageName: ts.Map<string>
	}
}
