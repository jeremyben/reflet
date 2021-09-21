import * as ts from 'typescript/lib/tsserverlibrary'
import { createLanguageServiceProxy } from './language-service-proxy'

function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
	const logInfo = info.project.projectService.logger.info

	logInfo('@reflet/decorator-plugin loaded')

	const proxy = createLanguageServiceProxy(info)

	return proxy
}

const init: ts.server.PluginModuleFactory = (modules) => {
	return { create }
}

export = init
