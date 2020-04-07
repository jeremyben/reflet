<h1 align="center">Reflet 💫</h1>

[![Node version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/package.json&label=Node&query=engines.node&color=green&logo=node.js)](https://nodejs.org)

Reflet is a suite of modules made of well-typed [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), to enhance Node.js and established libraries.<br>Reflet is simple, flexible. It will help you organize your app, without the pitfall of verbosity.<br>But most importantly, Reflet is french for reflection (pronounce _ruh flay_ 🐔).

## [Reflet/express](./express)

Organize your [Express](https://expressjs.com/) application. Have a little taste before **[heading to the doc](./express/README.MD)**:

```ts
@Use(isAuthenticated)
@Router('/things')
class ThingController {

  @Get('/:id')
  async get(@Params('id') id: string, @Res res: Response) {
    const thing = await db.collection('things').find({ id })
    res.status(200).send(thing)
  }

  @Send({ status: 201 })
  @UseGuards((req) => canCreateThing(req.user))
  @Post()
  async create(@Body('item') item: string) {
    const newThing = await db.collection('things').insertOne({ item })
    return newThing
```

_Add-on: [Reflet/express-middlewares](./express-middlewares)_

## Philosophy 📣

Why another decorator framework ? Simply <sub>(and biasedly)</sub> put, a better developer experience.

### Simple and intuitive

Reflet modules aim to stay close to the technology's underlying abstractions they decorate, <br>so you **don't have to learn** a whole new terminology to be productive. 🏌️‍

_e.g. [Reflet/express](./express) has decorators like `Use` for `app.use` method, `Router` for `express.Router`, `Send` for `res.send`.<br>If you're familiar with Express, you're gonna love its Reflet decorators._

As such, Reflet modules don't try to be agnostic or compatible with multiple technologies at once (_e.g. decorators for both Express, Koa, Fastify_), because that would mean :

* more detached, less familiar abstractions. 🤔
* less accurate static typing (conditional types to aknowledge differences). 🤥
* hence, more error prone code (from my part and yours). 😠

Instead, Reflet hopes to provide a well-defined and well-typed module for each libraries.

#### With accurate types

Reflet takes full advantage of TypeScript by **narrowing** its type signatures, to prevent as much mistakes as possible. 🎯

_e.g. [`Headers` decorator](./express/README.MD#request-headers) narrows its input to a union of request headers instead of just `string`, <br>[`UseStatus` decorator](./express-middlewares/README.MD#response-status) narrows its input to a union of status codes instead of just `number`._

#### With documentation at hand

Every exposed API is fully documented, with examples and even links to the original library documentation, so you're never alone in the dark of your editor theme. ☀️

### Built-in flexibility

Most decorator frameworks are great for the simple stuff, but inevitably get in your way later down the road. 🎠

Reflet does its best to avoid this by staying simple and to the point, **composable**, and by eating its own dog food: common decorators are built with lower-level tools, that are also provided to you. 🐎

_e.g. exposed Express [parameter decorators](./express/README.MD#request-properties-injection) are created by the same `createParamDecorator` method that is provided to you._

#### With progressive features

This design allows for easy extension and plugins. 🧩<br>In this regard, Reflet generally provides a core module with all the basic decorators to do everything, and **add-ons** for extra convenient features.

_e.g. [Reflet/express-middlewares](./express-middlewares) provides middleware decorators to handle authorization (`UseGuards`), response mapping (`UseInterceptor`), to complete the features of [Reflet/express](./express)._

### Self-control

NPM ecosystem got a bad rep by encouraging intricate third-party dependencies for the sake of DRY principle. <br>Time has come for a smarter dependency diet. 🍳

Reflet modules fully **own** their codebase. No direct third-party dependencies, only peer ones.

_e.g. [Reflet/express](./express) only asks for the necessary **peer** dependencies: `express`, `@types/express`, `reflect-metadata`._

### Readable `source code`

Careful abstractions `&&` clear-cut modules `&&` commented/documented code `&&` small number of files/folders `===` reduced indirection and complexity. 🧵

[Have a look](./express/src) and compare with similar frameworks. 🧶
