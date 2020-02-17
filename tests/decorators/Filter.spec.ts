import "reflect-metadata";
import expect from "expect";

import { Field, ObjectType, Int } from "type-graphql";
import { Filter } from "../../lib/decorators";
import { getMetadataStorage } from "../../lib/metadata";

describe("@Filter", () => {
  @ObjectType("FilterName")
  class FilterableType {
    @Field(type => Int)
    @Filter(["lt", "gt"], type => Int)
    filteredNumberField: number;

    @Field(type => String)
    @Filter(["eq", "like"])
    filteredStringField: string;
  }

  it("should store proper metadata for decorated fields", () => {
    const metadataStorage = getMetadataStorage();

    const numberFieldMetadata =
      metadataStorage.filters.find(
        filter =>
          filter.target === FilterableType &&
          filter.field === "filteredNumberField"
      ) || ({} as any);
    expect(numberFieldMetadata).toMatchObject({
      target: FilterableType,
      field: "filteredNumberField",
      operators: ["lt", "gt"]
    });

    expect(typeof numberFieldMetadata.getReturnType).toEqual("function");

    expect(numberFieldMetadata.getReturnType()).toEqual(Int);

    const stringFieldMetadata = metadataStorage.filters.find(
      filter =>
        filter.target === FilterableType &&
        filter.field === "filteredStringField"
    );
    expect(stringFieldMetadata).toEqual({
      target: FilterableType,
      field: "filteredStringField",
      operators: ["eq", "like"],
      getReturnType: undefined
    });
  });
});
