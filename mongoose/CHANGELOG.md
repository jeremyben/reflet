# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.2.1...@reflet/mongoose@1.3.0) (2020-12-20)


### Bug Fixes

* **mongoose:** decorator order on inherited class like discriminator model ([10e13d3](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/10e13d3))
* **mongoose:** mongoose peer dependency is narrowed to less than 5.11 because of type definitions breaking changes ([ac1a6eb](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/ac1a6eb))
* **mongoose:** validator message typings ([deea0e6](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/deea0e6))


### Features

* **mongoose:** kind decorator aliased as discriminatorkey ([f7ca7ec](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/f7ca7ec))
* **mongoose:** union fields options: required and strict ([c591d61](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/c591d61))





## [1.2.1](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.2.0...@reflet/mongoose@1.2.1) (2020-10-11)


### Bug Fixes

* **mongoose:** warn about wrong decorator order ([0489521](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/0489521))





# [1.2.0](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.1.0...@reflet/mongoose@1.2.0) (2020-08-28)


### Bug Fixes

* **mongoose:** throw explicit error when root model is not decorated ([494c1ff](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/494c1ff))


### Features

* **mongoose:** options for Plain, remove confusing generic from Model.Interface ([5dad855](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/5dad855))





# [1.1.0](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.9...@reflet/mongoose@1.1.0) (2020-06-15)


### Bug Fixes

* **mongoose:** generic constraint for IModel constructor ([422f4b6](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/422f4b6))


### Features

* **mongoose:** populate virtual decorator ([124014e](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/124014e))





## [1.0.9](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.8...@reflet/mongoose@1.0.9) (2020-06-13)


### Bug Fixes

* **mongoose:** make Plain deep ([e8b0675](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/e8b0675))
* **mongoose:** suffix hook decorators with Hook and deprecate former ([6ef33b6](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/6ef33b6))





## [1.0.8](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.7...@reflet/mongoose@1.0.8) (2020-05-24)


### Bug Fixes

* **mongoose:** constructor is safer by default ([52192a4](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/52192a4))
* **mongoose:** deprecate Plain.Without, add Plain.Omit ([d2a3ed9](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/d2a3ed9))
* **mongoose:** improve model interface ([4f4ad31](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/4f4ad31))





## [1.0.7](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.6...@reflet/mongoose@1.0.7) (2020-04-30)


### Bug Fixes

* **mongoose:** schematype options can be an array ([4c1350a](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/4c1350a))





## [1.0.6](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.5...@reflet/mongoose@1.0.6) (2020-04-30)


### Bug Fixes

* remove esModuleInterop for better typing compatibility ([0987cc8](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/0987cc8))





## [1.0.5](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.4...@reflet/mongoose@1.0.5) (2020-04-30)


### Bug Fixes

* **mongoose:** objectId schema type can be an array ([3cb827f](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/3cb827f))





## [1.0.4](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.3...@reflet/mongoose@1.0.4) (2020-04-20)


### Bug Fixes

* **mongoose:** better schema type options autocompletion ([c397702](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/c397702))





## [1.0.3](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.2...@reflet/mongoose@1.0.3) (2020-04-19)


### Bug Fixes

* **mongoose:** i-model typings in update methods ([1eb159a](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/1eb159a))
* **mongoose:** proper array inference in Field decorator, fix validate option typings ([5651f0b](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/5651f0b))





## [1.0.2](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.1...@reflet/mongoose@1.0.2) (2020-04-17)


### Bug Fixes

* **mongoose:** narrow type of model constructor parameter ([5a83a3b](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/5a83a3b))





## [1.0.1](https://github.com/jeremyben/reflet/tree/master/mongoose/compare/@reflet/mongoose@1.0.0...@reflet/mongoose@1.0.1) (2020-04-16)


### Bug Fixes

* **mongoose:** fix inference on model static methods ([1f16382](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/1f16382))
* improve Plain types ([77e1675](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/77e1675))





# 1.0.0 (2020-04-07)


### Bug Fixes

* **mongoose:** remove discriminatorKey decorator, improve timestamps overwriting checks ([35e6f2f](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/35e6f2f))
* **mongoose:** remove field.type decorator, rename field discriminators decorators, brand decorators ([12ffab4](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/12ffab4))


### Features

* **mongoose:** allow model decorator to use a different mongoose connection ([3772b0e](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/3772b0e))
* **mongoose:** dedicated global namespace to augment Field decorator ([4f3014f](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/4f3014f))
* **mongoose:** embedded discriminators, kind decorator ([896280b](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/896280b))
* **mongoose:** model and discriminator, schema options and callback and keys, field ([7a00239](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/7a00239))
* **mongoose:** plain type helper ([bee36d0](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/bee36d0))
* **mongoose:** pre and post hook decorators ([803aa6d](https://github.com/jeremyben/reflet/tree/master/mongoose/commit/803aa6d))
