# type-graphql-filter
Filter decorator for [type-graphql](https://typegraphql.com/).

It will allow you to generate standardized filterable queries simply by decorating the fields that should be filterable with `@Filter`, and decorating the relevant query with an extra `@Arg` decorator.

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
import { ExampleModel } from "./models";

@Resolver(of => Parent)
export class ParentExamplesResolver {
  @FieldResolver(type => ExampleModel[])
  examples(
    @Root() parent: Parent,

    // add the filter here as parameter
    @Arg("filter", generateFilterType(ExampleModel))
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

The goal of this module is to generate the filter types for your graphql schema, however it is not aware of your business logic, so what you do with the filter you received from the query is up to you.

For a simplified example, you could consider writing such a function, passing it the filter object:

```typescript
const generateCondition = (filter) => {
    for (const [filterKey, value] of Object.entries(filters)) {
          const [field, operator] = filterKey.split("_");

         // from that point on, if the filter in your query was { firstname_like: "john" } you have:
         // - the name of the field as 'field' variable, i.e. "firstname"
         // - the operator to filter this field as 'operator' variable, i.e. "like"
         // - the value of the filter as 'value' variable, i.e. "john"
    }
}
```