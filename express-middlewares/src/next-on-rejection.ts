import * as express from 'express'

/**
 * Passes the rejection reason to `next`, and makes sure a falsy reason (e.g. `Promise.reject()`)
 * is still treated as an error instead of moving on to the next handler, like express 5 does.
 * @internal
 */
export function nextOnRejection(next: express.NextFunction) {
	return (reason: unknown) => next(reason || new Error('Rejected promise'))
}
