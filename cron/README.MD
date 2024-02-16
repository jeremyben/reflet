
# `@reflet/cron` 🌠

> [!WARNING]  
> This package is outdated. It will be updated again when the cron package reaches v3.

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

1. Enable experimental decorators in TypeScript compiler options.<br>_No need to install "reflect-metadata"._

    ```json
    "experimentalDecorators": true,
    ```

2. Install the package along with peer dependencies.

    ```sh
    npm i @reflet/cron cron
    npm i -D @types/cron
    ```

3. Create cron jobs.

    ```ts
    // jobs.ts
    import { Cron, CronExpression } from '@reflet/cron'

    @Cron.TimeZone('Europe/Paris')
    export class Jobs {
      @Cron(CronExpression.EVERY_SECOND)
      async logMessage() {
        console.log('You will see this message every second');
      }

      @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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

💡 Use `CronExpression` enum to avoid using cron syntax:

```ts
import { Cron, CronExpression } from '@reflet/cron'

class Jobs {
  @Cron(CronExpression.EVERY_MINUTE)
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

  @Cron(CronExpression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}

const jobs = Jobs.init()
```

💡 As a convenience, you can inherit from the abstract class `CronInit` which already have the `init` static method:

```ts
import { CronInit } from '@reflet/cron'

// You must pass the child class as type parameter to properly infer its constructor parameters.
class Jobs extends CronInit<typeof Jobs> {
  @Cron(CronExpression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}

const jobs = Jobs.init()
```

## Extra properties

Compared to [node-cron](https://github.com/kelektiv/node-cron), Reflet adds 2 properties to jobs' instances:
* `firing`: readonly `boolean` that helps us determine if the job is **actually** being executed. Because the original node-cron `running` property defines whether the job has been started or stopped.
* `name`: `string` which is the name of the method.

## Current job access

The current job instance is always available as the parameter of the `onTick` function, which is useful to stop it for example.

```ts
import { Cron, CronExpression } from '@reflet/cron'

class Jobs {
  @Cron(CronExpression.EVERY_SECOND)
  doSomething(job: Job) {
    job.stop()
  }
}
```

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
import { Cron, CronExpression } from '@reflet/cron'

class Jobs {
  @Cron.Start 
  @Cron.RunOnInit
  @Cron.TimeZone('Europe/Paris')
  @Cron(CronExpression.EVERY_SECOND)
  doSomething() {}

  @Cron.Start()
  @Cron.RunOnInit()
  @Cron.UtcOffset('+01:00')
  @Cron.OnComplete(() => {}) 
  @Cron(CronExpression.EVERY_SECOND)
  doSomethingElse() {}
}
```

## Errors and retries

Errors happening in a cron job are automatically logged to `stderr` instead of crashing the server,
but you should handle your errors manually so you can give it more context or use your own logger.

### Catch

> 🔦 `@Cron.Catch(errorHandler, currentJob)`

This decorator allows you to do something else than logging with your errors.

```ts
import { Cron, CronExpression } from '@reflet/cron'

@Cron.Catch((err, job) => {
  logger.error({ jobName: job.name, jobError: error })
})
class Jobs {
  @Cron(CronExpression.EVERY_SECOND)
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

```ts
import { Cron, CronExpression } from '@reflet/cron'

class Jobs {
  @Cron.Retry({ attempts: 3, delay: 100, delayFactor: 2, delayMax: 1000 })
  @Cron(CronExpression.EVERY_HOUR)
  doSomething() {}
}
```

If all the attempts failed, then the error is logged to `stderr` (or handled by `Cron.Catch`).

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

Boolean option decorators (`@Cron.Start`, `@Cron.RunOnInit`, `@Cron.UnrefTimeout`) can be turned to false with their special sub decorator: `@Cron.XXX.Dont` _(can be used with or without invokation)_

```ts
@Cron.Start
@Cron.PreventOverlap
@Cron.Retry({ maxRetries: 3, delay: 200 })
class Jobs {
  @Cron(CronExpression.EVERY_SECOND)
  doSomething() {}

  @Cron.Start.Dont
  @Cron(CronExpression.EVERY_SECOND)
  doSomethingElse() {}
}
```

## Dynamic jobs

You can add dynamic cron jobs like so:

```ts
import { Cron, CronExpression, initCronJobs } from '@reflet/cron'

@Cron.Start
class Jobs {
  @Cron(CronExpression.EVERY_SECOND)
  doSomething() {}
}

const jobs = initCronJobs(Jobs)

jobs.set('doSomethingElse', {
  cronTime: CronExpression.EVERY_HOUR,
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
import { Cron, CronExpression, initCronJobs } from '@reflet/cron'

class Service {
  user = 'Jeremy'
}

class Jobs extends CronInit<typeof Jobs> {
  constructor(private service: Service) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  doSomething() {
    console.log(this.service.user)
  }
}

const jobs = Jobs.init(new Service())
```
