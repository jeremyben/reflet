import { FakerStatic } from './interfaces'

export const lazy = {
	fake(str: string) {
		return { methodPath: ['fake'], args: [str], returns: String }
	},
}
