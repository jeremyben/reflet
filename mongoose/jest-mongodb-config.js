module.exports = {
	mongodbMemoryServerOptions: {
		instance: {
			dbName: 'jest',
		},
		binary: {
			version: '7.0.14',
			skipMD5: true,
		},
		autoStart: false,
	},
}
