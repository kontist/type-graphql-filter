import { registerEnumType } from "type-graphql";

export enum BaseOperator {
  OR = "or",
  AND = "and",
  NOT = "not"
}

registerEnumType(BaseOperator, { name: "BaseOperator" });
