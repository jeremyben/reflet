# Migration guide for `@reflet/express-middlewares`

## From v1 to v2

* `UseSet` decorator has been removed.
  Simply use its alias `UseHeader`.

* `UseContentType` decorator has been removed.
  Simply use its alias `UseType`.

* `UseHeader` decorator has been renamed to `UseResponseHeader`.

* "@reflet/http" is now a required peer dependency.
  