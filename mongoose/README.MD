# `@reflet/mongoose` 🌠

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

The **best** decorators for [Mongoose](https://mongoosejs.com/). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Schema definition](#schema-definition)
* [Model](#model)
* [Schema options](#schema-options)
* [Schema retrieval](#schema-retrieval)
* [Hooks](#hooks)
* [Model discriminators](#model-discriminators)
* [Embedded discriminators](#embedded-discriminators)
* [Plain helper](#plain-helper)
* [Augmentations](#augmentations)

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
    yarn add @reflet/mongoose mongoose && yarn add -D @types/mongoose @types/node
    ```

3. Create your decorated models.

    ```ts
    // user.model.ts
    import { Model, Field } from '@reflet/mongoose'

    @Model()
    export class User extends Model.Interface {
      static findByEmail(email) {
        return this.findOne({ email });
      }

      @Fied({ type: String, required: true })
      email: string

      getProfileUrl() {
        return `https://mysite.com/${this.email}`;
      }
    }
    ```

4. Connect to MongoDB and save your documents.

    ```ts
    // server.ts
    import 'reflect-metadata'
    import mongoose from 'mongoose'
    import { User } from './user.model.ts'

    mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true })

    User.create({ email: 'jeremy@example.com' }).then((user) => {
      console.log(`User ${user._id} has been saved.`)
    })
    ```

### The Mongoose way

Connect Mongoose in the way you already know. Models defined with Reflet will simply be attached to the default Mongoose connection.

## Schema definition

> 🔦 `@Field(schemaType)`<br>
> 💫 Related Mongoose object: [SchemaTypes](https://mongoosejs.com/docs/schematypes)

Mongoose [already](https://mongoosejs.com/docs/api#schema_Schema-loadClass) allows you to load an ES6 class to attach getters, setters, instance and static methods to a schema.
But what about properties ? Enters the `@Field` decorator :

```ts
class User {
  @Field({ type: String, required: true })
  firstname: string

  @Field({ type: String, required: true })
  lastname: string

  @Field(Number)
  age?: number

  get fullname() {
    return `${this.firstname} ${this.lastname}`
  }
}
```

The `@Field` API is a direct wrapper of Mongoose [SchemaType](https://mongoosejs.com/docs/schematypes), you can put in there everything that you used to.

### Nested properties

> 🔦 `@Field.Nested(schemaTypes)`

```ts
class User {
  @Field.Nested({
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
  })
  address: {
    street: string
    city: string
    country: string
  }
}
```

_`@Field.Nested` works the same as `@Field` at runtime. Its type is simply looser to allow nested objects._

## Model

> 🔦 `@Model(collection?, connection?)`<br>
> 💫 Related Mongoose method: [`model`](https://mongoosejs.com/docs/models#compiling)

TypeScript [class decorators](https://www.typescriptlang.org/docs/handbook/decorators#class-decorators) can modify and even replace class constructors. Reflet takes advantage of this feature and transforms a class directly into a Mongoose Model.

This means you don't have to deal with the procedural and separate creation of both schema and model anymore !
And now your properties and methods are statically typed.

```ts
@Model()
class User extends Model.Interface {
  @Field({ type: String, required: true })
  email: string
}

const user = await User.create({ email: 'jeremy@example.com '})
```

To have Mongoose document properties and methods, your class needs to inherit a special empty class: `Model.Interface`. _it's the only way to inherit (not implement) an interface in TypeScript._

⚠️ `@Model` should always be at the top of your class decorators. _Why? Because decorators are executed bottom to top, so if `@Model` directly compiles your class into a Mongooose Model, other class decorators won't be properly applied._

#### Custom collection name

By default, Mongoose automatically creates a collection named as the plural, lowercased version of your model name. You can customize the collection name, with the first argument:

```ts
@Model('people')
class User extends Model.Interface {
  @Field({ type: String, required: true })
  email: string
}
```

#### Custom Mongoose connection

You can use a different database by creating a Mongoose connection and passing it as the second argument:

```ts
const otherDb = mongoose.createConnection('mongodb://localhost/other', { useNewUrlParser: true })

@Model(undefined, otherDb)
class User extends Model.Interface {
  @Field({ type: String, required: true })
  email: string
}
```

## Schema options

> 🔦 `@SchemaOptions(options)`<br>
> 💫 Related Mongoose object: [Schema options](https://mongoosejs.com/docs/guide#options)

```ts
@Model()
@SchemaOptions({ autoIndex: false, strict: 'throw' })
class User extends Model.Interface {
  @Field(String)
  name: string
}
```

The `@SchemaOptions` API is a direct wrapper of Mongoose [schema options](https://mongoosejs.com/docs/guide#options), you can put in there everything that you used to.

### Timestamps

> 🔦 `@CreatedAt`, `@UpdatedAt`<br>
> 💫 Related Mongoose option property: [`timestamps`](https://mongoosejs.com/docs/guide#timestamps)

```ts
@Model()
@SchemaOptions({ minimize: false })
class User extends Model.Interface {
  @Field(String)
  name: string

  @CreatedAt
  creationDate: Date

  @UpdatedAt
  updateDate: Date
}
```

### Advanced schema manipulation

> 🔦 `@SchemaCallback(callback)`<br>
> 💫 Related Mongoose object: [`Schema`](https://mongoosejs.com/docs/api/schema)

If you need more advanced schema manipulation before `@Model` compiles it, you can use `@SchemaCallback`:

```ts
@Model()
@SchemaCallback((schema) => {
  schema.index({ name: 1, type: -1 })
})
class Animal extends Model.Interface {
  @Field(String)
  name: string

  @Field(String)
  type: string
}
```

_Beware of defining hooks in the callback if your schema has embedded discriminators. Mongoose documentation recommends declaring hooks **before** embedded discriminators, the callback is applied **after** them. You should use the dedicated hooks decorators `@Pre` and `@Post`._

## Schema retrieval

> 🔦 `schemaFrom(class)`

You can retrieve a schema from any decorated class, for advanced manipulation or embedded use in another schema.

```ts
@SchemaOptions({ _id: false })
abstract class Location {
  @Field(Number)
  lat: number

  @Field(Number)
  lng: number
}

const locationSchema = schemaFrom(Location)

@Model()
class City extends Model.Interface {
  @Field(String)
  name: string

  @Field(locationSchema)
  location: Location
}

const citySchema = schemaFrom(City)
```

🗣️ As a good practice, you should make your schema-only classes `abstract`, so you don't instantiate them by mistake.

## Hooks

### Pre middleware

> 🔦 `@Pre(method, callback)`<br>
> 💫 Related Mongoose method: [`schema.pre`](https://mongoosejs.com/docs/middleware#pre)

```ts
@Model()
@Pre<User>('save', function(next) {
  next()
})
class User extends Model.Interface {
  @Field(String)
  name: string
}
```

The `@Pre` API is a direct wrapper of Mongoose [Schema.pre method](https://mongoosejs.com/docs/api/schema#schema_Schema-pre), you can put in there everything that you used to.

### Post middleware

> 🔦 `@Post(method, callback)`<br>
> 💫 Related Mongoose method: [`schema.post`](https://mongoosejs.com/docs/middleware#post)

```ts
@Model()
@Post<User>('save', function(doc, next) {
  next()
})
class User extends Model.Interface {
  @Field(String)
  name: string
}
```

The `@Post` API is a direct wrapper of Mongoose [Schema.post method](https://mongoosejs.com/docs/api/schema#schema_Schema-post), you can put in there everything that you used to.

#### Post error handling middleware

To help the compiler accurately infer the [error handling middleware](https://mongoosejs.com/docs/middleware#error-handling-middleware) signature, pass a second type argument to `@Post`:

```ts
@Model()
@Post<User, Error>('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next()
  }
})
class User extends Model.Interface {
  @Field(String)
  name: string
}
```

## Model discriminators

> 🔦 `@Model.Discriminator(rootModel)`<br>
> 💫 Related Mongoose method: [`model.discriminator`](https://mongoosejs.com/docs/discriminators#the-model-discriminator-function)

```ts
@Model()
class User extends Model.Interface {
  @Field(String)
  name: string
}

@Model.Discriminator(User)
class Worker extends User {
  @Field(String)
  job: string

  __t: 'Worker'
  // __t is the default discriminatorKey (no need to decorate).
  // Value will be the class name.
  // If you want to customize both the key and the value, check out the following `@Kind` decorator.
}

const worker = await Worker.create({ name: 'Jeremy', job: 'developer' })
// { _id: '5d023ae14043262bcfd9b384', __t: 'Worker', name: 'Jeremy', job: 'developer' }
```

⚠️ `@Model.Discriminator` should always be at the top of your class decorators. _Why? Because decorators are executed bottom to top, so if `@Model.Discriminator` directly compiles your class into a Mongooose Model, other class decorators won't be properly applied._

### Kind

> 🔦 `@Kind(value?)`<br>
> 💫 Related Mongoose option property: [`discriminatorKey`](https://mongoosejs.com/docs/discriminators#the-model-discriminator-function)

Mongoose `discriminatorKey` is usually defined in the parent model options, and appears in the children model documents.
`@Kind` exists to define `discriminatorKey` **directly** on the children class instead of the parent model.

```ts
@Model()
class User extends Model.Interface {
  @Field(String)
  name: string
}

@Model.Discriminator(User)
class Developer extends User {
  @Kind
  kind: 'Developer'
  // Value will be the class name by default.
  // Equivalent to setting `{ discriminatorKey: 'kind' }` on User schema options.
}

@Model.Discriminator(User)
class Doctor extends User {
  @Kind('doctor') // Customize the discriminator value by passing a string.
  kind: 'doctor'
}
```

A mecanism will check and prevent you from defining a different `@Kind` key on sibling discriminators.

## Embedded discriminators

### Single nested discriminators

> 🔦 `@Field.Union(...classes)`<br>
> 💫 Related Mongoose method: [`SingleNestedPath.discriminator`](https://mongoosejs.com/docs/discriminators#single-nested-discriminators)

`@Field.Union` allows you to embed discriminators on an single property.

```ts
abstract class Circle {
  @Field(Number)
  radius: number

  __t: 'Circle'
  // __t is the default discriminatorKey (no need to decorate).
  // Value will be the class name.
}

abstract class Square {
  @Field(Number)
  side: number

  __t: 'Square'
}

@Model()
class Shape extends Model.Interface {
  @Field.Union(Circle, Square)
  shape: Circle | Square
}

const circle = new Shape({ shape: { __t: 'Circle', radius: 5 } })
const square = new Shape({ shape: { __t: 'Square', side: 4 } })
```

### Embedded discriminators in arrays

> 🔦 `@Field.ArrayOfUnion(...classes)`<br>
> 💫 Related Mongoose method: [`DocumentArrayPath.discriminator`](https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays)

`@Field.ArrayOfUnion` allows you to embed discriminators in an array.

```ts
@SchemaOptions({ _id: false })
abstract class Clicked {
  @Field({ type: String, required: true })
  message: string

  @Field({ type: String, required: true })
  element: string

  @Kind
  kind: 'Clicked'
}

@SchemaOptions({ _id: false })
abstract class Purchased {
  @Field({ type: String, required: true })
  message: string

  @Field({ type: String, required: true })
  product: string

  @Kind
  kind: 'Purchased'
}

@Model()
class Batch extends Model.Interface {
  @Field.ArrayOfUnion(Clicked, Purchased)
  events: (Clicked | Purchased)[]
}

const batch = new Batch({
  events: [
    { kind: 'Clicked', element: '#hero', message: 'hello' },
    { kind: 'Purchased', product: 'action-figure', message: 'world' },
  ]
})
```

## Plain helper

> 🔦 `Plain<class>`, `Plain.Partial<class>`, `Plain.Without<class, properties>`

Some Mongoose methods return plain JS objects instead of Mongoose Documents, while others need plain objects as parameter. Reflet provides generic types to discard Mongoose properties and methods from a Document.

* `Plain<T>` removes inherited Mongoose properties (except _id) and all methods from `T`.
* `Plain.Partial<T>` does the same as `Plain` and makes remaining properties of `T` optional.
* `Plain.Without<T, U>` does the same as `Plain` and also omits keys specified in `U`.

```ts
@Model()
class User extends Model.Interface {
  @Field(String)
  name: string

  constructor(user: Plain.Without<User, '_id'>) {
    super() // required by the compiler.
  }
}

const userDocument = new User({ name: 'Jeremy' })
const userObject = userDocument.toObject() as Plain<User>
```

## Augmentations

Reflet comes with a dedicated global namespace `RefletMongoose`, so you can augment or narrow specific types.

### SchemaType options augmentation

If you use plugins like [mongoose-autopopulate](https://github.com/mongodb-js/mongoose-autopopulate),
you can augment the global interface `SchemaTypeOptions` to have new options in the `@Field` API.

```ts
declare global {
  namespace RefletMongoose {
    interface SchemaTypeOptions {
      autopopulate: boolean
    }
  }
}
```

Now you have access to `autopopulate` option in your schemas:

```ts
@Model()
class User extends Model.Interface {
  @Field({
    type: mongoose.Schema.Types.ObjectId,
    ref: Company,
    autopopulate: true
  })
  company: Company
}
```

_Every option defined this way will be optional in the schemas._

### References narrowing

[SchemaType `ref` option](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-ref) can be either a Model or a model name. With Reflet, by default, any class can be passed as a Model and any string can be passed as a model name.

By augmenting the global interface `Ref`, you can:

* Narrow the class to an union of your models.
* Narrow the string to an union of your models' names.

```ts
// company.model.ts
@Model()
class Company extends Model.Interface {
  @Field(String)
  name: string
}

// You should augment the global interface in each of your models' files, to keep it close to the model.
declare global {
  namespace RefletMongoose {
    interface Ref {
      Company: Company
    }
  }
}
```

```ts
// user.model.ts
@Model()
class User extends Model.Interface {
  @Field({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  })
  company: Company
}

declare global {
  namespace RefletMongoose {
    interface Ref {
      User: User
    }
  }
}
```
