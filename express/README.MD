# `@reflet/express` 🌠

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/express/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

> [!IMPORTANT]  
> Upgrade from **v1** to **v2** : [Migration guide](https://github.com/jeremyben/reflet/blob/master/express/MIGRATION.md)

The **best** decorators for [Express](https://expressjs.com/). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Routing](#routing)
* [Middlewares](#middlewares)
* [Request properties injection](#request-properties-injection)
* [Sending return value](#sending-return-value)
* [Error handling](#error-handling)
* [Express Application class](#express-application-class)
* [Pure dependency injection](#pure-dependency-injection)

## Getting started

1. Enable experimental decorators in TypeScript compiler options.<br>_No need to install "reflect-metadata"._

    ```json
    "experimentalDecorators": true,
    ```

2. Install the package along with peer dependencies.

    ```sh
    npm i @reflet/express @reflet/http express
    npm i -D @types/express
    ```

3. Create your decorated routers/controllers.

    ```ts
    // thing.controller.ts
    import { Get, Post, Res, Params, Body, Controller } from '@reflet/express'

    @Controller('/things')
    export class ThingController {
      @Get()
      async list(@Res res: Response) {
        const things = await db.collection('things').find({})
        res.send(things)
      }

      @Get('/:id')
      async get(@Params('id') id: string, @Res res: Response) {
        const thing = await db.collection('things').find({ id })
        res.send(thing)
      }

      @Post()
      async create(@Res res: Response, @Body body: Thing) {
        const newThing = await db.collection('things').insertOne(body)
        res.status(201).send(newThing)
      }
    }
    ```

4. Register them on your Express application.

    ```ts
    // server.ts
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

If you have a more complex bootstraping, reflet allows you to inherit the express original application with [Application class](#application-class).

## Routing

To handle requests with a class (the controller/router), you simply have to decorate its methods with route decorators.

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

#### Other route decorators

> 🔦 `@Route(method, path)`<br>
> 💫 Related Express methods: [`app.METHOD`](https://expressjs.com/en/4x/api.html#app.METHOD), [`app.all`](https://expressjs.com/en/4x/api.html#app.all)

Common route decorators are created from `Route`, a decorator in itself, that can be used to create a route decorator for any other [routing method](https://expressjs.com/en/4x/api.html#routing-methods) supported by Express (plus the [`all` method](https://expressjs.com/en/4x/api.html#app.all)).

As a convenience, `Route` is also a namespace that gives access to all route decorators as its properties.

```ts
const Options = (path?: string | RegExp) => Route('options', path)

@Controller('/')
class ThingController {
  @Options('/things')
  opts(req: Request, res: Response, next: NextFunction) {}

  @Route.All('/things')
  all(req: Request, res: Response, next: NextFunction) {}

  @Route.Get('/things')
  get(req: Request, res: Response, next: NextFunction) {}
}
```

#### Handler with multiple verbs

You can share the same handler with multiple HTTP verbs, by passing an array to `Route`.

```ts
const Patch_Put = (path: string | RegExp) => Route(['patch', 'put'], path)

class ThingController {
  @Patch_Put('/things/:id')
  update(req: Request, res: Response, next: NextFunction) {}
}
```

### Controller

> 🔦 `@Controller(path, options?)`<br>
> 💫 Related Express method: [`express.Router`](https://expressjs.com/en/4x/api.html#express.router)

You then attach routes to an Express [Router](https://expressjs.com/en/4x/api.html#router), so they can share a root path, just like with plain Express.

```ts
@Controller('/things')
class ThingController {
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
@Controller('/things', { strict: true, caseSensitive: true })
```

#### Nested controllers

> 🔦 `@Controller.Children(register)`

You can register child controllers with the dedicated decorator `Controller.Children`:

```ts
@Controller('/album')
@Controller.Children(() => [TrackController])
class AlbumController {}

@Controller('/:albumId/track', { mergeParams: true })
class TrackController {}
```

#### Paths centralization and constraint

You might want the root paths of your controllers to be centralized as well, so you can have a glance at all of them. 👀<br>You can register your controllers as a tuple with a path constraint (Reflet will enforce those paths):

```ts
@Controller('/foo')
class Foo {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

register(app, [['/foo', Foo]])
```

_Also possible with child controllers._

##### Plain express routers

To be able to progressively switch to Reflet, you can still register your plain express routers, with the help of the previous path tuple:

```ts
@Controller('/decorated')
class Decorated {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

const plain = express.Router().get('', (req, res, next) => {})

register(app, [
  ['/decorated', Decorated],
  ['/plain', plain]
])
```

_Also possible with child controllers._

#### Dynamic nested controllers

> 🔦 `Controller.Dynamic(options?)`

A dynamic controller is a controller without a predefined path. Its path is then defined at registration.

Useful if you need to share a child controller with multiple parents, and attach it on different paths.

```ts
@Controller.Dynamic()
class ItemController {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

@Controller('/foo')
@Controller.Children(() => [['/items', ItemController]])
class FooController {}

@Controller('/bar')
@Controller.Children(() => [['/elements', ItemController]])
class BarController {}
```

### Handler parameters injection

> 🔦 `@Req`, `@Res`, `@Next`<br>
> 💫 Related Express objects: [`req`](https://expressjs.com/en/4x/api.html#req), [`res`](https://expressjs.com/en/4x/api.html#res)

You can inject the handler parameters in any order by applying dedicated parameter decorators:

```ts
@Controller('/things')
class ThingController {
  @Get()
  list(@Res res: Res, @Next next: Next) {
    res.send('done')
  }

  @Post()
  create(@Res() res: Res, @Req() req: Req) {
    res.json(req.body)
  }
}
```

You can apply them **with or without invokation**, how flexible is that. 😉

The decorators when used as types, are convenient references to express interfaces (so you don't need to import them).

Looking for other decorators like `@Body` ? [Request properties injection](#request-properties-injection).

### Async support

Async functions (routes and middlewares) are properly wrapped to pass errors on to `next` and to the express error handling system.

```ts
class ThingController {
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
@Controller('/things')
class ThingController {
  @Use((req, res, next) => next())
  @Get()
  list() {}
}
```

`Use` is highly versatile, like the underlying `app.use` method. You can pass **as many** middlewares as you want inside a `Use` decorator, and you can apply **as many** `Use` decorators as you want on a single class or method.

Reflet respects Express flow and will apply class-scoped middlewares to the newly created Express Router:

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
@Use(B, C)
@Controller('/foo')
class Foo {
  @Use(D)
  @Get()
  get(req, res, next) {}
}
```

  </td>
  <td>

```ts
const router = express.Router()
router.use(A, B, C)
router.get('', D, (req, res, next) => {})
app.use('/foo', router)
```

  </td>
</tr>
<tbody>
</table>

##### About order

Successive `Use` will be applied in the order they are written, even though decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).

### Scoped controller middlewares

> 🔦 `@ScopedMiddlewares`

Express does not isolate middlewares of routers/controllers that share the same path ([related issue](https://github.com/expressjs/express/issues/2760)).

If you wish to circumvent this default behavior, add `ScopedMiddlewares` decorator to a controller, to scope its middlewares (and its error handlers) to its routes only.

```ts
@Controller('/foo')
@ScopedMiddlewares
@Use(authenticate)
class Foo1 {
  @Get('/secret')
  getSecret(req: Request, res: Response, next: NextFunction) {}
}

@Controller('/foo')
class Foo2 {
  @Get('/public')
  getPublic(req: Request, res: Response, next: NextFunction) {}
}
```

### Create your own middleware decorator 🔧

The versatility of `Use` allows for powerful extension.

```ts
function UseStatus(statusCode: number) {
  return Use((req, res, next) => {
    res.status(statusCode)
    next()
  })
}

@Controller('/things')
class ThingController {
  @UseStatus(201)
  @Post()
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

Directly inject Request properties (and even their sub-properties) in handler parameters. Just like with `Req`, `Res` or `Next`, **invokation is optional**.

### Route params

> 🔦 `@Params(name?)`<br>
> 💫 Related Express object: [`req.params`](https://expressjs.com/en/4x/api.html#req.params)

```ts
class UserController {
  // Whole params object
  @Get('/users/:userId/things/:thingId')
  get(@Params params: Params<'userId' | 'thingId'>) {}

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
@Controller('/things')
class ThingController {
  // Whole query object
  @Get()
  list(@Query query: Query) {}

  // Specific field
  @Get()
  list(@Query('size') size?: string, @Query('color') color?: string) {}
}
```

### Request body

> 🔦 `@Body(key?)`<br>
> 💫 Related Express object: [`req.body`](https://expressjs.com/en/4x/api.html#req.body)

```ts
@Controller('/things')
class ThingController {
  // Whole body
  @Patch('/:id')
  update(@Body body: Partial<Thing>) {}

  // Specific key
  @Patch('/:id')
  update(@Body<Thing>('name') name: string) {}
}
```

`Body` will automatically apply the following Express body parsers on the routes using it:

* `express.json()`
* `express.urlencoded({ extended: true })`

You can `Use` the same body parsers (or apply them globally on your app) with different options and they will take precedence:

```ts
@Use(express.json({ limit: '500kb' }))
@Controller('/things')
class ThingController {
  @Post()
  create(@Body body: Thing) {} // default jsonParser won't be applied again here.
}
```

### Request headers

> 🔦 `@Headers(header?)`<br>
> 💫 Related Node.js object: [`req.headers`](https://nodejs.org/api/http.html#http_message_headers)

```ts
@Controller('/things')
class ThingController {
  // Whole headers object
  @Get()
  list(@Headers headers: Headers) {}
  
  // Specific header
  @Get()
  list(@Headers('user-agent') userAgent: string) {}
}
```

`Header` input type is narrowed to a union of known **request headers** (instead of just `string`), so typos are prevented and you have that sweet auto-completion.

Augment the union with the help of the global namespace `RefletHttp`:

```ts
declare global {
  namespace RefletHttp {
    interface RequestHeader {
      XCustom: 'x-custom'
    }
  }
}

@Controller('/things')
class ThingController {
  @Get()
  list(@Headers('x-custom') custom: string) {}
}
```

Use **[`RequestHeader` enum](../http/README.md#header-)** from `@reflet/http` for better discoverability and documentation.

### Create your own parameter decorator 🔧

> 🔦 `createParamDecorator(requestMapper, [middlewares]?, deduplicateMiddlewares?)`

Inject and manipulate whatever you need from the Request object:

```ts
const CurrentUser = createParamDecorator((req) => req.user)

@Controller('/things')
class ThingController {
  @Get()
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
@Controller('/things')
class ThingController {
  @Get()
  list(@CurrentUser user: User) {}
}
```

You can mark your custom decorator's middlewares for **deduplication**:

```ts
const CurrentUser = createParamDecorator(
  (req) => req.user, 
  [{ handler: isAuthenticated, dedupe: true }]
)
```

With these options, on registering, Reflet won't add the implicit middlewares if they're already applied locally (on a route or controller) or globally (on the app). 

Comparison to deduplicate is done:
* by function reference with `dedupe: 'by-reference'`
* by function name with `dedupe: 'by-name'`
* by both function reference and name with `dedupe: true`

That's basically how the `Body` decorator works with its body parsers.

This mecanism is really powerful 🦾 and allows your custom decorator to be decoupled yet still integrate nicely within any controller.

#### Example with input

```ts
const BodyTrimmed = (key: string) => createParamDecorator(
  (req) => {
    if (typeof req.body[key] === 'string') return req.body[key].trim()
    else return req.body[key]
  },
  [
    { handler: express.json(), dedupe: true },
    { handler: express.urlencoded(), dedupe: true },
  ]
)

@Controller('/things')
class ThingController {
  @Post()
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

You can still use the Response object to send your data, and Reflet will figure that it has already been sent. 😉

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

### Custom handler

```ts
@Send<string>((data, { res }) => {
  if (data === undefined) res.status(404)
  if (data === null) res.status(204)
  
  res.json({ name: data })
})
@Get('/me')
get() {
  return 'Jeremy' 
}
```

### Share and override

Decorate a class with `Send` to apply its behavior to all its methods. You override the behavior on a method level.

```ts
@Send({ json: true })
class PeopleController {
  @Send({ json: false }) // override class send options
  @Get('/me')
  get() {
    return 'Jeremy' // Content-Type: 'text/html'
  }
}
```

#### Make exceptions

> 🔦 `@Send.Dont`

You need to take full control back in one of your methods ? Apply `Send.Dont` to exclude a method from `Send` behavior.

```ts
@Send()
@Controller('/things')
class ThingController {
  @Get()
  list() {
    return db.collection('things').find({})
  }

  @Send.Dont
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
@Controller('/things')
class ThingController {
  @Catch((err, req, res, next) => {
    res.status(400)
    next(err)
  })
  @Get()
  list(req: Request, res: Response, next: NextFunction) {
    throw Error('Nope') // or next('Nope')
  }
}
```

If Controller decorator is used, Reflet will apply class-scoped error handlers to the newly created Express Router.

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
@Controller('/foo')
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
const router = express.Router()
router.get('', (req, res, next) => { throw Error() }, B, C)
router.use(A)
app.use('/foo', router)
```

  </td>
</tr>
</tbody>
</table>

##### About order

Logically, class-scoped error handlers are applied further down the handlers' stack than method-scoped error handlers.<br>And like with `Use`, successive `Catch` will be applied in the order they are written.

##### 💡 Tip

Throw some **[`HTTPError`](../http/README.md#error-)** from `@reflet/http` for an even better developer experience. _Compatible with express default error handler as well._

### Final Handler

> 🔦 `finalHandler(options)`

```ts
const app = express()

register(app, [ThingRouter])

app.use(finalHandler({
  json: 'from-response-type',
  log: '5xx',
  notFoundHandler: true
}))
```

##### `json`

Express default error handler always sends a `text/html` response ([source code](https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L272-L311)). This doesn't go well with today's world of JSON APIs.

* `json: true` always sends the error with `res.json`.
  
* `json: false` passes the error to `next` to be handled by express final handler (default).

* `json: 'from-response-type'` sends the error with `res.json` by looking for `Content-Type` on the response:

    ```ts
    res.type('json')
    // ...
    throw Error('Nope') // Content-Type: 'application/json'
    ```

* `json: 'from-response-type-or-request'` first looks for `Content-Type` on the response, or infers it from `X-Requested-With` or `Accept` headers on the request:

    ```http
    GET http://host/foo
    Accept: application/json
    ```

    ```ts
    throw Error('Nope') // Content-Type: 'application/json'
    ```

##### `expose`

By default, Error `message` and `name` are not serialized to json.

With this option, you can either hide all error properties or expose some of them in the serialized response:

* `true`: exposes all properties (stack included, beware of information leakage !).
* `false`: exposes nothing (empty object).
* `string[]`: whitelists specifics properties.
* `(status) => boolean | string[]`: function for more conditional whitelisting:

```ts
finalHandler({
  json: true,
  expose(status) {
    // expose all properties in non production environment
    if (process.env !== 'production') {
      return true
    }

    // expose only some properties of client errors in production
    if (status < 500) {
      return ['message', 'code', 'data']
    } else {
      return false
    }
  }
})
```

##### `log`

* `log: true` always logs errors (with `console.error`).
* `log: false` never logs errors, _default_.
* `log: '5xx'` only logs server errors (with `console.error`).
* If you need the flexibility to log more infos or use a dedicated logger other that `console.error`, you can pass a function like so:

```ts
import * as pino from "pino";
const logger = pino()

finalHandler({
  log(err, req, res) {
    logger.error({
      err,
      status: res.statusCode,
      path: req.url,
      timestamp: new Date().toISOString(),
    })
  },
})
```

_The response object type only exposes safe properties, so you don't send the response by accident._

##### `notFoundHandler`

Like the error handler, Express default route handler always sends a `text/html` response when the route is not found.

* `notFoundHandler: true` defines a default handler similar to the Express one, with a 404 status, but compatible with json.
* `notFoundHandler: <number>` defines the same default handler, with a custom status code.
* `notFoundHandler: (req, res, next) => {}` lets you define your own.

## Express Application class

> 🔦 `ExpressApplication`

Have you ever tried to turn `express()` into a proper class ? Reflet did. 😁

```ts
import * as express from 'express'
import { ExpressApplication } from '@reflet/express'
import { UserController } from './user.controller'

const app = new ExpressApplication()

app.use(express.json(), express.urlencoded())
app.register([UserController]) // register is now a method !

app.listen(3000)
```

Not much for now, but you can extend this class and use all the decorators, as if they were global :
Routes will be attached at the root, and middlewares, error handlers, `Send` options, and `ScopedMiddlewares`, will be shared globally !

```ts
import * as express from 'express'
import { ExpressApplication, Registration, Use, Catch, Send, Controller } from '@reflet/express'
import { UserController } from './user.controller'

@Send({ json: true })
@Use(express.json(), express.urlencoded())
@ScopedMiddlewares
@Catch(finalHandler({ 
  json: true,
  log: true,
  notFoundHandler: true,
}))
class MyApp extends ExpressApplication {
  constructor(controllers: Registration[]) {
    super()
    this.register(controllers)
  }

  @Get('/healthcheck')
  healthcheck() {
    return { success: true }
  }
}

const app = new MyApp([UserController])

app.listen(3000)
```

_If you call `register` multiple times, Reflet will make sure global middlewares are added only once, and gloral error handlers are still at the end of the stack._

## Pure dependency injection

If you want to go full OOP and your controllers have constructor dependencies, Reflet will enforce passing them as instances (along with their dependencies) instead of classes, to the `register` function which then acts as a _[Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/)_.

```ts
interface IUserService {
  getUsers(): Promise<User[]>
}

class UserService implements IUserService {
  async getUsers() {
    return db.collection('users').find({})
  }
}

class UserController {
  constructor(private userService: IUserService) {}

  @Get('/user')
  async getAllUsers(@Res res: Response) {
    const users = await this.userService.getUsers()
    res.send(users)
  }
}

register(app, [
  new UserController(new UserService())
])
```

No DI Container magic, no cumbersome `@Inject` decorator 😵... Only _**[pure DI](https://blog.ploeh.dk/2014/06/10/pure-di/)**_, which is the simplest and the most strongly typed DI.

You can even pass dependencies down your nested controllers:

```ts
@Controller('/parent')
@Controller.Children<typeof ParentController>((service) => [new NestedController(service)])
class ParentController {
  constructor(private service: Service) {}
}

register(app, [new ParentController(new Service())])
```
