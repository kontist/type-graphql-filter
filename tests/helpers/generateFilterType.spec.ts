import expect from "expect";

import {
  IntrospectionInputObjectType,
  graphql,
  getIntrospectionQuery,
  IntrospectionSchema,
  TypeKind,
  IntrospectionNamedTypeRef
} from "graphql";
import {
  Field,
  Resolver,
  Query,
  buildSchema,
  ObjectType,
  Int,
  Arg
} from "type-graphql";
import { generateFilterType } from "../../lib/helpers";
import { Filter } from "../../lib/decorators";

describe("generateFilterType", () => {
  let schemaIntrospection: IntrospectionSchema;

  before(async () => {
    @ObjectType("SomeName")
    class FilterableType {
      @Field(type => Int)
      @Filter(["lt", "gt"], type => Int)
      amount: number;

      @Field(type => String, { name: "purpose" })
      @Filter(["eq", "like"])
      getPurpose(): string {
        return "some purpose";
      }
    }

    @Resolver()
    class SampleResolver {
      @Query(() => FilterableType)
      filterableQuery(
        @Arg("filter", generateFilterType(FilterableType), { nullable: true })
        filter: any
      ): FilterableType {
        return new FilterableType();
      }
    }

    const schema = await buildSchema({
      resolvers: [SampleResolver]
    });
    const result = await graphql(schema, getIntrospectionQuery());
    schemaIntrospection = (result as any).data.__schema as IntrospectionSchema;
  });

  const assertFilterFields = (type: any) => {
    const operatorFieldType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "operator"
    ).type;
    expect(operatorFieldType.name).toEqual("BaseOperator");
    expect(operatorFieldType.kind).toEqual(TypeKind.ENUM);

    const amountGtType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "amount_gt"
    ).type;
    expect(amountGtType.name).toEqual("Int");
    expect(amountGtType.kind).toEqual(TypeKind.SCALAR);

    const amountLtType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "amount_lt"
    ).type;
    expect(amountLtType.name).toEqual("Int");
    expect(amountLtType.kind).toEqual(TypeKind.SCALAR);

    const purposeLikeType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "purpose_like"
    ).type;
    expect(purposeLikeType.name).toEqual("String");
    expect(purposeLikeType.kind).toEqual(TypeKind.SCALAR);

    const purposeEqType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "purpose_eq"
    ).type;
    expect(purposeEqType.name).toEqual("String");
    expect(purposeEqType.kind).toEqual(TypeKind.SCALAR);
  };

  it("should generate a proper condition type", () => {
    const conditionType = schemaIntrospection.types.find(
      type => type.name === "SomeNameCondition"
    ) as IntrospectionInputObjectType;

    expect(conditionType.inputFields.length).toEqual(5);

    assertFilterFields(conditionType);
  });

  it("should generate a proper filter type", () => {
    const filterType = schemaIntrospection.types.find(
      type => type.name === "SomeNameFilter"
    ) as IntrospectionInputObjectType;

    expect(filterType.inputFields.length).toEqual(6);

    const conditionsFieldType = (filterType as any).inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "conditions"
    ).type;
    expect(conditionsFieldType.kind).toEqual(TypeKind.LIST);
    expect(conditionsFieldType.ofType.kind).toEqual(TypeKind.NON_NULL);
    const conditionsItemFieldType = (conditionsFieldType.ofType)
      .ofType as IntrospectionInputObjectType;
    expect(conditionsItemFieldType.kind).toEqual(TypeKind.INPUT_OBJECT);
    expect(conditionsItemFieldType.name).toEqual("SomeNameCondition");

    assertFilterFields(filterType);
  });
});
