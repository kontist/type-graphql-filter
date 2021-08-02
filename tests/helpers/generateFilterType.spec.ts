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
    @ObjectType("SomeA")
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


    @ObjectType("SomeN")
    class NamedFilterableType extends FilterableType {
      @Field(type => String)
      @Filter(["eq"])
      name: string;
    }

    @ObjectType("SomeT")
    class TestFilterableType extends NamedFilterableType {
      @Field(type => String)
      @Filter(["ne"])
      test: string;
    }

    @ObjectType("AnotherQ")
    class AnotherFilterableType extends FilterableType {
      @Field(type => Int)
      @Filter(["lt", "gt"], type => Int)
      quantity: number;
    }

    @ObjectType()
    class B {
      @Field(type => String)
      @Filter(["eq"])
      test: "test";
    }
    @ObjectType()
    class H extends B { }
    @ObjectType()
    class L extends H { }
    @Resolver()
    class SampleResolver {
      @Query(() => FilterableType)
      filterableQuery(
        @Arg("filter", generateFilterType(FilterableType), { nullable: true })
        filter: any
      ): FilterableType {
        return new FilterableType();
      }

      @Query(() => NamedFilterableType)
      namedQuery(
        @Arg("filter", generateFilterType(NamedFilterableType), { nullable: true })
        filter: any
      ): NamedFilterableType {
        return new NamedFilterableType();
      }

      @Query(() => TestFilterableType)
      testQuery(
        @Arg("filter", generateFilterType(TestFilterableType), { nullable: true })
        filter: any
      ): TestFilterableType {
        return new TestFilterableType();
      }

      @Query(() => TestFilterableType)
      anotherQuery(
        @Arg("filter", generateFilterType(AnotherFilterableType), { nullable: true })
        filter: any
      ): AnotherFilterableType {
        return new AnotherFilterableType();
      }
    }

    @Resolver()
    class BHLResolver {

      @Query(() => FilterableType)
      lQuery(
        @Arg("filter", generateFilterType(L), { nullable: true })
        filter: any
      ): L {
        return new L();
      }

      @Query(() => FilterableType)
      hQuery(
        @Arg("filter", generateFilterType(H), { nullable: true })
        filter: any
      ): H {
        return new H();
      }

    }

    const schema = await buildSchema({
      resolvers: [SampleResolver, BHLResolver]
    });
    const result = await graphql(schema, getIntrospectionQuery());
    schemaIntrospection = (result as any).data.__schema as IntrospectionSchema;
  });

  const assertFilterFieldsT = (type: any) => {
    const testNeqType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "test_ne"
    ).type;
    expect(testNeqType.name).toEqual("String");
    expect(testNeqType.kind).toEqual(TypeKind.SCALAR);
  }
  const assertFilterFieldsN = (type: any) => {
    const nameEqType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "name_eq"
    ).type;
    expect(nameEqType.name).toEqual("String");
    expect(nameEqType.kind).toEqual(TypeKind.SCALAR);
  }
  const assertFilterFieldsQ = (type: any) => {

    const quantityGtType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "quantity_gt"
    ).type;
    expect(quantityGtType.name).toEqual("Int");
    expect(quantityGtType.kind).toEqual(TypeKind.SCALAR);

    const quantityLtType = type.inputFields.find(
      (field: IntrospectionNamedTypeRef) => field.name === "quantity_lt"
    ).type;
    expect(quantityLtType.name).toEqual("Int");
    expect(quantityLtType.kind).toEqual(TypeKind.SCALAR);
  }
  const assertFilterFieldsA = (type: any) => {
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

  describe('simple, amount and purpose', () => {

    it("should generate a proper condition type", () => {
      const conditionType = schemaIntrospection.types.find(
        type => type.name === "SomeACondition"
      ) as IntrospectionInputObjectType;

      expect(conditionType.inputFields.length).toEqual(5);

      assertFilterFieldsA(conditionType);
    });

    it("should generate a proper filter type", () => {
      const filterType = schemaIntrospection.types.find(
        type => type.name === "SomeAFilter"
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
      expect(conditionsItemFieldType.name).toEqual("SomeACondition");

      assertFilterFieldsA(filterType);
    });

  });

  describe('name, inherited (amount, purpose)', () => {
    it("should generate a proper condition type", () => {
      const conditionType = schemaIntrospection.types.find(
        type => type.name === "SomeNCondition"
      ) as IntrospectionInputObjectType;

      expect(conditionType.inputFields.length).toEqual(6);

      assertFilterFieldsN(conditionType);
      assertFilterFieldsA(conditionType);
    });
    it("should generate a proper filter type", () => {
      const filterType = schemaIntrospection.types.find(
        type => type.name === "SomeNFilter"
      ) as IntrospectionInputObjectType;

      expect(filterType.inputFields.length).toEqual(7);

      const conditionsFieldType = (filterType as any).inputFields.find(
        (field: IntrospectionNamedTypeRef) => field.name === "conditions"
      ).type;
      expect(conditionsFieldType.kind).toEqual(TypeKind.LIST);
      expect(conditionsFieldType.ofType.kind).toEqual(TypeKind.NON_NULL);
      const conditionsItemFieldType = (conditionsFieldType.ofType)
        .ofType as IntrospectionInputObjectType;
      expect(conditionsItemFieldType.kind).toEqual(TypeKind.INPUT_OBJECT);
      expect(conditionsItemFieldType.name).toEqual("SomeNCondition");

      assertFilterFieldsN(filterType);
      assertFilterFieldsA(filterType);
    });
  });
  describe('test, inherited (amount, purpose) and name', () => {
    it("should generate a proper condition type", () => {
      const conditionType = schemaIntrospection.types.find(
        type => type.name === "SomeTCondition"
      ) as IntrospectionInputObjectType;

      expect(conditionType.inputFields.length).toEqual(7);

      assertFilterFieldsT(conditionType);
      assertFilterFieldsN(conditionType);
      assertFilterFieldsA(conditionType);
    });
    it("should generate a proper filter type", () => {
      const filterType = schemaIntrospection.types.find(
        type => type.name === "SomeTFilter"
      ) as IntrospectionInputObjectType;

      expect(filterType.inputFields.length).toEqual(8);

      const conditionsFieldType = (filterType as any).inputFields.find(
        (field: IntrospectionNamedTypeRef) => field.name === "conditions"
      ).type;
      expect(conditionsFieldType.kind).toEqual(TypeKind.LIST);
      expect(conditionsFieldType.ofType.kind).toEqual(TypeKind.NON_NULL);
      const conditionsItemFieldType = (conditionsFieldType.ofType)
        .ofType as IntrospectionInputObjectType;
      expect(conditionsItemFieldType.kind).toEqual(TypeKind.INPUT_OBJECT);
      expect(conditionsItemFieldType.name).toEqual("SomeTCondition");

      assertFilterFieldsT(filterType);
      assertFilterFieldsN(filterType);
      assertFilterFieldsA(filterType);
    });
  });

  describe('quantity, inherited (amount, purpose)', () => {
    it("should generate a proper condition type", () => {
      const conditionType = schemaIntrospection.types.find(
        type => type.name === "AnotherQCondition"
      ) as IntrospectionInputObjectType;

      expect(conditionType.inputFields.length).toEqual(7);

      assertFilterFieldsQ(conditionType);
      assertFilterFieldsA(conditionType);
    });
    it("should generate a proper filter type", () => {
      const filterType = schemaIntrospection.types.find(
        type => type.name === "AnotherQFilter"
      ) as IntrospectionInputObjectType;

      expect(filterType.inputFields.length).toEqual(8);

      const conditionsFieldType = (filterType as any).inputFields.find(
        (field: IntrospectionNamedTypeRef) => field.name === "conditions"
      ).type;
      expect(conditionsFieldType.kind).toEqual(TypeKind.LIST);
      expect(conditionsFieldType.ofType.kind).toEqual(TypeKind.NON_NULL);
      const conditionsItemFieldType = (conditionsFieldType.ofType)
        .ofType as IntrospectionInputObjectType;
      expect(conditionsItemFieldType.kind).toEqual(TypeKind.INPUT_OBJECT);
      expect(conditionsItemFieldType.name).toEqual("AnotherQCondition");

      assertFilterFieldsQ(filterType);
      assertFilterFieldsA(filterType);
    });
  });
  describe("hierarchy lookups", () => {
    it("finding correct model in hierarchy", () => {
      const name = "L";
      const conditionType = schemaIntrospection.types.find(
        type => type.name === `${name}Condition`
      ) as IntrospectionInputObjectType;
      const filterType = schemaIntrospection.types.find(
        type => type.name === `${name}Filter`
      ) as IntrospectionInputObjectType;
      expect(conditionType.name).toEqual("LCondition")
      expect(filterType.name).toEqual("LFilter")
    });
  });

});
