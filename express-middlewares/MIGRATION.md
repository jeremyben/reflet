# Migration guide for `@reflet/express-middlewares`

## From v2 to v3

* Node.js 20 or later is required.

* Express 5 is supported alongside Express 4, and `@reflet/express` v3 is required.
  See the [`@reflet/express` migration guide](../express/MIGRATION.md#from-v2-to-v3).

* `UseOnFinish` callback is also called when the client closes the connection before the response is complete.
  Check `res.writableFinished` to only handle complete responses, as before:
  ```ts
  @UseOnFinish((req, res) => {
    if (!res.writableFinished) return
    // ...
  })
  ```

## From v1 to v2

* `UseSet` decorator has been removed.
  Simply use its alias `UseHeader`.

* `UseContentType` decorator has been removed.
  Simply use its alias `UseType`.

* `UseHeader` decorator has been renamed to `UseResponseHeader`.

* "@reflet/http" is now a required peer dependency.
  