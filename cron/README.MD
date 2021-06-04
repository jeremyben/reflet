
# `@reflet/cron` 🌠

The **best** decorators for [node-cron](https://github.com/kelektiv/node-cron). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Basic Job](#basic-job)
* [Extra properties](#extra-properties)
* [Common options](#common-options)
* [Errors and retries](#errors-and-retries)
* [Overlaps](#overlaps)
* [Options flexibility](#options-flexibility)
* [Current job access](#current-job-access)
* [Dynamic jobs](#dynamic-jobs)
* [Pure dependency injection](#pure-dependency-injection)

## Getting started

1. <details>
    <summary>Make sure you have decorators enabled. (click for details)</summary>
    <p>

    * Enable them in your TypeScript compiler options.

        ```json
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        ```

    * Install `reflect-metadata` shim.

        ```sh
        yarn add reflect-metadata
        ```

    * Import the shim in your program before everything else.

        ```ts
        import 'reflect-metadata'
        ```

    </p>
    </details>

2. Install the package along with peer dependencies.

    ```sh
    yarn add @reflet/cron cron && yarn add -D @types/cron @types/node
    ```

3. Create cron jobs.

    ```ts
    // jobs.ts
    import { Cron, Expression } from '@reflet/cron'

    @Cron.TimeZone('Europe/Paris')
    export class Jobs {
      @Cron(Expression.EVERY_SECOND)
      async logMessage() {
        console.log('You will see this message every second');
      }

      @Cron(Expression.EVERY_DAY_AT_MIDNIGHT)
      async sendEmailToAdmin() {
        await emailClient.send({ to: 'admin@github.com', content: 'This is fine' })
      }
    }
    ```

4. Initialize and start cron jobs.

	```ts
	// main.ts
	import { initCronJobs } from '@reflet/cron'
	import { Jobs } from './jobs.ts'

	const jobs = initCronJobs(Jobs)
	jobs.startAll()
	```


## Basic Job

> 🔦 `@Cron(time)`<br>
> 🔦 `initCronJobs(class)`<br>
> 💫 Related node-cron constructor: [`CronJob`](https://github.com/kelektiv/node-cron#usage-basic-cron-usage)

```ts
import { Cron, initCronJobs } from '@reflet/cron'

class Jobs {
  @Cron('*/1 * * * *')
  logFoo() {
    console.log('foo')
  }
}

const jobs = initCronJobs(Jobs) // returns a Map of your jobs, with the method names as keys.

// You can start jobs individually
jobs.get('logFoo').start()

// Or all at once
jobs.startAll()

// Same with stop
jobs.stopAll()
```

💡 Use `Expression` enum to avoid using cron syntax:

```ts
import { Cron, Expression } from '@reflet/cron'

class Jobs {
  @Cron(Expression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}
```

### Init encapsulation

Wrap `initCronJobs` into a static method to encapsulate initialization as well:

```ts
import { initCronJobs, Cron } from '@reflet/cron'

class Jobs {
  static init(...deps: ConstructorParameters<typeof Jobs>) {
    return initCronJobs(new Jobs(...deps))
  }

  @Cron(Expression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}

const jobs = Jobs.init()
```

💡 As a convenience, you can inherit from the abstract class `Initializer` which already have the `init` static method:

```ts
import { Initializer } from '@reflet/cron'

// You must pass the child class as type parameter to properly infer its constructor parameters.
class Jobs extends Initializer<typeof Jobs> {
  @Cron(Expression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}

const jobs = Jobs.init()
```

## Extra properties

Compared to [node-cron](https://github.com/kelektiv/node-cron), Reflet adds 2 properties to jobs' instances:
* `firing`: readonly `boolean` that helps us determine if the job is **actually** being executed. Because the original node-cron `running` property defines whether the job has been started or stopped. _This property is used by the [PreventOverlap](#overlaps) decorator._
* `name`: `string` in the following format: `class.method`, to help distinguish jobs.

## Common options

> 🔦 `@Cron.Start`, `@Cron.RunOnInit`, `@Cron.OnComplete(fn)`, `@Cron.TimeZone(tz)`, `@Cron.UtcOffset(offset)`, `@Cron.UnrefTimeout`<br>
> 💫 Related node-cron parameters: [`start, runOnInit, onComplete, timezone, utcOffset, unrefTimeout`](https://github.com/kelektiv/node-cron#api)

* `@Cron.Start`: Starts the job after init (does not immediately fire its function). _Can be used with or without invokation._
* `@Cron.RunOnInit`: Fire the job's function on init. _Can be used with or without invokation._
* `@Cron.OnComplete(fn)`: A function that will fire when the job is stopped with `job.stop()`.
* `@Cron.TimeZone(tz)`: Specify the timezone for the execution. _Type is narrowed to an union of all available timezones._
* `@Cron.UtcOffset(offset)`: Specify the offset of the timezone instead of the timezone directly. _Type is narrowed to an union of all available offsets (plus `number`)._

Please refer to the **[node-cron repository](https://github.com/kelektiv/node-cron#api)** for more details.

```ts
import { Cron, Expression } from '@reflet/cron'

class Jobs {
  @Cron.Start 
  @Cron.RunOnInit
  @Cron.TimeZone('Europe/Paris')
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}

  @Cron.Start()
  @Cron.RunOnInit()
  @Cron.UtcOffset('+01:00')
  @Cron.OnComplete(() => {}) 
  @Cron(Expression.EVERY_SECOND)
  doSomethingElse() {}
}
```

## Errors and retries

Errors happening in a cron job are automatically logged to `stderr` instead of crashing the server.

### Catch

> 🔦 `@Cron.Catch(errorHandler)`

This decorator allows you to do something else than logging with your errors.

```ts
import { Cron, Expression } from '@reflet/cron'

class Jobs {
  @Cron.Catch(async (err) => {
    console.error(err)
    await db.insert(err)
  })
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}
}
```

### Retry

> 🔦 `@Cron.Retry(options)`

If your job throw an error, you can retry it with a specify number of `attempts`, and specify backoff behavior.

* `attempts`: Number of retry attempts.
* `delay`: Delay between retry attemps in milliseconds.
* `delayFactor`: Increases each time the previous delay by a multiplicative factor.
* `delayMax`: Caps the maximum delay in milliseconds.
* `condition`: Filter function with the error as parameter (so you can retry on specific errors only).

```ts
import { Cron, Expression } from '@reflet/cron'

class Jobs {
  @Cron.Retry({ attempts: 3, delay: 100, delayFactor: 2, delayMax: 1000 })
  @Cron(Expression.EVERY_HOUR)
  doSomething() {}
}
```

If all the attempts failed, then the error is logged to `stderr` (or handled by `Cron.Catch`).

## Overlaps

> 🔦 `@Cron.PreventOverlap`

Prevents the job from firing if the previous occurence is not finished. Useful for potentially long jobs firing every second.<br>_Can be used with or without invokation._

```ts
import { Cron, Expression } from '@reflet/cron'

class Jobs {
  @Cron.PreventOverlap
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}
}
```

### Distributed overlaps

> 🔦 `@Cron.PreventOverlap.RedisLock`

If your application hosting your cron jobs is running amongst multiple instances, you want to make sure a single job is firing once.<br>With the help of Redis and the **[node-redlock](https://github.com/mike-marcacci/node-redlock)** package, you can achieve cron locks easily.

You obviously need to install a Redis server, a nodejs Redis client, and `node-redlock`.

```ts
import * as redis from 'redis'
import * as Redlock from 'redlock'
import { Cron, Expression } from '@reflet/cron'

const redisClient = redis.createClient()

@Cron.PreventOverlap.RedisLock((job) => {
  const redlock = new Redlock([redisClient], { retryCount: 0 })
  return redlock.lock(`lock:${job.name}`, 1000)
  // use each job's name as a unique resource ("Jobs.doSomething" in this case).
})
class Jobs {
  @Cron(Expression.EVERY_MINUTE)
  doSomething() {}
}
```

Reflet will handle the unlocking, once the job is over.<br>If `@Cron.Retry` is also applied, the lock will be reacquired on retries with the original `ttl` and the eventual retry delay.

🗣️ By default, redlock `retryCount` is set to `10`, the [documentation](https://github.com/mike-marcacci/node-redlock#how-do-i-check-if-something-is-locked) recommends to set `retryCount` to `0` for most tasks (especially for high frequency jobs).

In that regard, if you want to have a look at failed locks, you can simply `.catch` your lock promise: 

```ts
return redlock.lock(`lock:${job.name}`, 1000).catch(console.warn)
```

Go to [node-redlock documentation](https://github.com/mike-marcacci/node-redlock#configuration) for more details.

## Options flexibility

### Single decorator

> 🔦 `@Cron.Options(allOptions)`

If you prefer, you can use `@Cron.Options` to group all your options in a single decorator:

```ts
import { Cron } from '@reflet/cron'

class Jobs {
  @Cron.Options({
    start: true,
    runOnInit: true,
    retry: { attempts: 3, delay: 200 },
    catchError: async (err) => {
      await db.insert(err)
    }
  })
  @Cron('* * * * *')
  doSomething() {}
}
```

### Share and override

Attach any option decorator to the class to share it with all jobs. You can override it by reattaching it to the method.

Boolean option decorators (`@Cron.Start`, `@Cron.RunOnInit`, `@Cron.UnrefTimeout`, `@Cron.PreventOverlap`) can be turned to false with their special sub decorator: `@Cron.XXX.Dont` _(can be used with or without invokation)_

```ts
@Cron.Start
@Cron.PreventOverlap
@Cron.Retry({ maxRetries: 3, delay: 200 })
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}

  @Cron.Start.Dont
  @Cron(Expression.EVERY_SECOND)
  doSomethingElse() {}
}
```

## Current job access

> 🔦 `@CurrentJob`

You might need to access the current job instance from its own `onTick` function, for example to simply stop it.<br>_Can be used with or without invokation._

```ts
import { Cron, Expression, CurrentJob } from '@reflet/cron'

class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething(@CurrentJob job: Job) {
    job.stop()
  }
}
```

## Dynamic jobs

You can add dynamic cron jobs like so:

```ts
import { Cron, Expression, initCronJobs } from '@reflet/cron'

@Cron.Start
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}
}

const jobs = initCronJobs(Jobs)

jobs.set('doSomethingElse', {
  cronTime: Expression.EVERY_HOUR,
  onTick() {
    console.log("I'm a dynamic job")
  },
  runOnInit: true,
  preventOverlap: true
})
```

Dynamic jobs inherit shared class options.

## Pure dependency injection

If you want to go full OOP and your job classes has constructor dependencies, Reflet will enforce passing them as instances (along with their dependencies) instead of classes.

```ts
import { Cron, Expression, initCronJobs } from '@reflet/cron'

class Service {
  user = 'Jeremy'
}

class Jobs {
  static init(...deps: ConstructorParameters<typeof Jobs>) {
    return initCronJobs(new Jobs(...deps))
  }

  constructor(private service: Service) {}

  @Cron(Expression.EVERY_10_MINUTES)
  doSomething() {
    console.log(this.service.user)
  }
}

const jobs = Jobs.init(new Service())
```
