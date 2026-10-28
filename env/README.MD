
# `@reflet/env` 🌱

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/env/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

Well-defined and well-typed environment variables decorators. Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Basic usage](#basic-usage)
* [Types](#types)
* [Type safety](#type-safety)
* [Defaults](#defaults)
* [Common options](#common-options)
* [Conditional requirement](#conditional-requirement)
* [Secrets](#secrets)
* [Derived values](#derived-values)
* [NODE_ENV flags](#node_env-flags)
* [Checking an environment](#checking-an-environment)
* [Errors](#errors)
* [Inheritance](#inheritance)

## Getting started

1. Enable experimental decorators in TypeScript compiler options.<br>_No need to install "reflect-metadata"._

    ```json
    "experimentalDecorators": true,
    ```

2. Install the package (Node.js 20 or later).

    ```sh
    npm i @reflet/env
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

> 🔦 `@Var.Str(options)`<br>
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
* `Json` values are deeply frozen too. Defaults are copied first through JSON, so your own objects are left untouched (and must be JSON-serializable: a `Date` becomes a string).
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

💡 In production, prefer [secret files](#secrets) for secrets.

### Always validated

The constructor of `Environment` is protected, so you can't get an environment that has not been validated:

```ts
const env = new Env() // ❌ Type error: use Env.load()
```

## Types

| Decorator | Type | Accepted values |
| --- | --- | --- |
| `@Var.Str()` | `string` | Any non-empty string, kept as is. |
| `@Var.Num()` | `number` | Decimal numbers, e.g. `42`, `-1.5`, `.5`, `1e3`. Hexadecimal, `Infinity`, overflowing values (`1e400`) and the like are rejected. |
| `@Var.Bool()` | `boolean` | `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` (case insensitive). |
| `@Var.Port()` | `number` | Integers from `1` to `65535`. |
| `@Var.Url(options?)` | `string` | Absolute URLs with a `scheme://`, e.g. `https://example.com`, `postgres://user@db:5432/app`.<br>`localhost:3000` is rejected. Restricted to some protocols with `protocols`, e.g. `['https']` or `['mongodb', 'mongodb+srv']`. |
| `@Var.Email()` | `string` | Email addresses. |
| `@Var.Host()` | `string` | Hostnames (underscores allowed, e.g. container names), IPv4, and IPv6 addresses (bracketed or not). |
| `@Var.Json<T>()` | `T` | Valid JSON. |
| `@Var.Bytes(options?)` | `Buffer` | Bytes of the value, in `utf8`, `hex`, `base64` or `base64url` encoding. |
| `@Var.File(options?)` | `string` | Path of an existing file, resolved to an absolute path. |
| `@Var.Dir(options?)` | `string` | Path of an existing directory, resolved to an absolute path. |
| `@Var.List(item?, options?)` | `T[]` | Values separated by commas (or another `separator`), each parsed by the `item` type (strings by default). Separators only are a missing value. |

Surrounding whitespace is trimmed for all types except `Str` and `Custom`.

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

An invalid item is reported with its index, e.g. `"PORTS[1]" must be a valid port number (1-65535)`.

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
* Error messages leave the path out, since it holds the value, which could be [sensitive](#sensitive).
* Defaults are checked as well, when the environment is loaded only: later permission changes are not detected, and the root user bypasses permissions.

### Custom parser

> 🔦 `@Var.Custom(parser, options)`

Provide your own parser to coerce the raw string. Throw to signal an invalid value.

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

  @Var.Custom({ validate: writableFolder })
  SHARED_DIR = 'temp' // resolved and checked, like SHARED_DIR=temp
}

function writableFolder(folder: string, name: string): string {
  const path = resolve(__dirname, '..', folder)
  accessSync(path, constants.R_OK | constants.W_OK)
  return path
}
```

To reuse a parser in several places, turn it into a variable type with `Var.Type`. It is typed like the built-in ones, and can be used for list items:

```ts
export const WritableFolder = Var.Type({ validate: writableFolder })

class Env extends Environment {
  @WritableFolder()
  SHARED_DIR = 'temp'

  @Var.List(WritableFolder)
  EXTRA_DIRS: string[] = []
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

Deployment stages (e.g. staging) are better in another variable than `NODE_ENV`, which is expected to be `production` by libraries wherever traffic is served. `Default.by` creates a picker by another variable, whose values are listed by the type parameter (it also allows other `NODE_ENV` values):

```ts
const byAppEnv = Default.by<'local' | 'staging' | 'production'>('APP_ENV')

class Env extends Environment {
  @Var.Host()
  MAIL_DOMAIN = byAppEnv({ production: 'example.com', default: 'staging.example.com' })
}
```

Environments can also be given their own values, without defaults in the code:

* Load a `.env` file per environment before calling `load`, with [dotenv](https://github.com/motdotla/dotenv), or with your framework (e.g. `.env.development`, `.env.test` with Next.js or Vite).
* In tests, pass an explicit source, or override defaults in a subclass:

```ts
const env = Env.load({ API_TOKEN: 'fake-token' })

class TestEnv extends Env {
  API_TOKEN = 'fake-token'
}
const testEnv = TestEnv.load({})
```

## Common options

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

`allowEmpty` is available on `Str`, `List` and `Custom`, since an empty value is never valid for the other types. An empty value then stops the lookup of [other names](#name) and [secret files](#secrets).

### Documentation

> 🔦 `desc`, `example`, `docs`

These are included in [error messages](#errors), to help whoever is setting up the environment:

```ts
class Env extends Environment {
  @Var.Str({
    desc: 'Key for the payment provider',
    example: 'pk_xxxxxxxxxxxxxxxx',
    docs: 'https://example.com/docs/payments#api-keys',
  })
  PAYMENT_API_KEY!: string
}
```

### Sensitive

> 🔦 `@Sensitive({ reveal? })`, `@UnsetSensitive()`

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

Applied to the class, `@Sensitive()` marks every variable as sensitive.

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

⚠️ Custom parsers are responsible for not leaking the raw value in their own error messages, and values read from the environment (e.g. `{ ...env }`, or a getter returning a secret) are not masked.

With `@UnsetSensitive()`, sensitive variables are removed from `process.env` once the environment is loaded from it, so they are not inherited by child processes, nor dumped by other code. An explicit source (e.g. in tests) is left untouched:

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

💡 Better yet, pass secrets as [files](#secrets): they never go through the environment.

## Conditional requirement

> 🔦 `requiredWhen`

A variable can be required only under some condition. The predicate receives the env instance, with already validated variables and your own getters (like [`NODE_ENV` flags](#node_env-flags)):

```ts
class Env extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  @Var.Bool()
  USE_S3 = false

  @Var.Str({ requiredWhen: (env: Env) => env.USE_S3 })
  S3_BUCKET?: string

  @Var.Url({ requiredWhen: (env: Env) => env.isProduction })
  SENTRY_DSN?: string

  get isProduction() {
    return this.NODE_ENV === 'production'
  }
}
```

* Conditional variables are validated **after** all the others, so the predicate can rely on any of them.
* Between conditional variables, declaration order matters: a predicate only sees the ones declared before.
* A variable with a default value is never missing, so its predicate is not called.
* An error thrown by the predicate is reported in the [`EnvValidationError`](#errors).

The property must be optional, since it can be `undefined` at runtime: this is enforced by types, as well as the class of the predicate parameter.

## Secrets

> 🔦 `@Secrets(directory | directories)`

Secrets are better passed as files than environment variables, which are inherited by child processes and easily leaked. Variables can be read from **secret files named like them**, in the directory or directories given to the `@Secrets` decorator.

### systemd credentials

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

### Docker, Kubernetes and others

Give the directory of secret files, e.g. `/run/secrets` for Docker and Compose secrets, or a mounted Kubernetes secret volume. With an array of directories, the first non-empty file found is used:

```ts
@Secrets([process.env.CREDENTIALS_DIRECTORY, '/run/secrets'])
class Env extends Environment {
  @Sensitive()
  @Var.Str()
  DB_PASSWORD!: string
}
```

### Rules

* Secret files are only read from the given directories: `$CREDENTIALS_DIRECTORY` is not looked up implicitly, since it is also inherited by child processes.
* Environment variables take precedence over secret files.
* Applied to a property, `@Secrets` overrides the directories of the class for this variable, e.g. none with `@Secrets([])`.
* Subclasses inherit the directories, unless they define their own, e.g. none in tests with `@Secrets([])`.
* With [several names](#name), each one is looked up as a file name, e.g. `name: ['DB_PASSWORD', 'db-password']`.
* A single trailing newline is removed from file contents (e.g. written by `echo`), which are then parsed as usual.
* Empty files are skipped for the next directory or name (unless [`allowEmpty`](#empty-values)), and an unreadable file is reported in the [`EnvValidationError`](#errors).
* Values read from files are left out of error messages (unless [revealed](#sensitive)). Mark them as [`@Sensitive`](#sensitive) to mask them in logs as well.
* The closest class defining directories wins, on the property first, then on the class itself: `@Secrets([])` on a subclass overrides the directories of its parents.

## Derived values

Derive values from your variables with plain getters:

```ts
class Env extends Environment {
  @Var.Host()
  HOST!: string

  @Var.Port()
  PORT = 3000

  get BASE_URL() {
    return `http://${this.HOST}:${this.PORT}`
  }
}
```

Getters are evaluated on access, and don't show up in serialization.

## NODE_ENV flags

There are no built-in `isProduction`-like flags: define the ones you need as getters, with your own semantics.

```ts
class Env extends Environment {
  @Var.Str({ choices: ['development', 'production', 'test'] })
  NODE_ENV!: 'development' | 'production' | 'test'

  get isProduction() {
    return this.NODE_ENV === 'production'
  }

  get isDev() {
    return this.NODE_ENV === 'development'
  }
}

const env = Env.load()

if (env.isProduction) {
  app.set('trust proxy', 1)
}
```

Conditional variables are validated last, so these getters can be used in [`requiredWhen`](#conditional-requirement) predicates.

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
ExecStartPre=/usr/bin/npx tsx /opt/myapp/src/env.ts
ExecStart=/usr/bin/npx tsx /opt/myapp/src/main.ts
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
     example: pk_xxxxxxxxxxxxxxxx
     docs:    https://example.com/docs/payments#api-keys
```

The error also exposes structured entries:

```ts
import { EnvValidationError } from '@reflet/env'

try {
  Env.load()
} catch (error) {
  if (error instanceof EnvValidationError) {
    error.errors // all entries: { name, kind, message, desc?, example?, docs? }
    error.missing // entries with kind 'missing'
    error.invalid // entries with kind 'invalid'
  }
  throw error
}
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
