type Response = import('supertest').Response

export function log(res: Response): void
export function log(name: string, res: Response): void
export function log(arg1: Response | string, arg2?: Response) {
	const res = typeof arg1 === 'string' ? arg2! : arg1
	const name = typeof arg1 === 'string' ? arg1.toUpperCase() : '\b'

	console.log(
		name,
		'[status]',
		res.status,
		'\n[body]',
		res.body,
		'\n[text]',
		res.text,
		'\n[res-type]',
		res.header['content-type'],
		'\n[req-type]',
		(res as any).req.getHeader('content-type')
	)
}
