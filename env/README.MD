
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
    import { Var, Environment } from '@reflet/env'

    export class Env extends Environment {
      @Var.Str({ choices: ['development', 'production', 'test'] })
      NODE_ENV!: 'development' | 'production' | 'test'

      @Var.Port()
      PORT = 3000

      @Var.Url({ desc: 'Main database', sensitive: true })
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
| `@Var.Url()` | `string` | Absolute URLs with a `scheme://`, e.g. `https://example.com`, `postgres://user@db:5432/app`.<br>`localhost:3000` is rejected. |
| `@Var.Email()` | `string` | Email addresses. |
| `@Var.Host()` | `string` | Hostnames (underscores allowed, e.g. container names), IPv4, and IPv6 addresses (bracketed or not). |
| `@Var.Json<T>()` | `T` | Valid JSON. |
| `@Var.List(item?, options?)` | `T[]` | Values separated by commas (or another `separator`), each parsed by the `item` type (strings by default). |

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

### Custom parser

> 🔦 `@Var.Custom(parser, options)`

Provide your own parser to transform the raw string. Throw to signal an invalid value.

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

## Defaults

> 🔦 property initializer

Default values are property initializers, used when a variable is missing (or empty). They also let TypeScript infer the property type:

```ts
class Env extends Environment {
  @Var.Port()
  PORT = 3000
}
```

* Defaults of `Num`, `Port`, `Url`, `Email` and `Host` variables (and lists of them) are validated as well, so a typo in your code is caught early.
* A `null` or `undefined` initializer is not a default.
* A subclass can override an inherited default with its own initializer.

### Environment-specific defaults

There are no development or test specific defaults: the values of an environment belong to the environment itself.

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

> 🔦 `sensitive`

By default, error messages show the invalid value (e.g. `"PORT" must be a valid port number (1-65535) (got "99999")`).<br>
Mark secrets as `sensitive` to keep them out of your logs: they are left out of error messages, and masked when logging or serializing the environment.

```ts
class Env extends Environment {
  @Var.Port()
  PORT = 3000

  @Var.Url({ sensitive: true })
  DATABASE_URL!: string // may contain credentials.
}

const env = Env.load()

env.DATABASE_URL // the actual value
console.log(env) // Env { PORT: 3000, DATABASE_URL: '***' }
JSON.stringify(env) // {"PORT":3000,"DATABASE_URL":"***"}
```

⚠️ Custom parsers are responsible for not leaking the raw value in their own error messages, and values read from the environment (e.g. `{ ...env }`, or a getter returning a secret) are not masked.

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

> 🔦 `@Var.Secrets(...directories)`

Secrets are better passed as files than environment variables, which are inherited by child processes and easily leaked. Variables can be read from **secret files named like them**, in the directories given to the `@Var.Secrets` class decorator.

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
@Var.Secrets(process.env.CREDENTIALS_DIRECTORY) // undefined, hence ignored, outside of systemd.
class Env extends Environment {
  @Var.Str({ sensitive: true })
  DB_PASSWORD!: string

  @Var.Str({ sensitive: true })
  API_TOKEN!: string
}

const env = Env.load()
```

### Docker, Kubernetes and others

Give the directories of secret files, e.g. `/run/secrets` for Docker and Compose secrets, or a mounted Kubernetes secret volume. With several directories, the first non-empty file found is used:

```ts
@Var.Secrets(process.env.CREDENTIALS_DIRECTORY, '/run/secrets')
class Env extends Environment {
  @Var.Str({ sensitive: true })
  DB_PASSWORD!: string
}
```

### Rules

* Secret files are only read from the given directories: `$CREDENTIALS_DIRECTORY` is not looked up implicitly, since it is also inherited by child processes.
* Environment variables take precedence over secret files.
* Subclasses inherit the directories, unless they define their own, e.g. none in tests with `@Var.Secrets()`.
* With [several names](#name), each one is looked up as a file name, e.g. `name: ['DB_PASSWORD', 'db-password']`.
* A single trailing newline is removed from file contents (e.g. written by `echo`), which are then parsed as usual.
* Empty files are skipped for the next directory or name, and an unreadable file is reported in the [`EnvValidationError`](#errors).
* Values read from files are never included in error messages. Mark them as [`sensitive`](#sensitive) to mask them in logs as well.

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
