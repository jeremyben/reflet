import * as ts from 'typescript/lib/tsserverlibrary'

export function createLanguageServiceProxy(info: ts.server.PluginCreateInfo): ts.LanguageService {
	const proxy: ts.LanguageService = Object.create(null)

	for (const k of Object.keys(info.languageService) as (keyof ts.LanguageService)[]) {
		const x = info.languageService[k] as Function
		proxy[k] = (...args: any[]) => x.apply(info.languageService, args)
	}

	return proxy
}
