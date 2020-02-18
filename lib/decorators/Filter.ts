import { getMetadataStorage } from "../metadata";
import { FilterOperator, ReturnTypeFunc } from "../types";

/**
 * This decorator will store filters information for the field in a metadata storage.
 * We will use this metadata later on to generate an InputType for the filters argument
 *
 * @param operators
 * @param returnTypeFunction
 */
export function Filter(
  operators: FilterOperator | FilterOperator[],
  returnTypeFunction?: ReturnTypeFunc,
): PropertyDecorator {
  return (prototype, field: string | symbol) => {
    const metadataStorage = getMetadataStorage();

    metadataStorage.filters.push({
      field,
      getReturnType: returnTypeFunction,
      operators: typeof operators === "string" ? [operators] : operators,
      target: prototype.constructor,
    });
  };
}
