import { Get, Controller } from 'routing-controllers'

@Controller()
export class AppController {
	@Get('/')
	get() {
		return 'Hello world'
	}
}
