// WHERE STATEMENT

export type AggreeateFunction =
  "MEAN" | "MEDIAN" | "MIN" | "MAX" | "SUM" | "COUNT"

export type Operator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "~"
  | "IN"
  | "+"
  | "-"
  | "*"
  | "/"
  | "AND"
  | "OR"

export type PrimaryOperand = {
  value:
    | {
        type: "LITERAL"
        value: number | string | boolean | Date
      }
    | {
        type: "ARRAY"
        value: number[] | string[] | boolean[] | Date[]
        function?: AggreeateFunction
      }
    | {
        type: "ENTITYSELECTOR"
        value: EntitySelector
        function?: AggreeateFunction
      }
    | {
        type: "CONNECTIONSELECTOR"
        value: ConnectionSelector
        function?: AggreeateFunction
      }
}

export type Expression =
  | {
      type: "NOT" | "NEUTRAL"
      subject: Expression | PrimaryOperand
    }
  | {
      type: "MULTI"
      operators: Operator[]
      subjects: (Expression | PrimaryOperand)[]
    }
  | {
      type: "TRANVERSAL"
      operators: Operator[]
      hop?: number // Số thực thể trung gian, bao gồm 2 thực thể đầu và cuối
      subjectType: "SELF" | "NEIGHBORS"
      subjects: (Expression | PrimaryOperand)[]
    }

// ENTITY SELECT STATEMENT

export type EntitySelector = {
  template?: string[] // ID
  record: string // name
}

// CONNECTION SELECT STATEMENT

export type ConnectionSelector = {
  template?: string[] // ID
  record: string // name
}

// ENTITY QUERY STATEMENT

export type EntityQuery = {
  where: Expression
}

// PATH QUERY STATEMENT
// Luôn tìm path ngắn nhất
export type PathQuery = {
  from: string // Entity ID
  to: string // Entity ID
  via?: ConnectionSelector[] // Giới hạn ConnectionSelector được phép đi qua
}
