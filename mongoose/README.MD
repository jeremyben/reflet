# `@reflet/mongoose` 🌠

[![lines coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=lines&query=total.lines.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![statements coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=statements&query=total.statements.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![functions coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=functions&query=total.functions.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)
[![branches coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jeremyben/reflet/master/mongoose/coverage-summary.json&label=branches&query=total.branches.pct&color=brightgreen&suffix=%&logo=jest)](./coverage-summary.json)

> [!IMPORTANT]  
> Upgrade from **v1** to **v2** : [Migration guide](https://github.com/jeremyben/reflet/blob/master/mongoose/MIGRATION.md)

The **best** decorators for [Mongoose](https://mongoosejs.com/). Have a look at [Reflet's philosophy](../README.MD#Philosophy-).

* [Getting started](#getting-started)
* [Schema definition](#schema-definition)
* [Model](#model)
* [Schema options](#schema-options)
* [Schema retrieval](#schema-retrieval)
* [Hooks](#hooks)
* [Model discriminators](#model-discriminators)
* [Embedded discriminators](#embedded-discriminators)
* [Virtuals](#virtuals)
* [Plain helper](#plain-helper)
* [Augmentations](#augmentations)

## Getting started

1. Enable experimental decorators in TypeScript compiler options.<br>_No need to install "reflect-metadata"._

    ```json
    "experimentalDecorators": true,
    ```

2. Install the package along with peer dependencies.

    ```sh
    npm i @reflet/mongoose mongoose
    ```

3. Create your decorated models.

    ```ts
    // user.model.ts
    import { Model, Field } from '@reflet/mongoose'

    @Model()
    export class User extends Model.I {
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
    import * as mongoose from 'mongoose'
    import { User } from './user.model.ts'

    mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true })

    User.create({ email: 'jeremy@example.com' }).then((user) => {
      console.log(`User ${user._id} has been saved.`)
    })
    ```

### The Mongoose way

Connect Mongoose in the way you already know. Models defined with Reflet will simply be attached to the default Mongoose connection.
This means you can **progressively** decorate your Mongoose models. 😉

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

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
class User extends Model.Interface {
  @Field({ type: String, required: true })
  email: string
}

const user = await User.create({
  email: 'jeremy@example.com '
})




```

  </td>
  <td>

```ts
interface UserDocument extends mongoose.Document {
  email: string
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true }
})

const User = mongoose.model<UserDocument>('User', userSchema)

const user = await User.create({
  email: 'jeremy@example.com '
})
```

  </td>
</tr>
<tbody>
</table>

⚠️ `@Model` should always be at the top of your class decorators. _Why? Because decorators are executed bottom to top, so if `@Model` directly compiles your class into a Mongooose Model, other class decorators won't be properly applied. Reflet will warn you with its own decorators._

#### Correct model and document interface

Your class needs to inherit a special empty class, **`Model.Interface`** or **`Model.I`**, to have Mongoose document properties and methods.

#### Custom collection name

By default, Mongoose automatically creates a collection named as the plural, lowercased version of your model name. You can customize the collection name, with the first argument:

```ts
@Model('people')
class User extends Model.I {
  @Field({ type: String, required: true })
  email: string
}
```

#### Custom Mongoose connection

You can use a different database by creating a Mongoose connection and passing it as the second argument:

```ts
const otherDb = mongoose.createConnection('mongodb://localhost/other', { useNewUrlParser: true })

@Model(undefined, otherDb)
class User extends Model.I {
  @Field({ type: String, required: true })
  email: string
}
```

## Schema options

> 🔦 `@SchemaOptions(options)`<br>
> 💫 Related Mongoose object: [Schema options](https://mongoosejs.com/docs/guide#options)

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
@SchemaOptions({
  autoIndex: false,
  strict: 'throw'
})
class User extends Model.I {           
  @Field(String)
  name: string
}




```

  </td>
  <td>

```ts
interface UserDocument extends mongoose.Document {
  name: string
}

const userSchema = new mongoose.Schema(
  { name: String },
  {
    autoIndex: false,
    strict: 'throw'
  }
)

const User = mongoose.model<UserDocument>('User', userSchema)
```

  </td>
</tr>
<tbody>
</table>

The `@SchemaOptions` API is a direct wrapper of Mongoose [schema options](https://mongoosejs.com/docs/guide#options), you can put in there everything that you used to.

### Timestamps

> 🔦 `@CreatedAt`, `@UpdatedAt`<br>
> 💫 Related Mongoose option property: [`timestamps`](https://mongoosejs.com/docs/guide#timestamps)

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
@SchemaOptions({ minimize: false })
class User extends Model.I {             
  @Field(String)
  name: string

  @CreatedAt
  creationDate: Date

  @UpdatedAt
  updateDate: Date
}






```

  </td>
  <td>

```ts
interface UserDocument extends mongoose.Document {
  name: string
  creationDate: Date
  updateDate: Date
}

const userSchema = new mongoose.Schema(
  { name: String },
  {
    minimize: false,
    timestamps: {
      createdAt: 'creationDate',
      updatedAt: 'updateDate'
    },
  }
)

const User = mongoose.model<UserDocument>('User', userSchema)
```

  </td>
</tr>
<tbody>
</table>

### Advanced schema manipulation

> 🔦 `@SchemaCallback(callback)`<br>
> 💫 Related Mongoose object: [`Schema`](https://mongoosejs.com/docs/api/schema)

If you need more advanced schema manipulation before `@Model` compiles it, you can use `@SchemaCallback`:

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
@SchemaCallback((schema) => {
  schema.index({ name: 1, type: -1 })
})
class Animal extends Model.I {          
  @Field(String)
  name: string

  @Field(String)
  type: string
}


```

  </td>
  <td>

```ts
interface AnimalDocument extends mongoose.Document {
  name: string
  type: string
}

const userSchema = new mongoose.Schema({
  name: String,
  type: String
})

userSchema.index({ name: 1, type: -1 })

const Animal = mongoose.model<AnimalDocument>('Animal', userSchema)
```

  </td>
</tr>
<tbody>
</table>

_Beware of defining hooks in the callback if your schema has embedded discriminators. Mongoose documentation recommends declaring hooks **before** embedded discriminators, the callback is applied **after** them. You should use the dedicated hooks decorators `@PreHook` and `@PostHook`._

## Schema retrieval

> 🔦 `schemaFrom(class)`

You can retrieve a schema from any decorated class, for advanced manipulation or embedded use in another schema.

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@SchemaOptions({ _id: false })
abstract class Location {
  @Field(Number)
  lat: number

  @Field(Number)
  lng: number
}

@Model()
class City extends Model.I {            
  @Field(String)
  name: string

  @Field(schemaFrom(Location))
  location: Location
}

const citySchema = schemaFrom(City)
```

  </td>
  <td>

```ts
interface CityDocument extends mongoose.Document {
  name: string
  location: {
    lat: number,
    lng: number
  }
}

const locationSchema = new mongoose.Schema(
  { lat: Number, lng: Number },
  { _id: false }
)

const citySchema = new mongoose.Schema({
  name: String,
  location: locationSchema
})

const City = mongoose.model<CityDocument>('City', citySchema)
```

  </td>
</tr>
<tbody>
</table>

🗣️ As a good practice, you should make your schema-only classes `abstract`, so you don't instantiate them by mistake.


### Sub schemas

> 🔦 `Field.Schema(class)`

As an alternative for the above use of `schemaFrom` inside the `Field` decorator, you can do:

```ts
@Model()
class City extends Model.I {            
  @Field.Schema(Location)
  location: Location
}
```

## Hooks

### Pre hook

> 🔦 `@PreHook(method, callback)`<br>
> 💫 Related Mongoose method: [`schema.pre`](https://mongoosejs.com/docs/middleware#pre)

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
@PreHook<User>('save', function(next) {
  next()
})
class User extends Model.I {     
  @Field(String)
  name: string
}



```

  </td>
  <td>

```ts
interface UserDocument extends mongoose.Document {
  name: string
}

const userSchema = new mongoose.Schema({ name: String })

userSchema.pre<UserDocument>('save', function (doc, next) {
  next()
})

const User = mongoose.model<UserDocument>('User', userSchema)
```

  </td>
</tr>
<tbody>
</table>

The `@PreHook` API is a direct wrapper of Mongoose [Schema.pre method](https://mongoosejs.com/docs/api/schema#schema_Schema-pre), you can put in there everything that you used to.

Successive `@PreHook` will be applied in the order they are written, even though decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).

### Post hook

> 🔦 `@PostHook(method, callback)`<br>
> 💫 Related Mongoose method: [`schema.post`](https://mongoosejs.com/docs/middleware#post)

<table>
<thead>
<tr>
  <th>Reflet</th>
  <th>Mongoose equivalent</th>
</tr>
</thead>
<tbody>
<tr>
  <td>

```ts
@Model()
@PostHook<User>('find', function(result) {
  console.log(result)
})
class User extends Model.I {     
  @Field(String)
  name: string
}



```

  </td>
  <td>

```ts
interface UserDocument extends mongoose.Document {
  name: string
}

const userSchema = new mongoose.Schema({ name: String })

userSchema.post<UserDocument>('find', function (result) {
  console.log(result)
})

const User = mongoose.model<UserDocument>('User', userSchema)
```

  </td>
</tr>
<tbody>
</table>

The `@PostHook` API is a direct wrapper of Mongoose [Schema.post method](https://mongoosejs.com/docs/api/schema#schema_Schema-post), you can put in there everything that you used to.

Successive `@PostHook` will be applied in the order they are written, even though decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).

#### Post error handling middleware

To help the compiler accurately infer the [error handling middleware](https://mongoosejs.com/docs/middleware#error-handling-middleware) signature, pass a second type argument to `@PostHook`:

```ts
@Model()
@PostHook<User, Error>('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next()
  }
})
class User extends Model.I {
  @Field(String)
  name: string
}
```

## Model discriminators

> 🔦 `@Model.Discriminator(rootModel)`<br>
> 💫 Related Mongoose method: [`model.discriminator`](https://mongoosejs.com/docs/discriminators#the-model-discriminator-function)

```ts
@Model()
class User extends Model.I {
  @Field(String)
  name: string
}

@Model.Discriminator(User)
class Worker extends User {
  @Field(String)
  job: string

  // No need to decorate the default discriminatorKey.
  __t: 'Worker'

  // You can strictly type the constructor of a discriminator model by using the Plain Helper (see below).
  constructor(worker: Plain.Omit<Worker, '_id' | '__t'>) {
    super() // required by the compiler.
  }
}

const worker = await Worker.create({ name: 'Jeremy', job: 'developer' })
// { _id: '5d023ae14043262bcfd9b384', __t: 'Worker', name: 'Jeremy', job: 'developer' }
```

As you know, `_t` is the default `discriminatorKey`, and its value will be the class name. If you want to customize both the key and the value, check out the following `@Kind` decorator.

⚠️ `@Model.Discriminator` should always be at the top of your class decorators. _Why? Because decorators are executed bottom to top, so if `@Model.Discriminator` directly compiles your class into a Mongooose Model, other class decorators won't be properly applied. Reflet will warn you with its own decorators._

### Kind / DiscriminatorKey

> 🔦 `@Kind(value?)` alias `@DiscriminatorKey`<br>
> 💫 Related Mongoose option property: [`discriminatorKey`](https://mongoosejs.com/docs/discriminators#the-model-discriminator-function)

Mongoose `discriminatorKey` is usually defined in the parent model options, and appears in the children model documents.
`@Kind` (or its alias `@DiscriminatorKey`) exists to define `discriminatorKey` **directly** on the children class instead of the parent model.

```ts
@Model()
class User extends Model.I {
  @Field(String)
  name: string
}

@Model.Discriminator(User)
class Developer extends User {
  @Kind
  kind: 'Developer' // Value will be the class name by default.
}

@Model.Discriminator(User)
class Doctor extends User {
  @Kind('doctor') // Customize the discriminator value by passing a string.
  kind: 'doctor'
}

// This is equivalent to setting `{ discriminatorKey: 'kind' }` on User schema options.
```

A mecanism will check and prevent you from defining a different `@Kind` key on sibling discriminators.

## Embedded discriminators

### Single nested discriminators

> 🔦 `@Field.Union(classes[], options?)`<br>
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
class Shape extends Model.I {
  @Field.Union([Circle, Square], { 
    required: true, // Make the field itself `shape` required.
    strict: true // Make the discriminator key `__t` required and narrowed to its possible values.
  })
  shape: Circle | Square
}

const circle = new Shape({ shape: { __t: 'Circle', radius: 5 } })
const square = new Shape({ shape: { __t: 'Square', side: 4 } })
```

### Embedded discriminators in arrays

> 🔦 `@Field.ArrayOfUnion(classes[], options?)`<br>
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
class Batch extends Model.I {
  @Field.ArrayOfUnion([Clicked, Purchased], { 
    strict: true  // Make the discriminator key `kind` required and narrowed to its possible values.
  })
  events: (Clicked | Purchased)[]
}

const batch = new Batch({
  events: [
    { kind: 'Clicked', element: '#hero', message: 'hello' },
    { kind: 'Purchased', product: 'action-figure', message: 'world' },
  ]
})
```

## Virtuals

> 🔦 `@Virtual`<br>
> 💫 Related Mongoose method: [`schema.virtual`](https://mongoosejs.com/docs/guide.html#virtuals)

`@Virtual` helps you define a writable [virtual property](https://mongoosejs.com/docs/guide.html#virtuals) (both a getter and a setter), which is properly serialized with `toJson: { virtuals: true }`, and not saved to the database.<br>_Can be used with or without invokation._

```ts
@Model()
@SchemaOptions({ 
  toObject: { virtuals: true },
  toJson: { virtuals: true }
})
class S3File extends Model.I {
  @Field(String)
  key: string

  @Virtual
  url: string
}

const photo = await S3File.findOne({ key })
photo.url = await getSignedUrl(photo.key)
res.send(photo)
```

### Populated virtuals

> 🔦 `@Virtual.Populate(options)`<br>
> 💫 Related Mongoose method: [`schema.virtual`](https://mongoosejs.com/docs/populate#populate-virtuals)

`@Virtual.Populate` helps you define [populate virtuals](https://mongoosejs.com/docs/populate#populate-virtuals).

```ts
@Model()
class Person extends Model.I {
  @Field(String)
  name: string

  @Field(String)
  band: string
}

@Model()
@SchemaOptions({
  toObject: { virtuals: true },
  toJson: { virtuals: true }
})
class Band extends Model.I {
  @Field(String)
  name: string

  @Virtual.Populate<Band, Person>({
    ref: 'Person',
    foreignField: 'band',
    localField: 'name'
  })
  readonly members: string[]
}

const bands = await Band.find({}).populate('members')
```

## Plain helper

> 🔦 `Plain<class, options?>`

Reflet provides a generic type to discard Mongoose properties and methods from a Document.

* `Plain<T>` removes inherited Mongoose properties (except `_id`) and all methods from `T`.
* `Plain.Partial<T>` does the same as `Plain` and makes remaining properties of `T` optional.
* `Plain.PartialDeep<T>` does the same as `Plain.Partial` recursively.

`Plain` also has a second type argument to omit other properties and/or make them optional:

* `Plain<T, { Omit: keyof T; Optional: keyof T } >`

_These options exist as standalone generics as well: `Plain.Omit<T, keyof T>` and `Plain.Optional<T, keyof T>`._

With this you can narrow the return type of `toObject()` and `toJson()`:

```ts
const userPlain = user.toObject({ getters: false }) as Plain.Omit<User, 'fullname'>
```

#### Allow `string` for `ObjectId`

> 🔦 `Plain.AllowString<class, options?>`

When creating or querying documents, you can pass `ObjectId` as `string`. To allow this, Reflet provides a generic type with the same API as `Plain`:

* `Plain.AllowString<T, { Omit: keyof T; Optional: keyof T } >`
* `Plain.AllowString.Partial<T>`
* `Plain.AllowString.PartialDeep<T>`

### One document, multiple shapes

In each of your models, some fields might be present when you read the document from the database, but optional or even absent when you create it. 😕

Given the following model:

```ts
@Model()
class User extends Model.I {
  @Field({ type: String, required: true })
  firstname: string

  @Field({ type: String, required: true })
  lastname: string

  @Field({ type: Boolean, default: () => false })
  activated: boolean

  @CreatedAt
  createdAt: Date

  get fullname() {
    return `${this.firstname} ${this.lastname}`
  }
}
```

This is how you can type `constructor` and `create` parameters:

```ts
type NewUser = Plain.AllowString<User, { Omit: 'fullname' | 'createdAt'; Optional: '_id' | 'activated' }>

@Model()
class User extends Model.I<typeof User>  {
  // @ts-ignore implementation
  constructor(doc?: NewUser, strict?: boolean | 'throw')
}

const user = new User({ firstname: 'John', lastname: 'Doe' })
await user.save()
await User.create({ firstname: 'Jeremy', lastname: 'Doe', activated: true })
```

By passing `typeof User` to `Model.I`, Reflet is now able to use the constructor signature to type the following static methods: `create`, `insertMany` and `replaceOne`.

_The compiler checks `NewUser` as we need, so you can safely use ts-ignore on the `constructor` to avoid implementing an empty one (remember that `@Model` will replace it with mongoose Model constructor)._

## Augmentations

Reflet comes with a dedicated global namespace `RefletMongoose`, so you can augment or narrow specific types.

### SchemaType options augmentation

If you use plugins like [mongoose-autopopulate](https://github.com/mongodb-js/mongoose-autopopulate),
you can augment the global interface `SchemaTypeOptions` to have new options in the `@Field` API.

```ts
declare global {
  namespace RefletMongoose {
    interface SchemaTypeOptions {
      autopopulate?: boolean
    }
  }
}
```

Now you have access to `autopopulate` option in your schemas:

```ts
@Model()
class User extends Model.I {
  @Field({
    type: mongoose.Schema.Types.ObjectId,
    ref: Company,
    autopopulate: true
  })
  company: Company
}
```

#### Virtual options

The same can be done with the `@Virtual` decorator:

```ts
declare global {
  namespace RefletMongoose {
    interface VirtualOptions {}
  }
}
```

### Model and Document augmentation

You can augment `Model` and `Document` interfaces with the dedicated global interfaces.
Here is an example with the [@casl/mongoose](https://github.com/stalniy/casl/tree/master/packages/casl-mongoose) plugin:

```ts
declare global {
  namespace RefletMongoose {
    interface Model {
      accessibleBy<T extends mongoose.Document>(ability: AnyMongoAbility, action?: string): mongoose.DocumentQuery<T[], T>
    }
    interface Document {}
  }
}
```

### References narrowing

[SchemaType `ref` option](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-ref) can be either a Model or a model name. With Reflet, by default, any class can be passed as a Model and any string can be passed as a model name.

By augmenting the global interface `Ref`, you can:

* Narrow the class to an union of your models.
* Narrow the string to an union of your models' names.

```ts
// company.model.ts
@Model()
class Company extends Model.I {
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
class User extends Model.I {
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
