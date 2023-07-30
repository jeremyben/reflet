# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.4.3...@reflet/mongoose@2.0.0) (2023-07-30)


### Bug Fixes

* **mongoose:** adapt types for mongoose 6 ([49da933](https://github.com/jeremyben/reflet/commit/49da933aa6c0c02e906bab27dc51d2bc9f8f1853))
* **mongoose:** allow null in Field default ([a658f1c](https://github.com/jeremyben/reflet/commit/a658f1c6fec6f783ce8d3e418482cf5b6f505bb8))
* **mongoose:** allow use of "ObjectId" string as SchemaType ([1d8c138](https://github.com/jeremyben/reflet/commit/1d8c13861208f8a721f3272e3f9cde1b525f9418))
* **mongoose:** apply multiple hooks in the order they are written ([dce45f3](https://github.com/jeremyben/reflet/commit/dce45f3bb9e58d245c8bbc5b7eb2bd9070e81343))
* **mongoose:** compatible typings for hooks ([e69f0c7](https://github.com/jeremyben/reflet/commit/e69f0c706a826c9f872dce63a7d2ba1a38ff56fe))
* **mongoose:** default option for Field.Schema decorator ([51075aa](https://github.com/jeremyben/reflet/commit/51075aa9243a0c2ca5c7b2253ff5a05aefbbfcba))
* **mongoose:** default option for nested discriminators ([46a63da](https://github.com/jeremyben/reflet/commit/46a63da4ae57943a9fdcd5abefe03f003d0bbebc))
* **mongoose:** export pipeline stage interface ([d835bae](https://github.com/jeremyben/reflet/commit/d835bae3e55c7e2ccda0ce20c2d2ea0d0bbf70bc))
* **mongoose:** field type for cast ([340dc2f](https://github.com/jeremyben/reflet/commit/340dc2fd5bfa0e500601e3061496d0f25d46768d))
* **mongoose:** fix inference in Field for mixed schema type ([3a43dd7](https://github.com/jeremyben/reflet/commit/3a43dd746c89fc29a986566e33fa8c9e7cb2371e))
* **mongoose:** hydrate signature ([b1e3383](https://github.com/jeremyben/reflet/commit/b1e3383acdfb07a304da7e3438eebf647d9c0a5c))
* **mongoose:** improve internal errors ([0f17814](https://github.com/jeremyben/reflet/commit/0f17814e8804404706307909666b924d741f4dcc))
* **mongoose:** improve typings of model interface ([4fb3f7b](https://github.com/jeremyben/reflet/commit/4fb3f7b302a9662f29b33ea5739caf9f239f6dbb))
* **mongoose:** improve typings of Virtual decorator ([8213214](https://github.com/jeremyben/reflet/commit/821321477841c2bc223ad667512a0636df07625a))
* **mongoose:** insertmany generic signature ([02ee3aa](https://github.com/jeremyben/reflet/commit/02ee3aaa757fc43ec4b53d83b3cab00c39113bb7))
* **mongoose:** minor stuffs ([5c3624c](https://github.com/jeremyben/reflet/commit/5c3624c4764cb5e0d4ad5442537c0795a09165d0))
* **mongoose:** missing post hook ([00d71ac](https://github.com/jeremyben/reflet/commit/00d71acc9f0452a317874cd4562bd50e1feb4ef4))
* **mongoose:** mongoose 6 model exists signature ([92cbdb4](https://github.com/jeremyben/reflet/commit/92cbdb48af5716800fbbee066c3fd8b96f7746e9))
* **mongoose:** populate signature ([dd63ca3](https://github.com/jeremyben/reflet/commit/dd63ca3cba55b6fe68b9d785c17dab2d0ddfe063))
* **mongoose:** remove deprecated methods ([f5fac16](https://github.com/jeremyben/reflet/commit/f5fac16284b8597c48d6e6dd6ebd5bf52e339f03))
* **mongoose:** remove need for reflect-metadata ([66c9df4](https://github.com/jeremyben/reflet/commit/66c9df4829567ce273ecb79b084eb4d6704b3a47))
* **mongoose:** rename PopulateVirtual to Virtual ([6dfe26f](https://github.com/jeremyben/reflet/commit/6dfe26f8daf7514d5821b9e17a1d09f9a65cfc9a))
* **mongoose:** required option for Field.Schema decorator ([4d1185c](https://github.com/jeremyben/reflet/commit/4d1185c2765e4d98187122af65cec5e2743500d4))
* **mongoose:** schemaFrom type ([b7908f4](https://github.com/jeremyben/reflet/commit/b7908f4809b97739735e26b18b7e7981864a0ee9))
* **mongoose:** simplify signatures of Model.I static methods ([589f0fa](https://github.com/jeremyben/reflet/commit/589f0fa9a1dba1da6e0e2d2371d0f234f8b8405c))
* **mongoose:** update to be compatible with mongoose 7 ([77ab502](https://github.com/jeremyben/reflet/commit/77ab5027e021334e50246b8de308a8b04bbd5255))
* **mongoose:** update to mongoose 5.12 ([c5aa506](https://github.com/jeremyben/reflet/commit/c5aa50641616dae132a5ef7f1809fdb40729b9b6))
* **mongoose:** use lean document from mongoose lib for Plain to avoid incompatible types ([92bfd90](https://github.com/jeremyben/reflet/commit/92bfd90d49e4579beb4951afa9f82af933a86647))
* **mongoose:** use pipeline interface directly from mongoose ([87c2982](https://github.com/jeremyben/reflet/commit/87c29825743fae9bc98dc11ee5075f193fafd17b))


### Features

* **mongoose:** add Field.Ref and Field.RefPath decorators ([d53d1a1](https://github.com/jeremyben/reflet/commit/d53d1a1789d4e89227738dd3db92df002f984e77))
* **mongoose:** add SchemaIndex decorator ([34327d6](https://github.com/jeremyben/reflet/commit/34327d641c757ac13a0c5b7b450ede933a40f80a))
* **mongoose:** add SchemaPlugin decorator ([3a2d201](https://github.com/jeremyben/reflet/commit/3a2d2017fb82e6e74a4c1649270f239430fadc86))
* **mongoose:** allow string for ObjectId with Plain.AllowString ([1f82e02](https://github.com/jeremyben/reflet/commit/1f82e02a91753396acdc8fc04e7d7c9981bd7dd2))
* **mongoose:** decorator Field.Enum and Field.ArrayOfEnum ([2814f8c](https://github.com/jeremyben/reflet/commit/2814f8c7edb797e2f126ce71e2ecf7151a67226b))
* **mongoose:** infer static method signatures from constructor ([04b42a9](https://github.com/jeremyben/reflet/commit/04b42a991aec306b5bb1e41d47ab2a607741f3ba))
* **mongoose:** merge or override schemaoptions in child classes ([47c9f82](https://github.com/jeremyben/reflet/commit/47c9f82e3d69758cc9c75360c454e60872de8796))
* **mongoose:** virtual property decorator ([b442b90](https://github.com/jeremyben/reflet/commit/b442b9064d810a3114ebef6f50a990a07a2d394a))


### BREAKING CHANGES

* **mongoose:** no longer compatible with mongoose 5 and 6
* **mongoose:** Model.I and Model.Interface no longer have callback signatures.
Use Model.ICb or Model.InterfaceWithCallback if you use callbacks.
* **mongoose:** Virtual is for simple virtuals, and Virtual.Populate is for populate virtuals
* **mongoose:** switch generics order of Virtual decorator signature
* **mongoose:** public decorator PopulateVirtual has been renamed
* **mongoose:** community types are no longer compatible
* **mongoose:** remove Pre, Post, Plain.Remove





## [1.4.3](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.4.2...@reflet/mongoose@1.4.3) (2021-03-11)


### Bug Fixes

* **mongoose:** static method types ([11f3c32](https://github.com/jeremyben/reflet/commit/11f3c3254f41491ecebce602f271a47cc51b29d7))





## [1.4.2](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.4.1...@reflet/mongoose@1.4.2) (2021-03-04)


### Bug Fixes

* **mongoose:** allow recursive embedded discriminators in arrays ([c3b37ff](https://github.com/jeremyben/reflet/commit/c3b37ff))
* **mongoose:** alternative decorator for schemaFrom ([fc47f28](https://github.com/jeremyben/reflet/commit/fc47f28))
* **mongoose:** better typing of field decorator ([4c0ff60](https://github.com/jeremyben/reflet/commit/4c0ff60))





## [1.4.1](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.4.0...@reflet/mongoose@1.4.1) (2021-01-07)


### Bug Fixes

* **mongoose:** improve Plain on different mongoose types ([1b95b79](https://github.com/jeremyben/reflet/commit/1b95b79))
* **mongoose:** Plain.PartialDeep, applied by default to create signature ([9050721](https://github.com/jeremyben/reflet/commit/9050721))





# [1.4.0](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.3.0...@reflet/mongoose@1.4.0) (2020-12-21)


### Features

* **mongoose:** global interfaces to augment model and document ([f9710da](https://github.com/jeremyben/reflet/commit/f9710da))





# [1.3.0](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.2.1...@reflet/mongoose@1.3.0) (2020-12-20)


### Bug Fixes

* **mongoose:** decorator order on inherited class like discriminator model ([10e13d3](https://github.com/jeremyben/reflet/commit/10e13d3))
* **mongoose:** mongoose peer dependency is narrowed to less than 5.11 because of type definitions breaking changes ([ac1a6eb](https://github.com/jeremyben/reflet/commit/ac1a6eb))
* **mongoose:** validator message typings ([deea0e6](https://github.com/jeremyben/reflet/commit/deea0e6))


### Features

* **mongoose:** kind decorator aliased as discriminatorkey ([f7ca7ec](https://github.com/jeremyben/reflet/commit/f7ca7ec))
* **mongoose:** union fields options: required and strict ([c591d61](https://github.com/jeremyben/reflet/commit/c591d61))





## [1.2.1](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.2.0...@reflet/mongoose@1.2.1) (2020-10-11)


### Bug Fixes

* **mongoose:** warn about wrong decorator order ([0489521](https://github.com/jeremyben/reflet/commit/0489521))





# [1.2.0](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.1.0...@reflet/mongoose@1.2.0) (2020-08-28)


### Bug Fixes

* **mongoose:** throw explicit error when root model is not decorated ([494c1ff](https://github.com/jeremyben/reflet/commit/494c1ff))


### Features

* **mongoose:** options for Plain, remove confusing generic from Model.Interface ([5dad855](https://github.com/jeremyben/reflet/commit/5dad855))





# [1.1.0](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.9...@reflet/mongoose@1.1.0) (2020-06-15)


### Bug Fixes

* **mongoose:** generic constraint for IModel constructor ([422f4b6](https://github.com/jeremyben/reflet/commit/422f4b6))


### Features

* **mongoose:** populate virtual decorator ([124014e](https://github.com/jeremyben/reflet/commit/124014e))





## [1.0.9](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.8...@reflet/mongoose@1.0.9) (2020-06-13)


### Bug Fixes

* **mongoose:** make Plain deep ([e8b0675](https://github.com/jeremyben/reflet/commit/e8b0675))
* **mongoose:** suffix hook decorators with Hook and deprecate former ([6ef33b6](https://github.com/jeremyben/reflet/commit/6ef33b6))





## [1.0.8](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.7...@reflet/mongoose@1.0.8) (2020-05-24)


### Bug Fixes

* **mongoose:** constructor is safer by default ([52192a4](https://github.com/jeremyben/reflet/commit/52192a4))
* **mongoose:** deprecate Plain.Without, add Plain.Omit ([d2a3ed9](https://github.com/jeremyben/reflet/commit/d2a3ed9))
* **mongoose:** improve model interface ([4f4ad31](https://github.com/jeremyben/reflet/commit/4f4ad31))





## [1.0.7](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.6...@reflet/mongoose@1.0.7) (2020-04-30)


### Bug Fixes

* **mongoose:** schematype options can be an array ([4c1350a](https://github.com/jeremyben/reflet/commit/4c1350a))





## [1.0.6](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.5...@reflet/mongoose@1.0.6) (2020-04-30)


### Bug Fixes

* remove esModuleInterop for better typing compatibility ([0987cc8](https://github.com/jeremyben/reflet/commit/0987cc8))





## [1.0.5](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.4...@reflet/mongoose@1.0.5) (2020-04-30)


### Bug Fixes

* **mongoose:** objectId schema type can be an array ([3cb827f](https://github.com/jeremyben/reflet/commit/3cb827f))





## [1.0.4](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.3...@reflet/mongoose@1.0.4) (2020-04-20)


### Bug Fixes

* **mongoose:** better schema type options autocompletion ([c397702](https://github.com/jeremyben/reflet/commit/c397702))





## [1.0.3](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.2...@reflet/mongoose@1.0.3) (2020-04-19)


### Bug Fixes

* **mongoose:** i-model typings in update methods ([1eb159a](https://github.com/jeremyben/reflet/commit/1eb159a))
* **mongoose:** proper array inference in Field decorator, fix validate option typings ([5651f0b](https://github.com/jeremyben/reflet/commit/5651f0b))





## [1.0.2](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.1...@reflet/mongoose@1.0.2) (2020-04-17)


### Bug Fixes

* **mongoose:** narrow type of model constructor parameter ([5a83a3b](https://github.com/jeremyben/reflet/commit/5a83a3b))





## [1.0.1](https://github.com/jeremyben/reflet/compare/@reflet/mongoose@1.0.0...@reflet/mongoose@1.0.1) (2020-04-16)


### Bug Fixes

* **mongoose:** fix inference on model static methods ([1f16382](https://github.com/jeremyben/reflet/commit/1f16382))
* improve Plain types ([77e1675](https://github.com/jeremyben/reflet/commit/77e1675))





# 1.0.0 (2020-04-07)


### Bug Fixes

* **mongoose:** remove discriminatorKey decorator, improve timestamps overwriting checks ([35e6f2f](https://github.com/jeremyben/reflet/commit/35e6f2f))
* **mongoose:** remove field.type decorator, rename field discriminators decorators, brand decorators ([12ffab4](https://github.com/jeremyben/reflet/commit/12ffab4))


### Features

* **mongoose:** allow model decorator to use a different mongoose connection ([3772b0e](https://github.com/jeremyben/reflet/commit/3772b0e))
* **mongoose:** dedicated global namespace to augment Field decorator ([4f3014f](https://github.com/jeremyben/reflet/commit/4f3014f))
* **mongoose:** embedded discriminators, kind decorator ([896280b](https://github.com/jeremyben/reflet/commit/896280b))
* **mongoose:** model and discriminator, schema options and callback and keys, field ([7a00239](https://github.com/jeremyben/reflet/commit/7a00239))
* **mongoose:** plain type helper ([bee36d0](https://github.com/jeremyben/reflet/commit/bee36d0))
* **mongoose:** pre and post hook decorators ([803aa6d](https://github.com/jeremyben/reflet/commit/803aa6d))
