# type-graphql-filter
Filter decorator for [type-graphql](https://typegraphql.ml/).


## Usage

Just add the `@Filter` decorator to the fields that should be filterable.

```typescript
import { Field } from "type-graphql-filter";

@ObjectType("Example")
export class Example

  @Field()
  @Filter(["eq", "ne", "like", "likeAny", "in"])
  myField: string;

}
```


Then add the filter as an argument to your resolver.
```typescript
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
      filter // handle the filter in your code
    });
  }
}
```

This will automatically create some `InputTypes`:

```graphql
type ExampleFilter {
    ...
}
```
