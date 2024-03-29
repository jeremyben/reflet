# Migration guide for `@reflet/mongoose`

## From v1 to v2

* Reflet/mongoose is no longer compatible with mongoose 5.x and community typings `@types/mongoose`.
  Upgrade to mongoose 7.

* Reflet/mongoose requires Typescript 4.2 at least.

* `PopulateVirtual` decorator has been renamed to `Virtual.Populate`.
  Its generics' order have also been switched: `Virtual.Populate<Local, Foreign>` instead of `Virtual.Populate<Foreign, Local>`

* Static methods of `Model.I` and `Model.interface` no longer have callback signatures.

* "reflect-metadata" is no longer needed as a peer dependency.
  