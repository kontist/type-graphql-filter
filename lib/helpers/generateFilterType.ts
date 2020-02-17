import { Field, InputType } from "type-graphql";
import { getMetadataStorage as getTypeGraphQLMetadataStorage } from "type-graphql/dist/metadata/getMetadataStorage";

import { getMetadataStorage } from "../metadata/getMetadataStorage";
import { ARRAY_RETURN_TYPE_OPERATORS, BaseOperator } from "../types";

/**
 * Generate a type-graphql InputType from a @ObjectType decorated
 * class by calling the @InputType and @Field decorators
 *
 * This should be used to generate the type of the @Arg
 * decorator on the corresponding resolver.
 *
 * @param type
 */
export const generateFilterType = (type: Function) => {
  const metadataStorage = getMetadataStorage();
  const filtersData = metadataStorage.filters.filter((f) => f.target === type);

  const typeGraphQLMetadata = getTypeGraphQLMetadataStorage();

  const objectTypesList = typeGraphQLMetadata.objectTypes;
  const graphQLModel = objectTypesList.find((ot) => ot.target === type);

  if (!graphQLModel) {
    throw new Error(
      `Please decorate your class "${type}" with @ObjectType if you want to filter it`,
    );
  }

  // Create a new empty class with the "<graphQLModel.name>Condition" name
  const conditionTypeName = graphQLModel.name + "Condition";
  const conditionTypeContainer = {
    [conditionTypeName]: class {},
  };

  // Call the @InputType decorator on that class
  InputType()(conditionTypeContainer[conditionTypeName]);

  // Simulate creation of fields for this class/InputType by calling @Field()
  for (const { field, operators, getReturnType } of filtersData) {
    // When dealing with methods decorated with @Field, we need to lookup the GraphQL
    // name and use that for our filter name instead of the plain method name
    const graphQLField = typeGraphQLMetadata.fieldResolvers.find(
      (fr) => fr.target === type && fr.methodName === field,
    );

    const fieldName = graphQLField ? graphQLField.schemaName : field;

    Field(() => BaseOperator, { nullable: true })(
      conditionTypeContainer[conditionTypeName].prototype,
      "operator",
    );

    for (const operator of operators) {
      const baseReturnType =
        typeof getReturnType === "function" ? getReturnType() : String;
      const returnTypeFunction = ARRAY_RETURN_TYPE_OPERATORS.includes(operator)
        ? () => [baseReturnType]
        : () => baseReturnType;

      Field(returnTypeFunction, { nullable: true })(
        conditionTypeContainer[conditionTypeName].prototype,
        `${String(fieldName)}_${operator}`,
      );
    }
  }

  // Extend the Condition type to create the final Filter type
  const filterTypeName = graphQLModel.name + "Filter";
  const filterTypeContainer = {
    [filterTypeName]: class extends conditionTypeContainer[conditionTypeName] {},
  };

  InputType()(filterTypeContainer[filterTypeName]);

  Field(() => [conditionTypeContainer[conditionTypeName]], {
    nullable: true,
  })(filterTypeContainer[filterTypeName].prototype, "conditions");

  return () => filterTypeContainer[filterTypeName];
};
