# type-graphql-filter
Filter decorator for [type-graphql](https://typegraphql.ml/).

It will allow you to generate standardized filterable queries simply by decorating the fields that should be filterable with `@Filter`, and adding an `Arg` decorator to the relevant query.

The input types for your schema will be generated automatically based on the name of your type-graphql `ObjectType`.

It is useful if you have several type of filterable entities in your schema and you want to provide a unified interface to filter them without having to maintain and duplicate the logic and the InputTypes manually.

## Usage

Just add the `@Filter` decorator to the fields that should be filterable.

```typescript
import { Field, ObjectType, GraphQLISODateTime, Int } from "type-graphql";
import { Filter } from "type-graphql-filter";

@ObjectType("Example")
export class ExampleModel {

  @Field()
  @Filter(["eq", "ne", "like", "likeAny", "in"])
  myField: string;

  @Field(type => Int)
  @Filter(["lt", "gt", "eq", "ne", "in"], type => Int)
  numberField: number;

  @Field(type => GraphQLISODateTime)
  @Filter(["eq", "ne", "gt", "lt"], type => GraphQLISODateTime)
  dateField: Date;
}
```


Then add the filter as an argument to your resolver.
```typescript
import { Resolver, FieldResolver, Root, Arg } from "type-graphql";
import { generateFilterType } from "type-graphql-filter";

@Resolver(of => Parent)
export class ParentExamplesResolver {
  @FieldResolver(type => Example[])
  examples(
    @Root() parent: Parent,

    // add the filter here as parameter
    @Arg("filter", generateFilterType(Example))
    filter: any

  ) {
    return new ExampleLoader().load({
      filter // handle the filter with your business logic
    });
  }
}
```

This will automatically generate the `InputType`:

```graphql
type ExampleFilter {
    ...
}
```
