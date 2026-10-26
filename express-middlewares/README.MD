# `@reflet/express-middlewares` 🧩

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express-middlewares/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express-middlewares/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express-middlewares/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express-middlewares/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

> [!IMPORTANT]  
> Upgrade from **v2** to **v3** : [Migration guide](https://github.com/jeremyben/reflet/blob/master/express-middlewares/MIGRATION.md)

Convenient middleware decorators to use with [Reflet/express](../express).

* [Getting started](#getting-started)
* [Request authorizations](#request-authorizations)
* [Response interception](#response-interception)
* [Response side-effect](#response-side-effect)
* [Response status](#response-status)
* [Response headers](#response-headers)
* [Response type](#response-type)
* [Conditional middleware](#conditional-middleware)

## Getting started

1. [Get started with Reflet/express](../express/README.MD#Getting-started).

2. Install the package.

    ```sh
    npm i @reflet/express-middlewares
    ```

3. Apply middleware decorators on routers or specific routes.

## Request authorizations

> 🔦 `@UseGuards(...guards)`

A guard is a filter function that takes the Request object as parameter and should return a boolean (asynchronously or not) to authorize the request or not.

```ts
@Router('/things')
class ThingRouter {
  @UseGuards(
    (req) => req.user != null,
    (req) => req.user.admin === true,
  )
  @Get('/secret')
  get() {}
}
```

If the guard returns...

* `true`: The request will be processed.
* `false`: The request will be denied with a **`403`** HTTP status and a **`"Access Denied"`** message.

#### Custom error message

If you want to override the default `"Access denied"` message,
you can **return** (not throw) an `Error` instance instead of just `false`.

```ts
@UseGuards((req) => Boolean(req.user.admin) || Error('You must be admin'))
```

🗣️ Again, be sure to return the `Error` and not throw it, unless you want it to be handled elsewhere.

## Response interception

> 🔦 `@UseInterceptor(mapper)`

Intercept and manipulate the response body before it is sent, with a mapping function (asynchronous or not).

```ts
@Router('/things')
class ThingRouter {
  @UseInterceptor<{ foo: number }>((data) => ({ foo: data.foo * 5 }))
  @Get('/things')
  list(@Res res: Response) {
    res.send({ foo: 1 }) // expect { foo: 5 }
  }

  // Gives also access to Request and Response objects:
  @UseInterceptor<{ foo: number }>((data, context) => ({ foo: context.res.statusCode }))
  @Get('/things/:id')
  get(@Res res: Response) {
    res.send({ foo: 1 }) // expect { foo: 200 }
  }

  // You can add a different constraint on the return shape:
  @UseInterceptor<{ foo: number }, { foo: string }>((data) => ({ foo: data.foo.toString() }))
  @Get('/things/:id')
  get(@Res res: Response) {
    res.send({ foo: 1 }) // expect { foo: "1" }
  }
}
```

#### With `@Send`

If your route returns its response value with `@Send` (from `@reflet/express`), prefer transforming it with a custom send handler: it receives the value returned by the method (typed and awaited), and doesn't patch any response method.

```ts
@Send<Thing>((thing, { res }) => {
  res.json({ data: thing })
})
@Get('/things/:id')
get(@Params('id') id: string) {
  return db.collection('things').findOne({ id })
}
```

`UseInterceptor` remains useful for handlers sending the response themselves with `res.send` or `res.json`.

#### About order

Successive interceptors wrap each other, so they transform the body in the reverse order they are written: the closest to the method transforms it first.

```ts
@UseInterceptor<string>((data) => `${data}, then first`)
@UseInterceptor<string>((data) => `${data}, then second`)
@Get('/things')
list(@Res res: Response) {
  res.send('body') // expect "body, then second, then first"
}
```

#### About errors

`UseInterceptor` won't intercept errors, whether:

* the response body is an `Error` instance,
* the response has an error status (>=400).

If you need to intercept errors as well, you should simply add a `@Catch` decorator:

```ts
@Catch((err, req, res, next) => { /* intercept errors */ })
@UseInterceptor((data, context) => { /* intercept success */ })
```

🗣️ Don't forget to set a proper error status in your error handler, or else the error body will actually be intercepted.

If the mapping function throws or rejects, the error is passed to the error handlers.

#### About redirections

`UseInterceptor` won't intercept redirections either (status 3xx, e.g. `res.redirect`), whose body is generated by Express.

#### About streams

`UseInterceptor` won't intercept streaming responses either (_e.g. files sent with `res.sendFile` or `res.download`_).<br>Instead you should just use a [transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform):

```ts
createReadStream('path/to/file').pipe(transform).pipe(res)
```

In fact, it won't intercept any response sent by chunks with the `res.write` native method.

## Response side-effect

> 🔦 `@UseOnFinish(sideEffect, exposeResponseBody?)`<br>
> 💫 Related Node.js event: [`finish`](https://nodejs.org/api/http.html#http_event_finish)

You need to trigger side-effects ? Log details, send an email, etc.<br>`UseOnFinish` helps you define a callback on each response, on the [`finish` event](https://nodejs.org/api/http.html#http_event_finish) to be exact.

```ts
@Router('/things')
class ThingRouter {
  @UseOnFinish((req, res) => {
    console.log('Request:', req.method, req.originalUrl, req.body)
    console.log('Response:', res.statusCode)
  })
  @Post('/things')
  create() {}
}
```

As a safety net, any exception happening in your callback will be caught and logged to `stderr` instead of crashing the server. You don't want the latter for a side-effect. _This does not exempt you to properly handle your errors, though._

🗣️ The callback is not called if the client closes the connection before the response is complete, as Node.js doesn't emit the `finish` event in that case.

#### Retrieve the response body

You can expose the response body on the Response object by switching the last parameter on. Streaming responses will have their body truncated to the first 64kb, to avoid eating up memory.

```ts
@Router('/things')
class ThingRouter {
  @UseOnFinish((req, res) => {
    console.log('Request:', req.method, req.originalUrl)
    console.log('Response:', res.statusCode, res.body)
  }, true)
  @Get('/things')
  list() {}
}
```

## Response status

> 🔦 `@UseStatus(code)`<br>
> 💫 Related Express method: [`res.status`](https://expressjs.com/en/4x/api.html#res.status)

Set the response status code with a dedicated decorator.

```ts
@Router('/things')
class ThingRouter {
  @UseStatus(201)
  @Post('/things')
  create() {}
}
```

`UseStatus` input type is narrowed to a union of known **`1XX`, `2XX` and `3XX` status codes** (instead of just `number`).

Use **[`Status` enum](../http/README.md#status-)** from `@reflet/http` for better discoverability and documentation.

## Response headers

### Set headers

> 🔦 `@UseResponseHeader(header, value)|(headers)`<br>
> 💫 Related Express method: [`res.set`](https://expressjs.com/en/4x/api.html#res.set)

Set any response header with a dedicated decorator.

```ts
@UseResponseHeader({ 'x-powered-by': 'brainfuck' })
@Router('/things')
class ThingRouter {
  @UseResponseHeader('allow', 'GET')
  @Post('/things')
  create(@Res res: Response) {
    res.sendStatus(405)
  }
}
```

`UseResponseHeader` input type is narrowed to a union of known **response headers** (instead of just `string`).

Augment the union with the help of the global namespace `RefletHttp`:

```ts
declare global {
  namespace RefletHttp {
    interface ResponseHeader {
      XCustom: 'x-custom'
    }
  }
}

@Router('/things')
class ThingRouter {
  @Get()
  list() {}
}
```

Use **[`ResponseHeader` enum](../http/README.md#header-)** from `@reflet/http` for better discoverability and documentation.

### Append header value

> 🔦 `@UseResponseHeader.Append(header, value)`<br>
> 💫 Related Express method: [`res.append`](https://expressjs.com/en/4x/api.html#res.append)

Appends the specified `value` to the HTTP response header `field`. If the header is not already set, it creates the header with the specified `value`.

```ts
@UseResponseHeader.Append('link', ['<http://localhost/>', '<http://localhost:3000/>'])
```

## Response type

> 🔦 `@UseType(contentType)`<br>
> 💫 Related Express method: [`res.type`](https://expressjs.com/en/4x/api.html#res.type)

Set the response `Content-Type` with a dedicated decorator.

```ts
@Send()
@Router('/things')
class ThingRouter {
  @UseType('docx')
  @Get('/document')
  download() {
    return createReadStream('path/to/doc')
  }
}
```

`UseType` input type is narrowed to a union of common MIME types and extensions (instead of just `string`). You can still opt-out by expanding the input type to `string` or `any`:

```ts
@UseType<string>('application/x-my-type')
```

## Conditional middleware

> 🔦 `@UseIf(filter, [middlewares])`

In some case, you might want to separate a middleware logic from its applying conditions. `UseIf` is made for such case.

```ts
UseIf((req) => req.method === 'POST', [express.json()])
@Router('/things')
class ThingRouter {}
```
