# `@reflet/express` 🌠

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

The **best** decorators for [Express](https://expressjs.com/). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Routing](#routing)
* [Middlewares](#middlewares)
* [Request properties injection](#request-properties-injection)
* [Sending return value](#sending-return-value)
* [Error handling](#error-handling)

## Getting started

1. <details>
    <summary>Make sure you have decorators enabled. (click for details)</summary>
    <p>

    * Enable them in your TypeScript compiler options.

        ```json
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        ```

    * Install `reflect-metadata` shim.

        ```sh
        yarn add reflect-metadata
        ```

    * Import the shim in your program before everything else.

        ```ts
        import 'reflect-metadata'
        ```

    </p>
    </details>

2. Install the package along with peer dependencies.

    ```sh
    yarn add @reflet/express express && yarn add -D @types/express @types/node
    ```

3. Create your decorated routing controllers.

    ```ts
    // thing.controller.ts
    import { Get, Post, Res, Params, Body } from '@reflet/express'

    export class ThingController {
      @Get('/things')
      async list(@Res res: Response) {
        const things = await db.collection('things').find({})
        res.send(things)
      }

      @Get('/things/:id')
      async get(@Params('id') id: string, @Res res: Response) {
        const thing = await db.collection('things').find({ id })
        res.send(thing)
      }

      @Post('/things')
      async create(@Res res: Response, @Body body: Thing) {
        const newThing = await db.collection('things').insertOne(body)
        res.status(201).send(newThing)
      }
    }
    ```

4. Register them on your Express application.

    ```ts
    // server.ts
    import 'reflect-metadata'
    import express from 'express'
    import { register } from '@reflet/express'
    import { ThingController } from './thing.controller.ts'

    const app = express()
    app.use(someGlobalMiddleware)

    register(app, [ThingController, /*...*/])

    app.listen(3000)
    ```

### The Express way

> 🔦 `register(app, [controllers])`

As you can see, the main method `register` simply accepts an Express app and an array of your classes.

You still apply your global middlewares and start your server in the Express way you already know. This means you can progressively add Reflet to your existing app. 😉

It's up to you to define more complex application bootstrapping, if needed.

## Routing

To handle requests with a class, let's call it a controller, you simply have to decorate its methods with route decorators.

### Common route decorators

> 🔦 `@Get(path)`, `@Post(path)`, `@Patch(path)`, `@Put(path)`, `@Delete(path)`<br>
> 💫 Related Express methods: [`app.get`](https://expressjs.com/en/4x/api.html#app.get.method), [`app.post`](https://expressjs.com/en/4x/api.html#app.post.method), [`app.put`](https://expressjs.com/en/4x/api.html#app.put.method), [`app.delete`](https://expressjs.com/en/4x/api.html#app.delete.method)

Reflet directly exposes common route decorators handling the majority of routing use cases.
Here is a comparaison of Reflet and plain Express for basic requests:

<table>
<thead>
<tr>
  <th>HTTP request</th>
  <th>Reflet</th>
  <th>Express</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```http
GET http://host/foo
```

  </td>
  <td>

```ts
@Get('/foo')
get(req, res, next) {}
```

  </td>
  <td>

```ts
app.get('/foo', (req, res, next) => {})
```

  </td>
</tr>
<tr>
  <td>

```http
POST http://host/foo
```

  </td>
  <td>

```ts
@Post('/foo')
create(req, res, next) {}
```

  </td>
  <td>

```ts
app.post('/foo', (req, res, next) => {})
```

  </td>
</tr>
<tr>
  <td>

```http
PATCH http://host/foo
```

  </td>
  <td>

```ts
@Patch('/foo')
update(req, res, next) {}
```

  </td>
  <td>

```ts
app.patch('/foo', (req, res, next) => {})
```

  </td>
</tr>
<tr>
  <td>

```http
PUT http://host/foo
```

  </td>
  <td>

```ts
@Put('/foo')
replace(req, res, next) {}
```

  </td>
  <td>

```ts
app.put('/foo', (req, res, next) => {})
```

  </td>
</tr>
<tr>
  <td>

```http
DELETE http://host/foo
```

  </td>
  <td>

```ts
@Delete('/foo')
remove(req, res, next) {}
```

  </td>
  <td>

```ts
app.delete('/foo', (req, res, next) => {})
```

  </td>
</tr>
<tbody>
</table>

Pretty obvious, like any other decorator framework.

##### 💡 Tip

Apply multipe route decorators on the same method to share the logic:

```ts
@Patch('/things/:id')
@Put('/things/:id')
update(req, res, next) {}
```

### Create your own route decorator 🔧

> 🔦 `@Method(method, path)`<br>
> 💫 Related Express methods: [`app.METHOD`](https://expressjs.com/en/4x/api.html#app.METHOD), [`app.all`](https://expressjs.com/en/4x/api.html#app.all)

Common route decorators are all created from `Method`, a decorator in itself, that can (and should) be used to create a new route decorator for any other [routing method](https://expressjs.com/en/4x/api.html#routing-methods) supported by Express (plus the [`all` method](https://expressjs.com/en/4x/api.html#app.all)).

```ts
const Options = (path: string | RegExp) => Method('options', path)
const All = (path: string | RegExp) => Method('all', path)

class Controller {
  @Options('/things')
  opts(req: Request, res: Response, next: NextFunction) {}

  @All('/things')
  all(req: Request, res: Response, next: NextFunction) {}
}
```

### Router

> 🔦 `@Router(path, options?)`<br>
> 💫 Related Express method: [`express.Router`](https://expressjs.com/en/4x/api.html#express.router)

As you've seen, you **don't need** to decorate your controller classes for routing to work (contrary to most frameworks). The routes will simply be attached to the main app.

But you can also attach routes to an Express [Router](https://expressjs.com/en/4x/api.html#router), so they can share a root path, just like with plain Express.

```ts
@Router('/things')
class Controller {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}

  @Get('/:id')
  get(req: Request, res: Response, next: NextFunction) {}

  @Post('/:id')
  create(req: Request, res: Response, next: NextFunction) {}
}
```

Express [Router options](https://expressjs.com/en/4x/api.html#express.router) can be defined as a second argument:

```ts
@Router('/things', { strict: true, caseSensitive: true })
```

🗣️ Beware of VSCode auto-import, it will first try to import `Router` from Express instead of Reflet.

### Handler parameters injection

> 🔦 `@Req`, `@Res`, `@Next`<br>
> 💫 Related Express objects: [`req`](https://expressjs.com/en/4x/api.html#req), [`res`](https://expressjs.com/en/4x/api.html#res)

You can inject the handler parameters in any order by applying dedicated parameter decorators:

```ts
class Controller {
  @Get('/things')
  list(@Res res: Response, @Next next: NextFunction) {
    res.send('done')
  }

  @Post('/things')
  create(@Res() res: Response, @Req() req: Request) {
    res.json(req.body)
  }
}
```

You can apply them **with or without** invokation, how flexible is that. 😉

Looking for other decorators like `@Body` ? [Request properties injection](#request-properties-injection).

### Async error support

Routes (and middlewares) are **promisified** to properly pass errors on to `next` and to the express error handling system.

```ts
class Controller {
  @Get('/thing')
  async get() {
    await Promise.reject('oops') // properly handled by next callback: next('oops')
  }
}
```

## Middlewares

> 🔦 `@Use(...middlewares)`<br>
> 💫 Related Express method: [`app.use`](https://expressjs.com/en/4x/api.html#app.use)

Apply middlewares on specific routes or whole controllers:

```ts
@Use(express.json(), express.urlencoded())
@Use(cors())
class Controller {
  @Use((req, res, next) => next())
  @Get('/things')
  list() {}
}
```

`Use` is highly versatile, like the underlying `app.use` method. You can pass **as many** middlewares as you want inside a `Use` decorator, and you can apply **as many** `Use` decorators as you want on a single class or method.

If `Router` decorator is used, Reflet will apply class-scoped middlewares to the newly created Express Router.

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Express equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Use(A)
class Foo {
  @Use(B, C)
  @Use(D)
  @Get('/foo')
  get(req, res, next) {}
}
```

  </td>
  <td>

```ts
app.get('/foo', A, B, C, D, (req, res, next) => {})
```

  </td>
</tr>
<tr>
  <td>

```ts
@Use(A)
@Use(B, C)
@Router('/foo')
class Foo {
  @Use(D)
  @Get()
  get(req, res, next) {}
}
```

  </td>
  <td>

```ts
const subapp = express.Router()
subapp.use(A, B, C)
subapp.get('', D, (req, res, next) => {})
app.use('/foo', subapp)
```

  </td>
</tr>
<tbody>
</table>

##### About order

Successive `Use` will be applied in the order they are written, even though decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).

### Create your own middleware decorator 🔧

The versatility of `Use` allows for powerful extension.

```ts
function UseStatus(statusCode: number) {
  return Use((req, res, next) => {
    res.status(statusCode)
    next()
  })
}

class Controller {
  @UseStatus(201)
  @Post('/things')
  create(req: Request, res: Response, next: NextFunction) {}
}
```

🗣️ As a naming convention, custom middleware decorators' name should begin with `Use`.

### Little extra 🧩

Before you go and copy the code above... Reflet makes full use of, well, `Use` and provides an add-on module for convenient middleware decorators: **[Reflet/express-middlewares](../express-middlewares)**

Here's a list of them:

* `UseGuards` for request authorization handling.
* `UseInterceptor` for response body manipulation.
* `UseOnFinish` for response side effects.
* `UseStatus` for response status.
* `UseSet` for response headers.
* `UseType` for response content-type.
* `UseIf` for conditional middlewares.

Convinced yet ? Go over to [the doc](../express-middlewares/README.MD).

## Request properties injection

Directly inject Request properties (and even their sub-properties) in handler parameters. Just like with `Req`, `Res` or `Next`, invokation is **optional**.

### Route params

> 🔦 `@Params(name?)`<br>
> 💫 Related Express object: [`req.params`](https://expressjs.com/en/4x/api.html#req.params)

```ts
class Controller {
  // Whole params object
  @Get('/users/:userId/things/:thingId')
  get(@Params params: { userId: string; bookId: string }) {}

  // Specific name
  @Get('/users/:userId/things/:thingId')
  get(@Params('userId') userId: string, @Params('thingId') thingId: string) {}
}
```

### Query string

> 🔦 `@Query(field?)`<br>
> 💫 Related Express object: [`req.query`](https://expressjs.com/en/4x/api.html#req.query)

Given the request: `GET http://host/things?size=large&color=green`

```ts
class Controller {
  // Whole query object
  @Get('/things')
  list(@Query query: { size?: string; color?: string }) {}

  // Specific field
  @Get('/things')
  list(@Query('size') size?: string, @Query('color') color?: string) {}
}
```

### Request body

> 🔦 `@Body(key?)`<br>
> 💫 Related Express object: [`req.body`](https://expressjs.com/en/4x/api.html#req.body)

```ts
class Controller {
  // Whole body
  @Patch('/things/:id')
  update(@Body body: Partial<Thing>) {}

  // Specific key
  @Patch('/things/:id')
  update(@Body<Thing>('name') name: string) {}
}
```

`Body` will automatically apply the following Express body parsers on the routes using it:

* `express.json()`
* `express.urlencoded({ extended: true })`

You can `Use` the same body parsers (or apply them globally on your app) with different options and they will take precedence:

```ts
@Use(express.json({ limit: '500kb' }))
class Controller {
  @Post('/things')
  create(@Body body: Thing) {} // default jsonParser won't be applied again here.
}
```

### Request headers

> 🔦 `@Headers(header?)`<br>
> 💫 Related Node.js object: [`req.headers`](https://nodejs.org/api/http.html#http_message_headers)

```ts
class Controller {
  // Whole headers object
  @Get('/things')
  list(@Headers headers: IncomingHttpHeaders) {}
  
  // Specific header
  @Get('/things')
  list(@Headers('user-agent') userAgent: string) {}
}
```

`Header` input type is narrowed to a union of known **request headers** (instead of just `string`), so typos are prevented and you have that sweet auto-completion. You can still opt-out by expanding the input type to `string` or `any`:

```ts
class Controller {
  @Get('/things')
  list(@Headers<string>('x-custom') custom: string) {}
}
```

##### 💡 Tip

Use **[HTTP request headers enum](https://github.com/jeremyben/tshttp/tree/master/header)** from the same maintainer (that would be me) for an even better developer experience.

### Create your own parameter decorator 🔧

> 🔦 `createParamDecorator(requestMapper, [middlewares]?, deduplicateMiddlewares?)`

Inject and manipulate whatever you need from the Request object:

```ts
const CurrentUser = createParamDecorator((req) => req.user)

class Controller {
  @Get('/things')
  list(@CurrentUser user: User) {}
}
```

#### Add implicit middlewares

If your decorator needs any middleware, to work **as is**, Reflet got you covered:

```ts
const isAuthenticated: RequestHandler = (req, res, next) => {
  // validate and attach user to req...
  next()
}

const CurrentUser = createParamDecorator((req) => req.user, [isAuthenticated])
```

Now what if this implicit middleware is already applied explicitely before ? You might not want it to be executed twice:

```ts
@Use(isAuthenticated)
class Controller {
  @Get('/things')
  list(@CurrentUser user: User) {}
}
```

A final option marks your custom decorator's middlewares for **deduplication**:

```ts
const CurrentUser = createParamDecorator((req) => req.user, [isAuthenticated], true)
```

With this option turned on, on registering, Reflet won't add the implicit middlewares if they're already applied locally (on a route or controller) or globally (on the app). _Comparison is done by **reference** and by **name**._

That's basically how the `Body` decorator works with its body parsers.

This mecanism is really powerful 🦾 and allows your custom decorator to be decoupled yet still integrate nicely within any controller.

#### Example with input

```ts
const BodyTrimmed = (key: string) => createParamDecorator(
  (req) => {
    if (typeof req.body[key] === 'string') return req.body[key].trim()
    else return req.body[key]
  },
  [express.json(), express.urlencoded()],
  true
)

class Controller {
  @Post('/things')
  create(@BodyTrimmed('name') name: string) {}
}
```

## Sending return value

> 🔦 `@Send(options?)`<br>
> 💫 Related Express method: [`res.send`](https://expressjs.com/en/4x/api.html#res.send)

You want your methods' return value to be handled for you ?<br>Then simply tell Reflet to `Send` it.

```ts
@Send()
@Get('/me')
get() {
  return { name: 'Jeremy' }
}
```

By the way, you can still use the Response object to send your data, and Reflet will figure that it has already been sent. 😉

### Async and stream support

* Promises are resolved before being sent.
* Readable streams are piped into the response.

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Express equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Send()
@Get('/')
get() {
  return Promise.resolve('done')
}
```

  </td>
  <td>

```ts
app.get('/', (req, res, next) => {
  Promise.resolve('done').then(value => res.send(value))
})
```

  </td>
</tr>
<tr>
  <td>

```ts
@Send()
@Get('/')
get() {
  return createReadStream('path/to/file')
}
```

  </td>
  <td>

```ts
app.get('/', (req, res, next) => {
  createReadStream('path/to/file').pipe(res)
})
```

  </td>
</tr>
<tbody>
</table>

### Force JSON response

> 🔦 `@Send({ json: true })`<br>
> 💫 Related Express method: [`res.json`](https://expressjs.com/en/4x/api.html#res.json)

Behind the scene `Send` uses, you've guessed it, the [`res.send`](https://expressjs.com/en/4x/api.html#res.send) Express method. It already sends a proper JSON response for Objects and Arrays, but you might want to force JSON for any type with the help of [`res.json`](https://expressjs.com/en/4x/api.html#res.json):

```ts
@Send({ json: true }) // will use res.json behind the scene
@Get('/me')
get() {
  return 'Jeremy' // Content-Type: 'application/json'
}
```

### Change response status

> 🔦 `@Send({ status: XXX, undefinedStatus: XXX, nullStatus: XXX })`<br>
> 💫 Related Express method: [`res.status`](https://expressjs.com/en/4x/api.html#res.status)

By default in Node.js, HTTP response status code is set to `200`. To set another code:

```ts
@Send({ status: 201 })
@Post('/me')
create() {
  return { name: 'Jeremy' } // 201 status
}
```

You can conditionaly set status for `undefined` and `null` values:

```ts
@Send({ nullStatus: 205, undefinedStatus: 404 })
@Get('/things')
list() {
  if (conditionA) return // 404 status
  if (conditionB) return null // 205 status
  return {} // 200 status
}
```

##### 💡 Tip

Use **[HTTP status enums](https://github.com/jeremyben/tshttp/tree/master/status)** from the same maintainer (me again) for an even better developer experience.

### Share and override

Decorate classes with specific `Send` options so they act as a base for methods' `Send` options.

```ts
@Send({ json: true, status: 100 })
class PeopleController {
  @Send({ status: 200 }) // extends class send options
  @Get('/me')
  get() {
    return 'Jeremy' // 200 status, Content-Type: 'application/json'
  }
}
```

#### Make exceptions

> 🔦 `@DontSend()`

You need to take full control back in one of your methods ? Apply `DontSend` to exclude a method from `Send` behavior.

```ts
@Send()
@Router('/things')
class Controller {
  @Get()
  list() {
    return db.collection('things').find({})
  }

  @DontSend()
  @Post()
  create(@Res res: Response) {
    res.write('complex')
    res.end('stuff')
  }
}
```

### Why opt-in and not default ❔

Other frameworks choose to handle and send the return value by default. Reflet chooses not to.

It's not that Reflet dislikes magic. But magic should be explicit and have its own decorator.<br> Magic should be under control 🧙‍, that's the reason for the `Send` decorator.

## Error handling

### Local error handler

> 🔦 `@Catch(errorHandler)`<br>
> 💫 Related Express method: [`app.use`](https://expressjs.com/en/4x/api.html#app.use)

```ts
class Controller {
  @Catch((err, req, res, next) => {
    res.status(400)
    next(err)
  })
  @Get('/things')
  list(req: Request, res: Response, next: NextFunction) {
    throw Error('Nope') // or next('Nope')
  }
}
```

If Router decorator is used, Reflet will apply class-scoped error handlers to the newly created Express Router.

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Express equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Catch(A)
class Foo {
  @Catch(B)
  @Catch(C)
  @Get('/foo')
  get(req, res, next) {
    throw Error()
  }
}
```

  </td>
  <td>

```ts
app.get('/foo', (req, res, next) => { throw Error() }, B, C, A)
```

  </td>
</tr>
<tr>
  <td>

```ts
@Catch(A)
@Router('/foo')
class Foo {
  @Catch(B)
  @Catch(C)
  @Get()
  get(req, res, next) {
    throw Error()
  }
}
```

  </td>
  <td>

```ts
const subapp = express.Router()
subapp.get('', (req, res, next) => { throw Error() }, B, C)
subapp.use(A)
app.use('/foo', subapp)
```

  </td>
</tr>
</tbody>
</table>

##### About order

Logically, class-scoped error handlers are applied further down the handlers' stack than method-scoped error handlers.<br>And like with `Use`, successive `Catch` will be applied in the order they are written.

##### 💡 Tip

Throw some **[HTTP Errors](https://github.com/jeremyben/tshttp/tree/master/error)** from the same maintainer (you know who) for an even better developer experience. _Compatible with express default error handler as well._

### Global error handler

> 💫 Related Express concept: [Default error handler](https://expressjs.com/en/guide/error-handling.html#the-default-error-handler)

Reflet already adds a **smart** global error handler to your app. It tries to stay generic enough to not get in your way, but you can easily **overwrite** it by applying yours.

#### JSON detection

Express default error handler always send a `text/html` response ([source code](https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L272-L311)). This doesn't go well with today's world of JSON APIs. Reflet adds an intermediary default error handler to detect whether to send the error as a JSON response.

* It first looks for `Content-Type` on the response:

    ```ts
    res.type('json')
    // ...
    throw Error('Nope') // Content-Type: 'application/json'
    ```

* If none is found, it infers it from `X-Requested-With` or `Accept` headers on the request:

    ```http
    GET http://host/foo
    Accept: application/json
    ```

    ```ts
    throw Error('Nope') // Content-Type: 'application/json'
    ```

#### Status detection

Reflet parses the error value and looks for a `4xx` or `5xx` status code.

The following will set the response status to `400`:

```ts
throw { status: 400, message: 'Please stop' } // no error stack

throw 400 // no error stack
// will be normalized 👉 { status: 400, message: '' }

throw Error('400: Please stop') // using Number.parseInt
// will be normalized 👉 Error { status: 400, message: 'Please stop' }

const err = Error('Please stop')
err.status = 400
throw err // the Express way
```

If none is found, it will look at the response status code, and if still nothing, will set `500` as default.

#### Simply the default

Don't want all that smartness ? 😥 After registering your controllers, attach your own global error handler and Reflet's global error handler will be removed from handlers' stack.

```ts
const app = register(express(), [Controller])
// From there, a little magic detects a new global error handler on the app.

app.use((err, req, res, next) => res.status(500).send(err))
// Your error handler has been applied and has removed Reflet's error handler.

app.listen(3000)
```

No need for a weird option in `register`.
