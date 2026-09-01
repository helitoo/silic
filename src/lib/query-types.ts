// WHERE STATEMENT

export type AggreeateFunction =
  | "MEAN"
  | "MEDIAN"
  | "MIN"
  | "MAX"
  | "SUM"
  | "COUNT"

export type DateFunction =
  | "MONTH"
  | "DAY"
  | "YEAR"
  | "HOUR"
  | "MINUTE"
  | "SECOND"

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

export type RecordSelector = {
  template?: string[] | "*" // Template IDs/names or "*"
  record: string // Record field name
}

// Backward compatibility aliases
export type EntitySelector = RecordSelector
export type ConnectionSelector = RecordSelector

export type TemplateSelector = {
  template: string // Template name or ID
}

export type PrimaryOperand = {
  value:
    | {
        type: "LITERAL"
        value: number | string | boolean | Date
        dateFunction?: DateFunction
      }
    | {
        type: "ARRAY"
        value: number[] | string[] | boolean[] | Date[]
        function?: AggreeateFunction
      }
    | {
        type: "RECORDSELECTOR" | "ENTITYSELECTOR" | "CONNECTIONSELECTOR"
        value: RecordSelector
        function?: AggreeateFunction
        dateFunction?: DateFunction
      }
    | {
        type: "TEMPLATESELECTOR"
        value: TemplateSelector
      }
    | {
        type: "TEMPLATE"
        value?: string
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
      connection?: (Expression | PrimaryOperand)[] // Điều kiện của các record trong connection
      subjects: (Expression | PrimaryOperand)[] // Điều kiện của target entity
    }

// ENTITY QUERY STATEMENT

export type EntityQuery = {
  where: Expression
}

// PATH QUERY STATEMENT
// Path Constraint Quantifiers
export type PathConstraintQuantifier =
  | "AT_LEAST_ONE" // Default implicit quantifier (>= 1 occurrence)
  | "AVOID" // 0 TIMES (No occurrences permitted)
  | "ALL_TIMES" // ONLY (All items must match, overriding others)
  | { times: number } // n TIMES (Exact occurrence count)

export type PathItemType = "CONNECTION" | "ENTITY" | "ANY"

export type PathExpression =
  | {
      type: "PATH_SEQUENCE" // A << B (A appears before B in path)
      left: PathExpression
      right: PathExpression
    }
  | {
      type: "PATH_OR" // A || B (At least one of A or B in path)
      left: PathExpression
      right: PathExpression
    }
  | {
      type: "PATH_AND" // A AND B (Both conditions in path)
      left: PathExpression
      right: PathExpression
    }
  | {
      type: "PATH_ARROW" // (connectionExpr) <-- (entityExpr)
      connectionExpr?: PathExpression
      entityExpr?: PathExpression
    }
  | {
      type: "PATH_CONSTRAINT"
      quantifier?: PathConstraintQuantifier
      targetType?: PathItemType
      expression: Expression | PrimaryOperand
    }

// Luôn tìm path ngắn nhất thỏa mãn điều kiện
export type PathQuery = {
  from: string // Entity ID
  to: string // Entity ID
  code?: string // Raw SILIC path query string
  where?: PathExpression // Structured AST path conditions
  via?: RecordSelector[] // Giới hạn RecordSelector được phép đi qua
}

