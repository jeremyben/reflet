# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.0.0 (2019-10-03)


### Bug Fixes

* **express:** allow typing the error object in Catch decorator ([a9375cd](https://github.com/jeremyben/reflet/tree/master/express/commit/a9375cd))
* **express:** authorize app.all as a routing method in Method decorator ([a450c20](https://github.com/jeremyben/reflet/tree/master/express/commit/a450c20))
* **express:** class send options are now extended by method send options instead of reset ([2f2edef](https://github.com/jeremyben/reflet/tree/master/express/commit/2f2edef))
* **express:** dedupe param middlewares according to function name instead of function body ([7dfede3](https://github.com/jeremyben/reflet/tree/master/express/commit/7dfede3))
* **express:** error message property is properly sent by the default error handler in json responses ([8bea495](https://github.com/jeremyben/reflet/tree/master/express/commit/8bea495))
* **express:** fix the middlewares order in routes applied to an app instance ([957268d](https://github.com/jeremyben/reflet/tree/master/express/commit/957268d))
* **express:** global error handler better prioritize status detection and clean status in message ([e6dd692](https://github.com/jeremyben/reflet/tree/master/express/commit/e6dd692))
* **express:** global error handler normalizes primitive type errors ([5d5a87f](https://github.com/jeremyben/reflet/tree/master/express/commit/5d5a87f))
* **express:** remove alpha stage Render decorator ([b8ae219](https://github.com/jeremyben/reflet/tree/master/express/commit/b8ae219))
* **express:** use symbols for reflect metadata keys ([68d7d86](https://github.com/jeremyben/reflet/tree/master/express/commit/68d7d86))


### Features

* **express:** add head, options, all express methods as route decorators ([bf43e05](https://github.com/jeremyben/reflet/tree/master/express/commit/bf43e05))
* **express:** allow multiple Use and Catch decorators, remove UseAfter ([0063a59](https://github.com/jeremyben/reflet/tree/master/express/commit/0063a59))
* **express:** allow to mark param decorator middlewares for deduplication ([1dedc26](https://github.com/jeremyben/reflet/tree/master/express/commit/1dedc26))
* **express:** apply body-parser middlewares to routes using @Body decorator ([7e5e383](https://github.com/jeremyben/reflet/tree/master/express/commit/7e5e383))
* **express:** dedupe/remove param middlewares if they're already applied elsewhere ([6b516c9](https://github.com/jeremyben/reflet/tree/master/express/commit/6b516c9))
* **express:** default global error handler, detects json and is removed if another is applied ([99d09b5](https://github.com/jeremyben/reflet/tree/master/express/commit/99d09b5))
* **express:** expose generic Method decorator, remove Head, Options and All decorators ([3c6be9a](https://github.com/jeremyben/reflet/tree/master/express/commit/3c6be9a))
* **express:** handle methods return value (async, streams, configurable status) with @Send ([bfdd1ae](https://github.com/jeremyben/reflet/tree/master/express/commit/bfdd1ae))
* **express:** infer error status code ([364564a](https://github.com/jeremyben/reflet/tree/master/express/commit/364564a))
* **express:** narrow @Headers string type to known request headers ([24184ed](https://github.com/jeremyben/reflet/tree/master/express/commit/24184ed))
* **express:** param decorator creator function, use it for our own param decorators ([0c2fca2](https://github.com/jeremyben/reflet/tree/master/express/commit/0c2fca2))
* **express:** register routes on app, common decorators ([6fbe988](https://github.com/jeremyben/reflet/tree/master/express/commit/6fbe988))
* **express:** route params decorators can be applied without invokation ([3250c3c](https://github.com/jeremyben/reflet/tree/master/express/commit/3250c3c))
