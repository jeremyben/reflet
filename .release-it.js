const { join } = require('path')
const { name } = require(join(process.cwd(), 'package.json'))

/** @type {import('release-it').Config} */
const config = {
	git: {
		tagName: `${name}@\${version}`,
		commitMessage: `chore(release): ${name}@\${version}`,
		push: false,
	},
	npm: {
		publish: true,
		publishPackageManager: 'pnpm',
		publishArgs: ['--no-git-checks'],
	},
	hooks: {
		'before:bump': 'pnpm test --coverage && ts-node -T ../testing/summary.ts && git add coverage-summary.json',
		'after:bump': 'pnpm run build',
	},
	plugins: {
		'@release-it/conventional-changelog': {
			preset: { name: 'angular' },
			infile: 'CHANGELOG.md',
			header: '# Change Log',
			ignoreRecommendedBump: true,
			gitRawCommitsOpts: { path: '.' },
		},
	},
}

module.exports = config
