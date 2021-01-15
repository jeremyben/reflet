
# `@reflet/cron` 🌠

The **best** decorators for [Cron](https://github.com/kelektiv/node-cron). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Basic Job](#basic-job)
* [Common options](#common-options)
* [Error handling](#error-handling)
* [Overlaps](#overlaps)
* [Access current job](#access-current-job)
* [Dynamic jobs](#dynamic-jobs)

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

> 🔦 `@Cron(time)`
> 🔦 `initCronJobs(class)`
> 💫 Related node-cron constructor: [`CronJob`](https://github.com/kelektiv/node-cron#usage-basic-cron-usage)

```ts
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

Use `Expression` enum to avoid using cron syntax:

```ts
class Jobs {
  @Cron(Expression.EVERY_MINUTE)
  logFoo() {
    console.log('foo')
  }
}
```

## Common options

> 🔦 `@Cron.Start`, `@Cron.RunOnInit`, `@Cron.OnComplete(fn)`, `@Cron.TimeZone(tz)`, `@Cron.UtcOffset(offset)`, `@Cron.UnrefTimeout`
> 💫 Related node-cron parameters: [`start, runOnInit, onComplete, timezone, utcOffset, unrefTimeout`](https://github.com/kelektiv/node-cron#api)


* `@Cron.Start`: Starts the job after init (does not immediately fire its function). _Can be used with or without invokation._
* `@Cron.RunOnInit`: Fire the job's function on init. _Can be used with or without invokation._
* `@Cron.OnComplete(fn)`: A function that will fire when the job is stopped with job.stop().
* `@Cron.TimeZone(tz)`: Specify the timezone for the execution. _Type is narrowed to an union of all available timezones._
* `@Cron.UtcOffset(offset)`: Specify the offset of the timezone instead of the timezone directly. _Type is narrowed to an union of all available offsets (and `number`)._

Please refer to the [node-cron package](https://github.com/kelektiv/node-cron#api) for more details.

```ts
class Jobs {
  @Cron.Start 
  @Cron.RunOnInit
  @Cron.UnrefTimeout
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

const jobs = initCronJobs(Jobs)
```

### Share and override

Attach any option decorator to the class to share it with all jobs. You can override it by reattaching it to the method.

Boolean option decorators (`@Cron.Start`, `@Cron.RunOnInit`, `@Cron.UnrefTimeout`, `@Cron.PreventOverlap`) can be turned to false with their special sub decorator: `@Cron.XXX.Dont` _(can be used with or without invokation)_.

```ts
@Cron.Start
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}

  @Cron.Start.Dont
  @Cron(Expression.EVERY_SECOND)
  doSomethingElse() {}
}
```

## Error handling

Errors happening in a cron job are automatically logged to `stderr` instead of crashing the server.

### Catch

> 🔦 `@Cron.Catch(errorHandler)`

This decorator allows you to do something else than logging with your errors.

```ts
@Cron.Catch(async (err) => {
  console.error(err)
  await db.insert(err)
})
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}
}
```

### Retry

> 🔦 `@Cron.Retry(options)`

```ts
@Cron.Retry({ maxRetries: 3, delay: 100, delayFactor: 2, delayMax: 1000 })
class Jobs {
  @Cron(Expression.EVERY_HOUR)
  doSomething() {}
}
```

## Overlaps

> 🔦 `@Cron.PreventOverlap`

Prevents the job from being fired if the previous occurence is not finished. Useful for potentially long jobs firing every second. _Can be used with or without invokation._

```ts
@Cron.PreventOverlap
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething() {}
}
```

## Access current job

> 🔦 `@CurrentJob`

Access current job from its own `onTick` function. _Can be used with or without invokation._
```ts
class Jobs {
  @Cron(Expression.EVERY_SECOND)
  doSomething(@CurrentJob job: Job) {
    job.stop()
  }
}
```

## Dynamic jobs

```ts
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
