# Change Log

# [2.1.0](https://github.com/jeremyben/reflet/compare/@reflet/express-middlewares@2.0.0...@reflet/express-middlewares@2.1.0) (2026-10-30)


### Bug Fixes

* **express-middlewares:** apply UseIf middlewares one after the other ([cd8e25e](https://github.com/jeremyben/reflet/commit/cd8e25e0e6101540d734f398cf291c6805f78484))
* **express-middlewares:** call res.end callback when the transform throws ([b9a8fe8](https://github.com/jeremyben/reflet/commit/b9a8fe89f4becd4570abac1599c77822d6eaedf4))
* **express-middlewares:** don't intercept redirections ([d901a01](https://github.com/jeremyben/reflet/commit/d901a010106f194a9e1ba7d39a91aa1cb906185e))
* **express-middlewares:** forward errors of the original method after an async transform ([3652883](https://github.com/jeremyben/reflet/commit/36528838a6a943896a0f8a7ae06fce1fc26dbfa7))
* **express-middlewares:** forward rejected guards and interceptors to error handlers ([4f875d7](https://github.com/jeremyben/reflet/commit/4f875d77a6e04c29f8d3ed605d919e56010dd326))
* **express-middlewares:** forward synchronous transform errors in UseInterceptor ([126bea8](https://github.com/jeremyben/reflet/commit/126bea8c5a6814dde26795d197834f802840e4ed))
* **express-middlewares:** forward transform errors to route error handlers ([60dad4f](https://github.com/jeremyben/reflet/commit/60dad4f1c34112a0863ad44a329c5fa0fa864b22))
* **express-middlewares:** handle mixed chunk types when exposing body on finish ([1ecc0c1](https://github.com/jeremyben/reflet/commit/1ecc0c19b4a50b940dff617b766b37bf60c72a85))
* **express-middlewares:** keep express semantics of next in UseIf middlewares ([ccf58c2](https://github.com/jeremyben/reflet/commit/ccf58c2158f41e78e5bfad27782f25e17dadf155))
* **express-middlewares:** remove dependency on express-serve-static-core types ([99d25b9](https://github.com/jeremyben/reflet/commit/99d25b9b2eae7ee73f4eed68f428b27f47ccdca2))
* **express-middlewares:** require node 12 minimum ([5e564fb](https://github.com/jeremyben/reflet/commit/5e564fb41b41ac136d4c7fa6a78016f61907c59a))
* **express-middlewares:** treat falsy rejections as errors ([b2bc29f](https://github.com/jeremyben/reflet/commit/b2bc29f36c61a42b1fcbb0b366c67bb35865f5eb))

# [2.0.0](https://github.com/jeremyben/reflet/compare/@reflet/express-middlewares@1.1.10...@reflet/express-middlewares@2.0.0) (2023-07-30)


### Bug Fixes

* **express-middlewares:** add common extensions as shorthands for UseType decorator ([84b16cc](https://github.com/jeremyben/reflet/commit/84b16ccd56bb4cdc894102a40e9a0635b529cb04))
* **express-middlewares:** remove aliases ([429b0fd](https://github.com/jeremyben/reflet/commit/429b0fd07e39d2b06c5ecba8744af7db15f4d27a))
* **express-middlewares:** response readonly interface ([55c0cd5](https://github.com/jeremyben/reflet/commit/55c0cd54df4fbb27cfd4ecb02d56040bb2b12f54))
* **express-middlewares:** use response property writableEnded instead of deprecated finished ([92a9b38](https://github.com/jeremyben/reflet/commit/92a9b386f4c8d8f0fdf29cde7d519a498c85caed))
* **express:** remove need for reflect-metadata ([a0eea93](https://github.com/jeremyben/reflet/commit/a0eea9386011c14787d5722b775ff0c60e70cbdc))
* use reflet/http for header and status types ([3a1c362](https://github.com/jeremyben/reflet/commit/3a1c36206c0a9afd1e8315d2f15d7db8529c9f96))


### Features

* **express-middlewares:** add UseHeader.Append decorator ([dd208d7](https://github.com/jeremyben/reflet/commit/dd208d758c4583c5446471448785e56abb5e6096))


### BREAKING CHANGES

* reflet/http is now a required peer dependency
* **express-middlewares:** UseSet and UseContentType have been removed





## [1.1.10](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.9...@reflet/express-middlewares@1.1.10) (2021-08-05)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.9](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.8...@reflet/express-middlewares@1.1.9) (2021-02-18)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.8](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.7...@reflet/express-middlewares@1.1.8) (2021-02-12)


### Bug Fixes

* **express:** add generic to middleware decorator to augment request object ([9386992](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/9386992))
* **express-middlewares:** remove useless wasIntercepted property from interceptor decorator ([9988174](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/9988174))





## [1.1.7](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.6...@reflet/express-middlewares@1.1.7) (2021-01-05)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.6](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.5...@reflet/express-middlewares@1.1.6) (2021-01-05)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.5](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.4...@reflet/express-middlewares@1.1.5) (2020-12-20)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.4](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.3...@reflet/express-middlewares@1.1.4) (2020-05-24)


### Bug Fixes

* remove esModuleInterop for better typing compatibility ([0987cc8](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/0987cc8))





## [1.1.3](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.2...@reflet/express-middlewares@1.1.3) (2020-04-28)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.2](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.1...@reflet/express-middlewares@1.1.2) (2020-04-26)

**Note:** Version bump only for package @reflet/express-middlewares





## [1.1.1](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.1.0...@reflet/express-middlewares@1.1.1) (2020-04-23)

**Note:** Version bump only for package @reflet/express-middlewares





# [1.1.0](https://github.com/jeremyben/reflet/tree/master/express-middlewares/compare/@reflet/express-middlewares@1.0.0...@reflet/express-middlewares@1.1.0) (2020-04-07)


### Bug Fixes

* **express:** brand decorators ([c87b66d](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/c87b66d))
* **express:** typings ([48744fd](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/48744fd))
* use distinct decorator types ([ee55013](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/ee55013))
* **express:** add node typings as peer dependency ([6284948](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/6284948))
* **express-middlewares:** internal types for buffer encoding in useonfinish ([47fdf6e](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/47fdf6e))





# 1.0.0 (2019-10-03)


### Bug Fixes

* **express-middlewares:** catch errors in onfinish side effects ([5e3a1e9](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/5e3a1e9))


### Features

* **express-middlewares:** apply middewares condtionally with if decorator ([855b7f7](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/855b7f7))
* **express-middlewares:** handle authorization with guards decorator ([2cb1914](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/2cb1914))
* **express-middlewares:** manipulate response with interceptor decorator ([adc336e](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/adc336e))
* **express-middlewares:** modify response headers with set and type decorators ([588691d](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/588691d))
* **express-middlewares:** response side effects with onfinish decorator ([4b3f142](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/4b3f142))
* **express-middlewares:** response status decorator ([3ddab9c](https://github.com/jeremyben/reflet/tree/master/express-middlewares/commit/3ddab9c))
