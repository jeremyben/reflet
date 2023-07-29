module.exports = {
	mongodbMemoryServerOptions: {
		instance: {
			dbName: 'jest',
		},
		binary: {
			version: '5.0.18',
			skipMD5: true,
		},
		autoStart: false,
	},
}
