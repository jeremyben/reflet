# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](https://github.com/jeremyben/reflet/compare/@reflet/express@1.6.1...@reflet/express@2.0.0) (2023-07-30)


### Bug Fixes

* **express:** aconvenient types with each param decorator ([e3a86bf](https://github.com/jeremyben/reflet/commit/e3a86bf8a503e2fefe50f277517f20917758146b))
* **express:** allow Send.Dont to be applied without invokation ([c701586](https://github.com/jeremyben/reflet/commit/c701586e5d845a3b3d8bd5f73a61e055c0e8c7dc))
* **express:** bug with mutated middewares reference in Use decorator ([0622483](https://github.com/jeremyben/reflet/commit/0622483195510287a284dcd37edbe1cdb40ac39e))
* **express:** change final-handler signature for booleans ([e796dc1](https://github.com/jeremyben/reflet/commit/e796dc16de0cd9b6355bf494eb6c7e3bb890d144))
* **express:** change path constraint object to a tuple and unwrap RegistrationArray to Registration ([58cc9a2](https://github.com/jeremyben/reflet/commit/58cc9a2031af52ddccc8a4892b0a7f80a909c6ea))
* **express:** dedicated reflet express error ([ddf9c90](https://github.com/jeremyben/reflet/commit/ddf9c9053b40ce25abde535f1370cd0808f67e1a))
* **express:** easier and more flexible finalHandler ([32fb80f](https://github.com/jeremyben/reflet/commit/32fb80faa7803723055fb9bcb342e3c12df830da))
* **express:** improve internal errors ([8a90790](https://github.com/jeremyben/reflet/commit/8a907905eb0b5b4477f62fba263670840050e181))
* **express:** improve signature for param middleware deduplication ([3206e26](https://github.com/jeremyben/reflet/commit/3206e262f9ee53d8bf7bf71a617cfe613e04f9e8))
* **express:** make Router decorator mandatory ([1da8201](https://github.com/jeremyben/reflet/commit/1da82012fcb0807d6eb203456d9512d595b5f00f))
* **express:** more control for middleware deduplication in createParamDecorator ([18e6d41](https://github.com/jeremyben/reflet/commit/18e6d41bef340dc59cef6bafde7a64b951e8f4bd))
* **express:** more options to reveal error name and message ([1c0824c](https://github.com/jeremyben/reflet/commit/1c0824c7805d26a1a5c39c4201b7a44ea3f9949b))
* **express:** proper reflet error for sending response object ([16a7e50](https://github.com/jeremyben/reflet/commit/16a7e50fcd7bbef81ce2513f5d0eccab4ab1fdf4))
* **express:** remove deprecated APIs ([9097d60](https://github.com/jeremyben/reflet/commit/9097d601db62c0a7d014c2b48fadbb104cb07690))
* **express:** remove every "controller" word occurence ([c68bca8](https://github.com/jeremyben/reflet/commit/c68bca8b3b0b13b52c62f5b87118de03215d6071))
* **express:** remove generic from ClassOrMethodDecorator interface ([b450227](https://github.com/jeremyben/reflet/commit/b4502278fd8cb493e784090279e580dd3f9bb4e7))
* **express:** remove global error handler to avoid magic ([fd5a286](https://github.com/jeremyben/reflet/commit/fd5a2865d379d3069cef0be595d429ea4cebd3c9))
* **express:** remove need for reflect-metadata ([a0eea93](https://github.com/jeremyben/reflet/commit/a0eea9386011c14787d5722b775ff0c60e70cbdc))
* **express:** Remove way of registering childrens router in parent constructor ([002f551](https://github.com/jeremyben/reflet/commit/002f5510eed0b5e933142f8f914b1211ff044684))
* **express:** rename Method decorator to Route ([9425ee4](https://github.com/jeremyben/reflet/commit/9425ee4550b7892f75610e91dd579e157c7eebb3))
* **express:** rename reveal to expose in final handler options ([a3da648](https://github.com/jeremyben/reflet/commit/a3da648d8cc42b9467c471762c8452071400c401))
* **express:** ScopedMiddlewares out of Router namespace ([7987be4](https://github.com/jeremyben/reflet/commit/7987be44c25b84fa0b460eaee60a4d7139f4d8c9))
* **express:** send not detected on decorated application ([f8656d6](https://github.com/jeremyben/reflet/commit/f8656d6565187779dd629f3c4fd02482213830d7))
* **express:** simplify regex for json detection in final handler ([9ce7f5a](https://github.com/jeremyben/reflet/commit/9ce7f5a02594ce5b6424884dabcaa01deea8289c))
* **express:** throw an error if Router.Children are defined without Router ([da7a357](https://github.com/jeremyben/reflet/commit/da7a35792cf7e9d8bcc8631d4f04ea35b59efbc5))
* **express:** throw error on multiple param decorators overriding each other ([93081e5](https://github.com/jeremyben/reflet/commit/93081e5e7d2bc9eb1e78e32d12612b0cf2b98467))
* use reflet/http for header and status types ([3a1c362](https://github.com/jeremyben/reflet/commit/3a1c36206c0a9afd1e8315d2f15d7db8529c9f96))


### Features

* **express:** allow uppercase http method in Route decorator ([c890fc5](https://github.com/jeremyben/reflet/commit/c890fc51cf3e61873c91e130264cbe1b1a5e9713))
* **express:** custom handler for Send decorator ([36c5103](https://github.com/jeremyben/reflet/commit/36c5103b45cad3754a282edf9e4716e15d91bee3))
* **express:** custom status code for notFoundHandler ([2fd6d99](https://github.com/jeremyben/reflet/commit/2fd6d99eef47d0b48f330785aab600d3956e636e))
* **express:** decorator Router.ScopedMiddlewares ([6b46032](https://github.com/jeremyben/reflet/commit/6b46032d155b1a7f3da07a84bc4bdf4d6c2e1bbb))
* **express:** final handler ([4f08c3e](https://github.com/jeremyben/reflet/commit/4f08c3eb89bb17cd6ef60cf77cc28ab1309a650d))
* **express:** simpler and more flexible option to whitelist error properties in finalHandler ([800698d](https://github.com/jeremyben/reflet/commit/800698dc4883a1c283b62a4d5550d5b956b8f1ae))


### BREAKING CHANGES

* **express:** Send decorator no longer has status, nullStatus and undefinedStatus options.
* reflet/http is now a required peer dependency
* **express:** Path constraint in registration is no longer an object
* **express:** signature has changed from a single boolean to a full object for each middleware.
* **express:** Router decorator must be applied on routing classes
* **express:** overload of register method for chidren routers has been removed
* **express:** rename Controllers to RegistrationArray
* **express:** DontSend decorator and Router.register method are removed
* **express:** global error handler has been removed (no more automatic json detection in global errors)
* **express:** Method replaced by Route





## [1.6.1](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.6.0...@reflet/express@1.6.1) (2022-04-11)


### Bug Fixes

* **express:** bug with mutated middewares reference in Use decorator ([f77bbfd](https://github.com/jeremyben/reflet/tree/master/express/commit/f77bbfd))





# [1.6.0](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.5.3...@reflet/express@1.6.0) (2021-08-05)


### Bug Fixes

* **express:** application class mixin in node 14 and 16 ([396fcb8](https://github.com/jeremyben/reflet/tree/master/express/commit/396fcb85a9c7d948f8fde131fe8c28f6f06d295d))
* **express:** more flexible union signature in register ([b9d9780](https://github.com/jeremyben/reflet/tree/master/express/commit/b9d9780412d07ef0eb2221aa9646e6bc9bb85783))
* **express:** only wrap async functions instead of promisify everything ([2f2ffb6](https://github.com/jeremyben/reflet/tree/master/express/commit/2f2ffb6b5d1501d377af75832577a74be1673e8c))


### Features

* **express:** application class ([1baae1e](https://github.com/jeremyben/reflet/tree/master/express/commit/1baae1eff5570f2f0033a2a12a0a60b974566a5d))
* **express:** can decorate application class with Send ([d56195a](https://github.com/jeremyben/reflet/tree/master/express/commit/d56195a491a3f656b65a91dc59d28ff8031e950f))
* **express:** dynamic router ([10e8491](https://github.com/jeremyben/reflet/tree/master/express/commit/10e84917ed08fe1e81e57d6fa89e79faa0e4c70b))
* **express:** router children decorator ([b7fe72f](https://github.com/jeremyben/reflet/tree/master/express/commit/b7fe72f83b1509189b974f23b590816c30a6bea9))
* **express:** use same register function for child routers, deprecate the other one ([741ef76](https://github.com/jeremyben/reflet/tree/master/express/commit/741ef76dc1aa2d1fa404c0a03de759932eb7bba5))





## [1.5.3](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.5.2...@reflet/express@1.5.3) (2021-02-18)


### Bug Fixes

* **express:** deprecate DontSend, add Send.Dont ([f81e197](https://github.com/jeremyben/reflet/tree/master/express/commit/f81e197))
* **express:** detect headers in global error handler ([db2309e](https://github.com/jeremyben/reflet/tree/master/express/commit/db2309e))





## [1.5.2](https://github.com/jeremyben/reflet/tree/master/express/compare/@reflet/express@1.5.1...@reflet/express@1.5.2) (2021-02-12)


### Bug Fixes

* **express:** add generic to middleware decorator to augment request object ([9386992](https://github.com/jeremyben/reflet/tree/master/express/commit/9386992))
* **express:** allow handler to be property function ([34af031](https://github.com/jeremyben/reflet/tree/master/express/commit/34af031))
* **express:** can pass multiple http verbs to Method ([fabcf6a](https://github.com/jeremyben/reflet/tree/master/express/commit/fabcf6a))





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
