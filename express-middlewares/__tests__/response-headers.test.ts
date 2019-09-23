import supertest from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import { register, Get, Put } from '@reflet/express'
import { UseSet, UseType } from '../src'
import { log } from '../../testing/tools'

@UseSet({ 'x-powered-by': 'brainfuck', via: 'jest' })
class Controller {
	@UseSet('allow', 'GET')
	@Get()
	get(req: Request, res: Response, next: NextFunction) {
		res.sendStatus(406)
	}

	@UseType('application/vnd.api+json')
	@Put()
	put(req: Request, res: Response, next: NextFunction) {
		res.json('done')
	}
}

const rq = supertest(register(express(), [Controller]))

test('set response header', async () => {
	const res = await rq.get('')
	expect(res.header.allow).toBe('GET')
	expect(res.header['x-powered-by']).toBe('brainfuck')
	expect(res.header.via).toBe('jest')
})

test('set response content-type', async () => {
	const res = await rq.put('')
	expect(res.type).toBe('application/vnd.api+json')
	expect(res.header.via).toBe('jest')
})
