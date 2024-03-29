# Migration guide for `@reflet/express`

## From v1 to v2

* `Router` decorator is now mandatory on every router class.
  Simply attach `@Router('')` with an empty path to you non-decorated class to keep the same behavior as v1.

* `Method` decorator has been renamed `Route`.
  It works the same with a namespace for all methods: `Route.Get`, `Route.Head`, `Route.All`.
  Routing methods are exposed as a string union in `Route.Method`.

* Smart global error handler is no longer applied automatically.
  Use `finalHandler` to accomplish the same task.

* `Router.register` was deprecated and has been removed, as well as `register` in router constructor.
  Use `Router.Children` decorator instead.

* `DontSend` decorator was deprecated and has been removed.
  Use `Send.Dont` decorator instead.

* `Send` decorator no longer have the following options: `status`, `nullStatus`, `undefinedStatus`.
  Use `UseStatus` from "@reflet/express-middlewares" for `status`.
  For `nullStatus` and `undefinedStatus`, define a custom send handler to accomplish the same task:
  ```ts
  @Send((data, { res }) => {
    if (data === undefined) res.status(404)
    if (data === null) res.status(204)

    if (data instanceof stream.Readable) data.pipe(res)
    else res.send(data)
  })
  ```

* `Controllers` array interface was _unwrapped_ and renamed to `Registration`. Use it as `Registration[]`.

* Path constraints on routers are no longer an object with a `path` and a `router` properties, but a tuple.
  Use `register([['/foo, FooRouter]])` instead of `register([{ path: '/foo', router: FooRouter }])`.

* Option for middleware deduplication in `createParamDecorator` is no longer a single boolean.
  Use the signature `(myMapper, [{ handler: myMiddleware, dedupe: true }])` instead of `(myMapper, myMiddleware, true)`.

* "@reflet/http" is now a required peer dependency.
  
* "reflect-metadata" is no longer needed as a peer dependency.
