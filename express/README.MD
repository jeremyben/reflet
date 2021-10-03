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
* [Application class](#application-class)
* [Pure dependency injection](#pure-dependency-injection)

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

3. Create your decorated routing routers.

    ```ts
    // thing.router.ts
    import { Get, Post, Res, Params, Body } from '@reflet/express'

    export class ThingRouter {
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
    import { ThingRouter } from './thing.router.ts'

    const app = express()
    app.use(someGlobalMiddleware)

    register(app, [ThingRouter, /*...*/])

    app.listen(3000)
    ```

### The Express way

> 🔦 `register(app, [routers])`

As you can see, the main method `register` simply accepts an Express app and an array of your classes.

You still apply your global middlewares and start your server in the Express way you already know. This means you can progressively add Reflet to your existing app. 😉

If you have a more complex bootstraping, reflet allows you to inherit the express original application with [Application class](#application-class).

## Routing

To handle requests with a class, let's call it a router (or a controller if you prefer), you simply have to decorate its methods with route decorators.

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
const Options = (path: string | RegExp) => Route('options', path)

class ThingRouter {
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

class ThingRouter {
  @Patch_Put('/things/:id')
  update(req: Request, res: Response, next: NextFunction) {}
}
```

### Router

> 🔦 `@Router(path, options?)`<br>
> 💫 Related Express method: [`express.Router`](https://expressjs.com/en/4x/api.html#express.router)

As you've seen, you **don't need** to decorate your router classes for routing to work (contrary to most frameworks). The routes will simply be attached to the main app.

But you can also attach routes to an Express [Router](https://expressjs.com/en/4x/api.html#router), so they can share a root path, just like with plain Express.

```ts
@Router('/things')
class ThingRouter {
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

#### Nested routers

> 🔦 `@Router.Children(register)`

You can register child routers with the dedicated decorator `Router.Children`:

```ts
@Router('/album')
@Router.Children(() => [TrackRouter])
class AlbumRouter {}

@Router('/:albumId/track', { mergeParams: true })
class TrackRouter {}
```

#### Paths centralization and constraint

You might want the root paths of your routers to be centralized as well, so you can have a glance at all of them. 👀<br>You can register all your routers with a path constraint (Reflet will enforce those paths):

```ts
@Router('/foo')
class Foo {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

register(app, [{ path: '/foo', router: Foo }])
```

_Also possible with child routers._

##### Plain express routers

To be able to progressively switch to Reflet, you can still register your plain express routers, with the help of the previous `path` property:

```ts
@Router('/decorated')
class Decorated {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

const plain = express.Router().get('', (req, res, next) => {})

register(app, [
  { path: '/decorated', router: Decorated },
  { path: '/plain', router: plain }
])
```

_Also possible with child routers._

#### Dynamic nested routers

> 🔦 `Router.Dynamic(options?)`

A dynamic router is a router without a predefined path. Its path is then defined at registration.

Useful if you need to share a child router with multiple parents, and attach it on different paths.

```ts
@Router.Dynamic()
class ItemRouter {
  @Get()
  list(req: Request, res: Response, next: NextFunction) {}
}

@Router('/foo')
class FooRouter {
  constructor() {
    register(this, [{ path: '/items', router: ItemRouter }])
  }
}

@Router('/bar')
class BarRouter {
  constructor() {
    register(this, [{ path: '/elements', router: ItemRouter }])
  }
}
```

### Handler parameters injection

> 🔦 `@Req`, `@Res`, `@Next`<br>
> 💫 Related Express objects: [`req`](https://expressjs.com/en/4x/api.html#req), [`res`](https://expressjs.com/en/4x/api.html#res)

You can inject the handler parameters in any order by applying dedicated parameter decorators:

```ts
class ThingRouter {
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

You can apply them **with or without invokation**, how flexible is that. 😉

Looking for other decorators like `@Body` ? [Request properties injection](#request-properties-injection).

### Async support

Async functions (routes and middlewares) are properly wrapped to pass errors on to `next` and to the express error handling system.

```ts
class ThingRouter {
  @Get('/thing')
  async get() {
    await Promise.reject('oops') // properly handled by next callback: next('oops')
  }
}
```

## Middlewares

> 🔦 `@Use(...middlewares)`<br>
> 💫 Related Express method: [`app.use`](https://expressjs.com/en/4x/api.html#app.use)

Apply middlewares on specific routes or whole routers:

```ts
@Use(express.json(), express.urlencoded())
@Use(cors())
class ThingRouter {
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

### Create your own middleware decorator 🔧

The versatility of `Use` allows for powerful extension.

```ts
function UseStatus(statusCode: number) {
  return Use((req, res, next) => {
    res.status(statusCode)
    next()
  })
}

class ThingRouter {
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

Directly inject Request properties (and even their sub-properties) in handler parameters. Just like with `Req`, `Res` or `Next`, **invokation is optional**.

### Route params

> 🔦 `@Params(name?)`<br>
> 💫 Related Express object: [`req.params`](https://expressjs.com/en/4x/api.html#req.params)

```ts
class UserRouter {
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
class ThingRouter {
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
class ThingRouter {
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
class ThingRouter {
  @Post('/things')
  create(@Body body: Thing) {} // default jsonParser won't be applied again here.
}
```

### Request headers

> 🔦 `@Headers(header?)`<br>
> 💫 Related Node.js object: [`req.headers`](https://nodejs.org/api/http.html#http_message_headers)

```ts
class ThingRouter {
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
class ThingRouter {
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

class ThingRouter {
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
class ThingRouter {
  @Get('/things')
  list(@CurrentUser user: User) {}
}
```

A final option marks your custom decorator's middlewares for **deduplication**:

```ts
const CurrentUser = createParamDecorator((req) => req.user, [isAuthenticated], true)
```

With this option turned on, on registering, Reflet won't add the implicit middlewares if they're already applied locally (on a route or router) or globally (on the app). _Comparison is done by **reference** and by **name**._

That's basically how the `Body` decorator works with its body parsers.

This mecanism is really powerful 🦾 and allows your custom decorator to be decoupled yet still integrate nicely within any router.

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

class ThingRouter {
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
class PeopleRouter {
  @Send({ status: 200 }) // extends class send options
  @Get('/me')
  get() {
    return 'Jeremy' // 200 status, Content-Type: 'application/json'
  }
}
```

#### Make exceptions

> 🔦 `@Send.Dont()`

You need to take full control back in one of your methods ? Apply `Send.Dont` to exclude a method from `Send` behavior.

```ts
@Send()
@Router('/things')
class ThingRouter {
  @Get()
  list() {
    return db.collection('things').find({})
  }

  @Send.Dont()
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
class ThingRouter {
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

Throw some **[HTTP Errors](https://github.com/jeremyben/tshttp/tree/master/error)** from the same maintainer (you know who) for an even better developer experience. _Compatible with express default error handler as well._

## Application class

> 🔦 `Application`

Have you ever tried to turn `express()` into a proper class ? Reflet did. 😁

```ts
import * as express from 'express'
import { Application } from '@reflet/express'
import { UserRouter } from './user.router'

const app = new Application()

app.use(express.json(), express.urlencoded())
app.register([UserRouter]) // register is now a method !

app.listen(3000)
```

Not much for now, but you can extend this class and use all the decorators, as if they were global :
Routes will be attached at the root, and middlewares, error handlers, and `Send` options, will be shared globally !

```ts
import * as express from 'express'
import { Application, RegistrationArray } from '@reflet/express'
import { UserRouter } from './user.router'

@Send({ json: true })
@Catch((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500)
  res.json(err)
})
@Use(express.json(), express.urlencoded())
class MyApp extends Application {
  constructor(routers: RegistrationArray) {
    super()
    this.register(routers)
  }

  @Get('/healthcheck')
  healthcheck() {
    return { success: true }
  }
}

const app = new MyApp([UserRouter])

app.listen(3000)
```

## Pure dependency injection

If you want to go full OOP and your routers have constructor dependencies, Reflet will enforce passing them as instances (along with their dependencies) instead of classes, to the `register` function which then acts as a _[Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/)_.

```ts
interface IUserService {
  getUsers(): Promise<User[]>
}

class UserService implements IUserService {
  async getUsers() {
    return db.collection('users').find({})
  }
}

class UserRouter {
  constructor(private userService: IUserService) {}

  @Get('/user')
  async getAllUsers(@Res res: Response) {
    const users = await this.userService.getUsers()
    res.send(users)
  }
}

register(app, [
  new UserRouter(new UserService())
])
```

No DI Container magic, no cumbersome `@Inject` decorator 😵... Only _**[pure DI](https://blog.ploeh.dk/2014/06/10/pure-di/)**_, which is the simplest and the most strongly typed DI.

You can even pass dependencies down your nested routers:

```ts
@Router('/parent')
@Router.Children<typeof ParentRouter>((service) => [new NestedRouter(service)])
class ParentRouter {
  constructor(private service: Service) {}
}

register(app, [new ParentRouter(new Service())])
```
