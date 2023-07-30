# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
