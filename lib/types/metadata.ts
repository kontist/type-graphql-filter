import { GraphQLScalarType } from "graphql";

import { FilterOperator } from ".";

export type ReturnTypeFunc = (type?: void) => GraphQLScalarType | Function;

export type FiltersCollectionType = {
  target: Function;
  field: string | symbol;
  operators: FilterOperator[];
  getReturnType?: ReturnTypeFunc;
};

export type MetadataStorage = {
  filters: FiltersCollectionType[];
};
