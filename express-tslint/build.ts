import { build } from 'tsc-prog'

build({
	basePath: __dirname,
	configFilePath: 'tsconfig.json',
	compilerOptions: {
		rootDir: 'src',
		outDir: 'dist',
		declaration: true,
		skipLibCheck: true,
	},
	include: ['src/**/*'],
	exclude: ['**/__tests__', '**/test.ts', '**/*.test.ts', '**/*.spec.ts', 'node_modules'],
	clean: { outDir: true },
})
