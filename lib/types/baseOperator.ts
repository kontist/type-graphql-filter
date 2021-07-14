import { registerEnumType } from "type-graphql";

export enum BaseOperator {
  OR = "or",
  AND = "and"
}

registerEnumType(BaseOperator, { name: "BaseOperator" });
