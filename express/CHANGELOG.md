# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.5.1](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.5.0...@reflet/express@1.5.1) (2021-01-05)


### Bug Fixes

* **express:** conflict with express router interface ([0e634bf](https://github.com/jeremyben/reflet/tree/master/express/commit/0e634bf))





# [1.5.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.4.0...@reflet/express@1.5.0) (2021-01-05)


### Bug Fixes

* **express:** could not call Router.register multiple times ([0eb8e34](https://github.com/jeremyben/reflet/tree/master/express/commit/0eb8e34))


### Features

* **express:** compatibility with plain express routers in register functions ([2218ddd](https://github.com/jeremyben/reflet/tree/master/express/commit/2218ddd))
* **express:** paths centralization and contraint ([e6a11ee](https://github.com/jeremyben/reflet/tree/master/express/commit/e6a11ee))





# [1.4.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.3.2...@reflet/express@1.4.0) (2020-12-20)


### Features

* **express:** expose all route decorators in Method namespace ([93713bf](https://github.com/jeremyben/reflet/tree/master/express/commit/93713bf))





## [1.3.2](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.3.1...@reflet/express@1.3.2) (2020-05-24)


### Bug Fixes

* **express:** shared middlewares are no longer mutated before being passed to children ([1c35488](https://github.com/jeremyben/reflet/tree/master/express/commit/1c35488))
* remove esModuleInterop for better typing compatibility ([0987cc8](https://github.com/jeremyben/reflet/tree/master/express/commit/0987cc8))





## [1.3.1](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.3.0...@reflet/express@1.3.1) (2020-04-28)


### Bug Fixes

* **express:** attach children routers after routes of parent routers ([323a2b1](https://github.com/jeremyben/reflet/tree/master/express/commit/323a2b1))
* **express:** class with dependencies should be instantiated ([8e6c89f](https://github.com/jeremyben/reflet/tree/master/express/commit/8e6c89f))
* **express:** temporary allow to register nested express routers, untyped and undocumented ([d2fe64f](https://github.com/jeremyben/reflet/tree/master/express/commit/d2fe64f))





# [1.3.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.2.0...@reflet/express@1.3.0) (2020-04-26)


### Features

* **express:** log 5xx errors ([9cef2ef](https://github.com/jeremyben/reflet/tree/master/express/commit/9cef2ef))
* **express:** register nested routers ([8eb76ad](https://github.com/jeremyben/reflet/tree/master/express/commit/8eb76ad))





# [1.2.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.1.0...@reflet/express@1.2.0) (2020-04-23)


### Features

* **express:** allow instances in register, for dependency injection ([553a446](https://github.com/jeremyben/reflet/tree/master/express/commit/553a446))





# [1.1.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.0.0...@reflet/express@1.1.0) (2020-04-07)


### Bug Fixes

* **express:** add node typings as peer dependency ([6284948](https://github.com/jeremyben/reflet/tree/master/express/commit/6284948))
* **express:** brand decorators ([c87b66d](https://github.com/jeremyben/reflet/tree/master/express/commit/c87b66d))
* **express:** instantiate controller to let access eventual properties ([a6f9b41](https://github.com/jeremyben/reflet/tree/master/express/commit/a6f9b41))
* **express:** rebrand decorators ([253d65a](https://github.com/jeremyben/reflet/tree/master/express/commit/253d65a))
* **express:** typings ([48744fd](https://github.com/jeremyben/reflet/tree/master/express/commit/48744fd))
* use distinct decorator types ([ee55013](https://github.com/jeremyben/reflet/tree/master/express/commit/ee55013))


### Features

* **express:** warn for controllers without route ([345b3e6](https://github.com/jeremyben/reflet/tree/master/express/commit/345b3e6))





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
