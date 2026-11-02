
# `@reflet/env` 🌱

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

Well-defined and well-typed environment variables decorators. Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* **One class** declares your variables, their types, defaults and documentation.
* **All variables are validated at once**, at startup, with a single error listing every problem.
* **Typed values**: numbers, booleans, URLs, durations, sizes, paths, lists, JSON or your own parsers, checked against the property types.
* **Secrets kept out of logs**, masked in errors and serialization, and read from secret files (systemd credentials, Docker secrets).

* [Getting started](#getting-started)
* [Basic usage](#basic-usage)
* [Types](#types)
* [Defaults](#defaults)
* [Common options](#common-options)
* [Sensitive values and secrets](#sensitive-values-and-secrets)
* [Groups](#groups)
* [Cross checks](#cross-checks)
* [Derived values](#derived-values)
* [Checking an environment](#checking-an-environment)
* [Errors](#errors)
* [Inheritance](#inheritance)

## Getting started

1. Enable experimental decorators in TypeScript compiler options.<br>_No need to install "reflect-metadata"._

    ```json
    "experimentalDecorators": true,
    ```

2. Install the package (Node.js 20 or later), along with Node.js types.

    ```sh
    npm i @reflet/env
    npm i -D @types/node
    ```

3. Declare your environment variables.

    ```ts
    // env.ts
    import { Var, Environment, Sensitive } from '@reflet/env'

    export class Env extends Environment {
      @Var.Str({ choices: ['development', 'production', 'test'] })
      NODE_ENV!: 'development' | 'production' | 'test'

      @Var.Port()
      PORT = 3000

      @Sensitive()
      @Var.Url({ desc: 'Main database' })
      DATABASE_URL!: string
    }

    export const env = Env.load()
    ```

4. Use them anywhere, fully typed.

    ```ts
    // main.ts
    import { env } from './env'

    app.listen(env.PORT)
    ```

## Basic usage

> 🔦 `@Var.Str(options?)`<br>
> 🔦 `Environment.load(source?)`

```ts
import { Var, Environment } from '@reflet/env'

class Env extends Environment {
  @Var.Str()
  API_KEY!: string

  @Var.Bool()
  DEBUG = false // default value
}

const env = Env.load() // validates process.env by default.

env.API_KEY // string
env.DEBUG // boolean
```

`load` validates **all** variables at once, and returns a **frozen** instance of your class with parsed values assigned to its properties.

* Variables are required by default.
* An empty string is considered missing, as well as a whitespace-only one for all types except `Str` and `Custom`.
* `Json` and `List` values are deeply frozen too. Defaults are copied first, through JSON for `Json` values, so your own objects are left untouched (and must be JSON-serializable: a `Date` becomes a string).
* Any missing or invalid variable throws an aggregated [`EnvValidationError`](#errors).

💡 You can pass another source than `process.env`, which is useful in tests:

```ts
const env = Env.load({ API_KEY: 'abc', DEBUG: 'true' })
```

### Loading a `.env` file

No need for [dotenv](https://github.com/motdotla/dotenv): Node.js reads `.env` files natively. In each case, variables already set in the environment take precedence over the file.

* With the [`--env-file`](https://nodejs.org/api/cli.html#--env-fileconfig) option, without any code (or `--env-file-if-exists` for an optional file):

  ```sh
  node --env-file=.env main.js
  ```

* With [`process.loadEnvFile`](https://nodejs.org/api/process.html#processloadenvfilepath), which adds the file variables to `process.env`:

  ```ts
  process.loadEnvFile('.env')
  export const env = Env.load()
  ```

* With [`util.parseEnv`](https://nodejs.org/api/util.html#utilparseenvcontent) as source, which leaves `process.env` untouched, so the file variables are not inherited by child processes:

  ```ts
  import { readFileSync } from 'fs'
  import { parseEnv } from 'util'

  export const env = Env.load({ ...parseEnv(readFileSync('.env', 'utf8')), ...process.env })
  ```

  ⚠️ The source is a copy of `process.env`, so [`@UnsetSensitive`](#sensitive-values) does not remove anything from it.

💡 In production, prefer [secret files](#secret-files) for secrets.

### Always validated

The constructor of `Environment` is protected, so you can't get an environment that has not been validated:

```ts
const env = new Env() // ❌ Type error: use Env.load()
```

### Optional variables

> 🔦 `optional: true`

Variables are required by default. An optional one is `undefined` when missing:

```ts
class Env extends Environment {
  @Var.Url({ optional: true })
  SENTRY_DSN?: string
}
```

The property must be optional (`?`), since it can be `undefined`: this is enforced by types. A variable with a [default value](#defaults) is never missing, so it doesn't need to be optional.

## Types

| Decorator | Type | Accepted values | Specific options |
| --- | --- | --- | --- |
| `@Var.Str(options?)` | `string` | Any non-empty string, kept as is. | `pattern`, `minLength`, `maxLength`, `allowEmpty` |
| `@Var.Num(options?)` | `number` | Decimal numbers, e.g. `42`, `-1.5`, `.5`, `1e3`. Hexadecimal, `Infinity`, overflowing values (`1e400`) and the like are rejected. | `min`, `max`, `int` |
| `@Var.Bool(options?)` | `boolean` | `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` (case insensitive). | |
| `@Var.Port(options?)` | `number` | Integers from `1` to `65535`. | `min`, `max` |
| `@Var.Url(options?)` | `string` | Absolute URLs with a `scheme://`, e.g. `https://example.com`, `postgres://user@db:5432/app`.<br>`localhost:3000` is rejected. | `protocols`, e.g. `['https']` |
| `@Var.Email(options?)` | `string` | Email addresses. | |
| `@Var.Host(options?)` | `string` | Hostnames (underscores allowed, e.g. container names), IPv4, and IPv6 addresses (bracketed or not). | |
| `@Var.Json<T>(options?)` | `T` | Valid JSON. | |
| `@Var.Duration(options?)` | `number` | Durations in milliseconds, with units `ms`, `s`, `m`, `h`, `d`, e.g. `500ms`, `30s`, `1h30m`. | `min`, `max` |
| `@Var.Size(options?)` | `number` | Sizes in bytes, with decimal or binary units, e.g. `512`, `10MB`, `1GiB`. | `min`, `max` |
| `@Var.Bytes(options?)` | `Buffer` | Bytes of the value, in `utf8`, `hex`, `base64` or `base64url` encoding. | `encoding`, `length`, `minLength`, `maxLength` |
| `@Var.File(options?)` | `string` | Path of an existing file, resolved to an absolute path. | `base`, `readable`, `writable` |
| `@Var.Dir(options?)` | `string` | Path of an existing directory, resolved to an absolute path. | `base`, `readable`, `writable` |
| `@Var.List(item?, options?)` | `T[]` | Values separated by commas, each parsed by the `item` type, built-in (e.g. `Var.Port`) or [custom](#custom-parser) (strings by default). Separators only are a missing value. | `separator`, `allowEmpty` |
| `@Var.Custom(parser, options?)` | `T` | Values parsed by [your own parser](#custom-parser). | `allowEmpty` |

Surrounding whitespace is trimmed for all types except `Str` and `Custom`. Every type also takes the [common options](#common-options).

### Type safety

Decorators check that the property can hold the parsed value:

```ts
class Env extends Environment {
  @Var.Port()
  PORT!: string // ❌ Type error: a port is a number.

  @Var.Str()
  LOG_FORMAT!: 'json' | 'text' // ❌ Type error: any string could be given.

  @Var.Str({ choices: ['debug', 'info', 'error'] })
  LOG_LEVEL!: 'debug' | 'info' | 'error' // ✅ Narrowed by choices.

  @Var.Str<'json' | 'text'>()
  FORMAT!: 'json' | 'text' // ❌ Type error: narrowing requires choices, checked at runtime.

  @Var.Json<{ retries: number }>()
  RETRY_POLICY!: { retries: number } // ✅ JSON is untyped unless a type parameter is given.
}
```

⚠️ Decorated properties must be public instance properties: static properties, methods and accessors are rejected.<br>
A symbol property needs a [`name`](#name) option.

### Constraints

> 🔦 `pattern`, `minLength`, `maxLength`, `min`, `max`, `int`

```ts
class Env extends Environment {
  @Var.Str({ pattern: /^sk_live_/ })
  API_KEY!: string // e.g. rejects a test key in production.

  @Var.Str({ minLength: 32 })
  COOKIE_SECRET!: string

  @Var.Num({ min: 1, max: 64, int: true })
  WORKERS = 4

  @Var.Port({ min: 1024 })
  PORT = 3000
}
```

`pattern`, `minLength` and `maxLength` (in characters) are available on `Str`, and `min`, `max` (both included) and `int` on `Num` and `Port`. Defaults are checked as well.

### Lists

> 🔦 `@Var.List(item?, options?)`

Surrounding whitespace and empty items are removed, and items are parsed by another variable type:

```ts
class Env extends Environment {
  @Var.List()
  ALLOWED_ORIGINS!: string[] // ALLOWED_ORIGINS=https://a.com, https://b.com

  @Var.List(Var.Port)
  PORTS!: number[] // PORTS=80,443

  @Var.List(Var.Email, { separator: ';' })
  ADMINS: string[] = ['admin@example.com']
}
```

An invalid item is reported with its index among non-empty items, e.g. `"PORTS[1]" must be a valid port number (1-65535)`.

### Durations and sizes

> 🔦 `@Var.Duration({ min?, max? })`, `@Var.Size({ min?, max? })`

Durations are converted to milliseconds, and sizes to bytes:

```ts
class Env extends Environment {
  @Var.Duration({ max: '1h' })
  TIMEOUT = 30_000 // TIMEOUT=45s, or 1m30s, or 0.5h

  @Var.Size({ max: '1GB' })
  UPLOAD_LIMIT = 10_000_000 // UPLOAD_LIMIT=50MB, or 512KiB
}
```

* Duration units are `ms`, `s`, `m`, `h` and `d` (lowercase, each one once), combined (`1h30m`) or with decimals (`1.5d`). A plain number is rejected, since its unit would be ambiguous, except `0`.
* Mind that `setTimeout` and `setInterval` delays are limited to about 24.8 days.
* Size units are decimal (`KB` = 1000 bytes, `MB`, `GB`, `TB`) or binary (`KiB` = 1024 bytes, `MiB`, `GiB`, `TiB`), case insensitive, each one once, combined (`1GB500MB`) or with decimals (`1.5GiB`). A plain number is in bytes.
* Defaults are in milliseconds or bytes, and `min` and `max` take either a number or units, e.g. `'1h'` or `'1GB'`.

### Bytes

> 🔦 `@Var.Bytes({ encoding?, length?, minLength?, maxLength? })`

Bytes of a string as a `Buffer`, e.g. a cryptographic key. Lengths are in bytes, and the encoding (`utf8` by default) is checked strictly:

```ts
class Env extends Environment {
  @Sensitive()
  @Var.Bytes({ encoding: 'hex', length: 32 })
  CIPHER_KEY!: Buffer // CIPHER_KEY=$(openssl rand -hex 32)

  @Sensitive()
  @Var.Bytes({ minLength: 32 })
  HMAC_SECRET!: Buffer
}
```

💡 The type parameter narrows the buffer type without check, e.g. to a branded type: `@Var.Bytes<MyKey>()`.

### Files and directories

> 🔦 `@Var.File({ base?, readable?, writable? })`, `@Var.Dir({ base?, readable?, writable? })`

Paths are resolved to absolute paths, and checked to exist, as a file or a directory, readable or writable if required:

```ts
class Env extends Environment {
  @Var.Dir({ base: join(__dirname, '..'), writable: true })
  UPLOADS_DIR = 'uploads' // e.g. /app/uploads

  @Var.File({ readable: true })
  TLS_CERT_PATH!: string
}
```

* Relative paths are resolved from `base`, the current directory by default, which depends on where the app is started. Absolute paths are kept as is.
* `~` is not expanded, unlike in shells.
* Directories must be searchable as well, to be readable or writable.
* Error messages don't repeat the resolved path: the value is shown as for other variables, unless [sensitive](#sensitive-values).
* Defaults are checked as well, when the environment is loaded only: later permission changes are not detected, and the root user bypasses permissions.

### Custom parser

> 🔦 `@Var.Custom(parser, options?)`

Provide your own parser to coerce the raw string. Throw to signal an invalid value, and return the value (`null` included, but not `undefined`). Parsers are typed by `Parser<T>`, and their steps by `Parser.Coercer<T>` and `Parser.Validator<T>`.

```ts
class Env extends Environment {
  @Var.Custom((raw, name) => {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) throw new Error(`"${name}" must be a date`)
    return date
  })
  LAUNCH_DATE!: Date
}
```

💡 Built-in parsers can be reused, e.g. `Var.Port.parse(raw, name)`.

Parsing has two steps: `coerce` turns the raw string into the type, and `validate` checks the typed value (and may normalize it). Environment values go through both, [defaults](#defaults) only through `validate`. To validate defaults of a custom variable as well, give both steps, or only `validate` for a string:

```ts
class Env extends Environment {
  @Var.Custom({
    coerce: (raw) => new Date(raw),
    validate: (date, name) => {
      if (Number.isNaN(date.getTime())) throw new Error(`"${name}" must be a date`)
      return date
    },
  })
  LAUNCH_DATE = new Date('2030-01-01') // validated as well

  @Var.Custom({
    validate: (code, name) => {
      if (!/^[A-Z]{2}$/.test(code)) throw new Error(`"${name}" must be a country code`)
      return code
    },
  })
  COUNTRY = 'FR' // a string, validated as well
}
```

To reuse a parser in several places, declare it as a `Parser`, and give it to `Var.Custom`, or to `Var.List` for list items:

```ts
import { Parser } from '@reflet/env'

export const date: Parser<Date> = {
  coerce: (raw) => new Date(raw),
  validate: (value, name) => {
    if (Number.isNaN(value.getTime())) throw new Error(`"${name}" must be a date`)
    return value
  },
}

class Env extends Environment {
  @Var.Custom(date)
  LAUNCH_DATE = new Date('2030-01-01')

  @Var.List(date)
  HOLIDAYS: Date[] = []
}
```

## Defaults

> 🔦 property initializer

Default values are property initializers, used when a variable is missing (or empty). They also let TypeScript infer the property type:

```ts
class Env extends Environment {
  @Var.Port()
  PORT = 3000
}
```

* Defaults are validated like environment values (e.g. `PORT = 99999` is invalid), but not coerced, since they are already typed: a default `' localhost '` is not trimmed, and `PORT = '3000'` is not a number.
* Defaults of [custom variables](#custom-parser) are only validated with a `validate` step.
* A `null` or `undefined` initializer is not a default.
* A subclass can override an inherited default with its own initializer.

### Environment-specific defaults

> 🔦 `Default.byNodeEnv(values)`, `Default.by(variable)`

`Default` computes a default by environment, in the initializer. An `undefined` value is not a default, so the variable is **required** in this environment:

```ts
import { Var, Environment, Sensitive, Default } from '@reflet/env'

class Env extends Environment {
  @Sensitive()
  @Var.Str()
  STRIPE_KEY = Default.byNodeEnv({ development: 'fake', test: 'fake' }) // required in production

  @Var.Bool()
  MONGO_TLS = Default.byNodeEnv({ production: true, default: false })

  @Var.Url()
  APP_ORIGIN = Default.byNodeEnv({ development: 'http://localhost:4000', test: 'http://localhost:4000' }) // required in production
}
```

* `Default.byNodeEnv` picks the value of the current `NODE_ENV`, or else `default`. A value given for an environment takes precedence over `default`, even `undefined`.
* Environment names (`development`, `production` and `test`) are checked by types, as well as the value types.
* `NODE_ENV` is read from the source being loaded, `process.env` by default, and defaults picked are validated as usual.
* Only the variable as given in the source is read, not the property of your class: its default, [other names](#name) and [secret files](#secret-files) are ignored. So don't give `NODE_ENV` a default if you pick defaults by it.

Deployment stages (e.g. staging) are better in another variable than `NODE_ENV`, which is expected to be `production` by libraries wherever traffic is served. `Default.by` creates a picker by another variable, whose values are listed by the type parameter (it also allows other `NODE_ENV` values):

```ts
const byAppEnv = Default.by<'local' | 'staging' | 'production'>('APP_ENV')

class Env extends Environment {
  @Var.Host()
  MAIL_DOMAIN = byAppEnv({ production: 'example.com', default: 'staging.example.com' })
}
```

Environments can also be given their own values, without defaults in the code:

* Load a `.env` file per environment before calling `load`, [natively](#loading-a-env-file) (e.g. `node --env-file=.env.development`), or with your framework (e.g. `.env.development`, `.env.test` with Next.js or Vite).
* In tests, pass an explicit source, or override defaults in a subclass:

```ts
const env = Env.load({ API_TOKEN: 'fake-token' })

class TestEnv extends Env {
  API_TOKEN = 'fake-token'
}
const testEnv = TestEnv.load({})
```

## Common options

Every variable type takes these options.

### Choices

> 🔦 `choices`

Restricts the parsed value to one of the given choices:

```ts
class Env extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  @Var.Num({ choices: [1, 2, 4] })
  WORKERS!: number
}
```

### Name

> 🔦 `name`

The variable name defaults to the property key. Override it to use another property name:

```ts
class Env extends Environment {
  @Var.Port({ name: 'APP_PORT' })
  port!: number
}
```

With several names, the first one set is used, e.g. to rename a variable without breaking existing deployments:

```ts
class Env extends Environment {
  @Var.Url({ name: ['DATABASE_URL', 'DB_URL'] })
  DATABASE_URL!: string
}
```

### Empty values

> 🔦 `allowEmpty`

An empty value (`VAR=`) is considered missing by default. With `allowEmpty`, it is a value, e.g. an empty prefix or an empty list:

```ts
class Env extends Environment {
  @Var.Str({ allowEmpty: true })
  PREFIX = 'app' // PREFIX= gives '', a missing PREFIX gives 'app'.

  @Var.List(Var.Url, { allowEmpty: true })
  ALLOWED_ORIGINS = ['https://example.com'] // ALLOWED_ORIGINS= gives [].
}
```

`allowEmpty` is available on `Str`, `List` and `Custom`, since an empty value is never valid for the other types. An empty value then stops the lookup of [other names](#name) and [secret files](#secret-files).

### Validate

> 🔦 `validate: (value, name) => value`

Add your own validation to any type, after the one of the type itself and its [choices](#choices), for environment values and [defaults](#defaults) alike. Return the value, possibly normalized, or throw to signal an invalid value:

```ts
class Env extends Environment {
  @Var.Url({
    validate: (url, name) => {
      if (!url.endsWith('/api')) throw new Error(`"${name}" must end with /api`)
      return url
    },
  })
  API_URL = 'https://example.com/api'

  @Var.Str({ validate: (mode) => mode.toLowerCase() })
  MODE = 'remote'
}
```

To check variables against each other, use [cross checks](#cross-checks).

### Documentation

> 🔦 `desc`, `docs`

A description and a documentation URL are included in [error messages](#errors), to help whoever is setting up the environment:

```ts
class Env extends Environment {
  @Var.Str({
    desc: 'Key for the payment provider',
    docs: 'https://example.com/docs/payments#api-keys',
  })
  PAYMENT_API_KEY!: string
}
```

## Sensitive values and secrets

### Sensitive values

> 🔦 `@Sensitive({ reveal? })`

By default, error messages show the invalid value (e.g. `"PORT" must be a valid port number (1-65535) (got "99999")`).<br>
Mark secrets with `@Sensitive` to keep them out of your logs: they are left out of error messages, and masked when logging or serializing the environment.

```ts
import { Var, Environment, Sensitive } from '@reflet/env'

class Env extends Environment {
  @Var.Port()
  PORT = 3000

  @Sensitive()
  @Var.Url()
  DATABASE_URL!: string // may contain credentials.
}

const env = Env.load()

env.DATABASE_URL // the actual value
console.log(env) // Env { PORT: 3000, DATABASE_URL: '***' }
JSON.stringify(env) // {"PORT":3000,"DATABASE_URL":"***"}
```

Applied to the class, `@Sensitive()` marks every variable as sensitive, except `NODE_ENV`, which is read by libraries and never sensitive.

To check that the right value was given, `reveal` shows its last characters, in logs and error messages:

```ts
class Env extends Environment {
  @Sensitive({ reveal: 4 })
  @Var.Str({ pattern: /^sk_live_/ })
  STRIPE_PRIVATE_KEY!: string
}

console.log(Env.load()) // Env { STRIPE_PRIVATE_KEY: '***4242' }
// - STRIPE_PRIVATE_KEY (invalid): "STRIPE_PRIVATE_KEY" must match /^sk_live_/ (got "***4242")
```

* Only reveal long random values, like API keys: never passwords, nor URLs with credentials.
* Values shorter than 4 times the revealed characters are fully masked, as well as values other than strings and bytes (shown in hexadecimal).

💡 Credentials of URLs are masked in error messages even when not sensitive, e.g. `postgres://***@db/app`, in any variable.

⚠️ Custom parsers and `validate` options are responsible for not leaking the value in their own error messages, and values read from the environment (e.g. `{ ...env }`, or a getter returning a secret) are not masked.

### Unset sensitive variables

> 🔦 `@UnsetSensitive()`

With `@UnsetSensitive()`, sensitive variables are removed from `process.env` once the environment is loaded from it, so they are not inherited by child processes, nor dumped by other code. An explicit source (e.g. in tests, or a copy of `process.env` merged with a `.env` file) is left untouched:

```ts
@UnsetSensitive()
class Env extends Environment {
  @Sensitive()
  @Var.Str()
  STRIPE_PRIVATE_KEY!: string
}

const env = Env.load()
process.env.STRIPE_PRIVATE_KEY // undefined
```

* Variables are only removed once the environment is valid: after an `EnvValidationError`, they are left in `process.env`.
* Load the environment once, e.g. in a module exporting it: a second `load`, or another environment class reading the same variables, would find them missing.
* Subclasses inherit the decorator.

💡 Better yet, pass secrets as [files](#secret-files): they never go through the environment.

### Secret files

> 🔦 `@Secrets(directory | directories)`

Secrets are better passed as files than environment variables, which are inherited by child processes and easily leaked. Variables can be read from **secret files named like them**, in the directory or directories given to the `@Secrets` decorator.

#### systemd credentials

[systemd credentials](https://systemd.io/CREDENTIALS/) are files in the `$CREDENTIALS_DIRECTORY` of the service. Name the credential IDs like your variables:

```ini
# myapp.service
[Service]
LoadCredential=DB_PASSWORD:/etc/myapp/db-password
LoadCredentialEncrypted=API_TOKEN:/etc/credstore.encrypted/api-token
ExecStart=/usr/bin/node /opt/myapp/main.js
```

```ts
import { Var, Environment, Secrets, Sensitive } from '@reflet/env'

@Secrets(process.env.CREDENTIALS_DIRECTORY) // undefined, hence ignored, outside of systemd.
@Sensitive()
class Env extends Environment {
  @Var.Str()
  DB_PASSWORD!: string

  @Var.Str()
  API_TOKEN!: string
}

const env = Env.load()
```

#### Docker, Kubernetes and others

Give the directory of secret files, e.g. `/run/secrets` for Docker and Compose secrets, or a mounted Kubernetes secret volume. With an array of directories, the first non-empty file found is used:

```ts
@Secrets([process.env.CREDENTIALS_DIRECTORY, '/run/secrets'])
class Env extends Environment {
  @Sensitive()
  @Var.Str()
  DB_PASSWORD!: string
}
```

#### Rules

* Secret files are only read from the given directories: `$CREDENTIALS_DIRECTORY` is not looked up implicitly, since it is also inherited by child processes.
* Environment variables take precedence over secret files.
* Applied to a property, `@Secrets` overrides the directories of the class for this variable, e.g. none with `@Secrets([])`.
* Subclasses inherit the directories, unless they define their own, e.g. none in tests with `@Secrets([])`.
* With [several names](#name), each one is looked up as a file name, e.g. `name: ['DB_PASSWORD', 'db-password']`.
* A single trailing newline is removed from file contents (e.g. written by `echo`), which are then parsed as usual.
* Empty files are skipped for the next directory or name (unless [`allowEmpty`](#empty-values)), and an unreadable file is reported in the [`EnvValidationError`](#errors).
* Values read from files are left out of error messages (unless [revealed](#sensitive-values)). Mark them as [`@Sensitive`](#sensitive-values) to mask them in logs as well.
* The closest class defining directories wins, on the property first, then on the class itself: `@Secrets([])` on a subclass overrides the directories of its parents.

## Groups

> 🔦 `@Group.AllOrNone(...)`, `@Group.OneOf(...)`, `@Group.AnyOf(...)`, `@Group.RequiredWhen(flag, [...])`

Rules on the presence of a group of optional variables:

```ts
@Group.AllOrNone('S3_ACCESS_KEY', 'S3_SECRET_KEY')  // all set, or none
@Group.OneOf('MONGO_URL', 'MONGO_HOST')             // exactly one set
@Group.AnyOf('SMTP_URL', 'MAIL_API_KEY')            // at least one set
@Group.RequiredWhen('SENTRY_ENABLED', ['SENTRY_DSN']) // required when the boolean flag is true
class Env extends Environment {
  @Var.Str({ optional: true }) S3_ACCESS_KEY?: string
  @Var.Str({ optional: true }) S3_SECRET_KEY?: string
  @Var.Url({ optional: true }) MONGO_URL?: string
  @Var.Host({ optional: true }) MONGO_HOST?: string
  @Var.Url({ optional: true }) SMTP_URL?: string
  @Var.Str({ optional: true }) MAIL_API_KEY?: string
  @Var.Bool() SENTRY_ENABLED = false
  @Var.Url({ optional: true }) SENTRY_DSN?: string
}
// Possible errors:
// - S3_SECRET_KEY (missing): required together with S3_ACCESS_KEY
// - MONGO_URL (missing): one of MONGO_URL, MONGO_HOST is required (when none is set)
// - MONGO_HOST (invalid): only one of MONGO_URL, MONGO_HOST can be set (when both are)
// - SMTP_URL (missing): at least one of SMTP_URL, MAIL_API_KEY is required
// - SENTRY_DSN (missing): required when SENTRY_ENABLED
```

* Variables of a group must be optional, without default value (which would always count as set), and the flag of `RequiredWhen` a `Var.Bool` variable. Property names are checked by types, without annotation. A default picked by environment (e.g. with `Default.byNodeEnv`) is only detected in the environments where it applies.
* Rules are checked in declaration order, unless a variable of the group is invalid. Subclasses inherit them.
* For other conditions, e.g. on the value of a variable, use [cross checks](#cross-checks).

## Cross checks

> 🔦 `@CrossCheck((env, fail) => void)`

Check variables against each other, e.g. to forbid a development value in production. Errors are reported in an [`EnvValidationError`](#errors):

```ts
@CrossCheck((env: Env, fail) => {
  if (env.NODE_ENV === 'production' && env.STRIPE_KEY === 'fake') {
    fail('STRIPE_KEY', 'cannot be fake in production')
  }
})
class Env extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  @Sensitive()
  @Var.Str()
  STRIPE_KEY = Default.byNodeEnv({ development: 'fake', test: 'fake' })
}
// - STRIPE_KEY (invalid): cannot be fake in production
```

* Checks run once all variables are valid, on the frozen environment (getters included). They must be synchronous.
* The environment is frozen shallowly (deeply for `Json` and `List` values): a check could still change the bytes of a `Buffer`, for instance.
* `fail` takes a property, reported by its variable name, with its `desc` and `docs`. Unlike a `throw` in a [`validate`](#validate) option, which concerns a single variable, it tells which variable is at fault, and can report several errors in one check. A `throw` is still reported, under the class name.
* Several checks can be applied, run in declaration order, and subclasses inherit them (parents' first).
* Annotate the parameter with your class, so it is checked against the decorated class, as well as the properties given to `fail`.

## Derived values

Derive values from your variables with plain getters, e.g. flags of `NODE_ENV`: there are no built-in `isProduction`-like flags, so you define the ones you need, with your own semantics.

```ts
class Env extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  @Var.Host()
  HOST!: string

  @Var.Port()
  PORT = 3000

  get isProduction() {
    return this.NODE_ENV === 'production'
  }

  get BASE_URL() {
    return `http://${this.HOST}:${this.PORT}`
  }
}

const env = Env.load()

if (env.isProduction) {
  app.set('trust proxy', 1)
}
```

* Getters are evaluated on access, and don't show up in serialization. They can be used in [cross checks](#cross-checks).
* A plain property without decorator is computed once, when the environment is loaded (e.g. `readonly commitHash = this.readCommitHash()`), but before the variables are validated, so it can't depend on them.

## Checking an environment

Since `Env.load()` runs when your env module is imported, importing it is enough to check an environment (e.g. a `.env` file during a deployment) without starting your application. It exits with code `1` and the list of errors when the environment is invalid:

```sh
# TypeScript sources, with tsx
npx tsx --env-file=.env src/env.ts

# Compiled code
node --env-file=.env -e "require('./dist/env')"
```

Keep your env module free of imports from the rest of your application, so the check stays fast and side-effect free. To print the environment as well, sensitive values masked:

```sh
npx tsx --env-file=.env -e "import { env } from './src/env'; console.log(env)"
```

With systemd, check the environment with the actual credentials before starting the service:

```ini
[Service]
LoadCredential=DATABASE_URL:/etc/myapp/database-url
ExecStartPre=/usr/bin/node /opt/myapp/dist/env.js
ExecStart=/usr/bin/node /opt/myapp/dist/main.js
```

⚠️ Decorators require the `"experimentalDecorators": true` TypeScript option, which tsx reads from your `tsconfig.json`. Node.js can't run TypeScript files with decorators by itself, even with type stripping.

## Errors

> 🔦 `EnvValidationError`

Every missing or invalid variable is collected into a single error, so you can fix your environment in one go:

```
EnvValidationError: Invalid environment variables:
 - PORT (invalid): "PORT" must be a valid port number (1-65535) (got "99999")
 - PAYMENT_API_KEY (missing): missing required value
     desc:    Key for the payment provider
     docs:    https://example.com/docs/payments#api-keys
```

The error also exposes structured entries:

```ts
import { EnvValidationError } from '@reflet/env'

try {
  Env.load()
} catch (error) {
  if (error instanceof EnvValidationError) {
    error.errors // all entries: EnvValidationError.Entry { name, kind, message, desc?, docs? }
    error.missing // entries with kind 'missing'
    error.invalid // entries with kind 'invalid'
  }
  throw error
}
```

### Exiting on errors

At startup, print the errors and exit, rather than letting the error crash with a stack trace:

```ts
import { EnvValidationError } from '@reflet/env'

function loadEnv(): Env {
  try {
    return Env.load()
  } catch (error) {
    if (!(error instanceof EnvValidationError)) throw error
    console.error(error.message)
    process.exit(1) // or `process.exitCode = 1` and return, to let a piped stderr flush
  }
}

export const env = loadEnv()
```

## Inheritance

Variables declared in parent classes are inherited, which allows sharing common variables between apps:

```ts
class BaseEnvironment extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  @Var.Str({ choices: ['debug', 'info', 'error'] })
  LOG_LEVEL: 'debug' | 'info' | 'error' = 'info'
}

class ApiEnvironment extends BaseEnvironment {
  @Var.Port()
  PORT = 3000
}

class WorkerEnvironment extends BaseEnvironment {
  @Var.Num()
  CONCURRENCY = 4
}
```

A child class can redefine a parent property, with another type or options.

⚠️ With `useDefineForClassFields` (the default when targeting ES2022 or later), TypeScript refuses to redeclare an inherited property without initializer ([TS2612](https://www.typescriptlang.org/tsconfig#useDefineForClassFields)). Give it a default, or an `undefined` initializer, which is not a default:

```ts
class ApiEnvironment extends BaseEnvironment {
  @Var.Str({ choices: ['debug', 'info'] })
  LOG_LEVEL: 'debug' | 'info' = 'debug'
}
```

⚠️ A property can only have one env decorator: stacking several of them throws an error when the class is defined.
