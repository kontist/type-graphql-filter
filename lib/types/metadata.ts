import { ClassType } from "type-graphql";
import { FilterOperator } from ".";
import { GraphQLScalarType } from "graphql";
import { RecursiveArray } from "type-graphql/dist/decorators/types";

export type ReturnTypeFunc = (type?: void) => ClassType | GraphQLScalarType | Function | object | symbol;

export type FiltersCollectionType = {
  target: Function;
  field: string | symbol;
  operators: FilterOperator[];
  getReturnType?: ReturnTypeFunc | RecursiveArray<ReturnTypeFunc>;
};

export type MetadataStorage = {
  filters: FiltersCollectionType[];
};
