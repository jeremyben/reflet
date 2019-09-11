type Response = import('supertest').Response & { req?: import('http').ClientRequest; headers?: any }

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
		'\n[res-headers]',
		JSON.stringify(res.headers, null, '\t'),
		'\n[req-headers]',
		JSON.stringify(res.req!.getHeaders(), null, '\t')
	)
}
