import { join } from 'path'
import { build } from 'tsc-prog'
import { Extractor, ExtractorConfig, IConfigFile, ExtractorLogLevel } from '@microsoft/api-extractor'

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

bundleDefinitions('public')

/**
 * @see https://api-extractor.com/pages/overview/demo_rollup/
 */
function bundleDefinitions(release: '' | 'beta' | 'public' = '') {
	const logLevel = {
		none: { logLevel: 'none' as ExtractorLogLevel },
		warning: { logLevel: 'warning' as ExtractorLogLevel },
		error: { logLevel: 'error' as ExtractorLogLevel },
	}

	const dtsDistFilePath = '<projectFolder>/dist/index.d.ts'

	// https://api-extractor.com/pages/commands/config_file/
	const configObject: IConfigFile = {
		projectFolder: basePath,
		mainEntryPointFilePath: '<projectFolder>/temp/index.d.ts',
		compiler: { tsconfigFilePath: '<projectFolder>/tsconfig.json' },
		dtsRollup: {
			enabled: true,
			untrimmedFilePath: release === '' ? dtsDistFilePath : '',
			betaTrimmedFilePath: release === 'beta' ? dtsDistFilePath : '',
			publicTrimmedFilePath: release === 'public' ? dtsDistFilePath : '',
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

	const config = ExtractorConfig.prepare({
		configObject,
		configObjectFullPath: undefined,
		packageJsonFullPath: join(basePath, 'package.json'),
	})

	const { succeeded, errorCount, warningCount } = Extractor.invoke(config, {
		localBuild: true,
		showVerboseMessages: true,
	})

	if (succeeded) {
		console.log(`API Extractor succeeded with ${warningCount} warnings`)
	} else {
		console.error(`API Extractor failed with ${errorCount} errors and ${warningCount} warnings`)
		process.exit(1)
	}
}
