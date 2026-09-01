export class OperatorEngine {
  /**
   * Helper to check equality between two values (handles Dates, null/undefined, arrays)
   */
  public static isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }
    if (a instanceof Date && typeof b === "string") {
      return a.toISOString() === b || a.getTime() === new Date(b).getTime()
    }
    if (typeof a === "string" && b instanceof Date) {
      return new Date(a).getTime() === b.getTime() || a === b.toISOString()
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!this.isEqual(a[i], b[i])) return false
      }
      return true
    }
    // JS loose equality fallback if types differ (e.g. "5" == 5)
    // eslint-disable-next-line eqeqeq
    return a == b
  }

  /**
   * Fuzzy match implementation
   */
  public static fuzzyMatch(actual: unknown, expected: unknown): boolean {
    if (typeof actual === "string" && typeof expected === "string") {
      const act = actual.toLowerCase().trim()
      const exp = expected.toLowerCase().trim()
      return act.includes(exp)
    }
    // Non-string fallback to equality
    return this.isEqual(actual, expected)
  }

  /**
   * Compare a single scalar element with another scalar element
   */
  private static compareScalar(
    op: string,
    a: unknown,
    b: unknown
  ): boolean {
    if (a instanceof Date && b instanceof Date) {
      const ta = a.getTime()
      const tb = b.getTime()
      switch (op) {
        case "=":
          return ta === tb
        case "!=":
          return ta !== tb
        case ">":
          return ta > tb
        case "<":
          return ta < tb
        case ">=":
          return ta >= tb
        case "<=":
          return ta <= tb
      }
    }

    switch (op) {
      case "=":
        return this.isEqual(a, b)
      case "!=":
        return !this.isEqual(a, b)
      case ">":
        return (a as any) > (b as any)
      case "<":
        return (a as any) < (b as any)
      case ">=":
        return (a as any) >= (b as any)
      case "<=":
        return (a as any) <= (b as any)
      case "~":
        return this.fuzzyMatch(a, b)
      case "IN":
        if (Array.isArray(b)) {
          return b.some((item) => this.isEqual(a, item))
        }
        return this.isEqual(a, b)
      default:
        return false
    }
  }

  /**
   * Comparison operators (=, !=, >, <, >=, <=, ~, IN)
   */
  public static compare(
    operator: string,
    operandA: unknown,
    operandB: unknown
  ): boolean {
    const isArrayA = Array.isArray(operandA)
    const isArrayB = Array.isArray(operandB)

    // Case 1: One operand is Array, other is Primitive
    if (isArrayA && !isArrayB) {
      const arr = operandA as unknown[]
      switch (operator) {
        case "=":
          return arr.some((item) => this.compareScalar("=", item, operandB))
        case "!=":
          return arr.every((item) => this.compareScalar("!=", item, operandB))
        case ">":
          return arr.some((item) => this.compareScalar(">", item, operandB))
        case "<":
          return arr.some((item) => this.compareScalar("<", item, operandB))
        case ">=":
          return arr.some((item) => this.compareScalar(">=", item, operandB))
        case "<=":
          return arr.some((item) => this.compareScalar("<=", item, operandB))
        case "~":
          return arr.some((item) => this.compareScalar("~", item, operandB))
        case "IN":
          return arr.some((item) => this.isEqual(item, operandB))
        default:
          return false
      }
    }

    if (!isArrayA && isArrayB) {
      const arr = operandB as unknown[]
      switch (operator) {
        case "=":
          return arr.some((item) => this.compareScalar("=", operandA, item))
        case "!=":
          return arr.every((item) => this.compareScalar("!=", operandA, item))
        case ">":
          return arr.some((item) => this.compareScalar(">", operandA, item))
        case "<":
          return arr.some((item) => this.compareScalar("<", operandA, item))
        case ">=":
          return arr.some((item) => this.compareScalar(">=", operandA, item))
        case "<=":
          return arr.some((item) => this.compareScalar("<=", operandA, item))
        case "~":
          return arr.some((item) => this.compareScalar("~", operandA, item))
        case "IN":
          return arr.some((item) => this.isEqual(operandA, item))
        default:
          return false
      }
    }

    // Case 2: Both operands are Arrays
    if (isArrayA && isArrayB) {
      const arrA = operandA as unknown[]
      const arrB = operandB as unknown[]

      if (operator === "=") {
        return this.isEqual(arrA, arrB)
      }
      if (operator === "!=") {
        return !this.isEqual(arrA, arrB)
      }
      if (operator === "IN") {
        return arrA.every((itemA) =>
          arrB.some((itemB) => this.isEqual(itemA, itemB))
        )
      }
      // JS comparison semantics for arrays
      return this.compareScalar(operator, arrA, arrB)
    }

    // Case 3: Both operands are Primitives
    return this.compareScalar(operator, operandA, operandB)
  }

  /**
   * Arithmetic operators (+, -, *, /)
   */
  public static arithmetic(
    operator: string,
    operandA: unknown,
    operandB: unknown
  ): unknown {
    const isArrayA = Array.isArray(operandA)
    const isArrayB = Array.isArray(operandB)

    // Normalize to array for element-wise calculation
    const listA: unknown[] = isArrayA ? (operandA as unknown[]) : [operandA]
    const listB: unknown[] = isArrayB ? (operandB as unknown[]) : [operandB]

    const n = Math.min(listA.length, listB.length)
    const result: unknown[] = []

    const calculate = (a: any, b: any) => {
      switch (operator) {
        case "+":
          return typeof a === "number" && typeof b === "number"
            ? a + b
            : Number(a) + Number(b)
        case "-":
          return (Number(a) || 0) - (Number(b) || 0)
        case "*":
          return (Number(a) || 0) * (Number(b) || 0)
        case "/":
          return (Number(a) || 0) / (Number(b) || 1)
        default:
          return undefined
      }
    }

    for (let i = 0; i < n; i++) {
      result.push(calculate(listA[i], listB[i]))
    }

    // If both inputs were originally primitives, return scalar
    if (!isArrayA && !isArrayB) {
      return result[0]
    }

    return result
  }

  /**
   * Applies a binary operator between two operands (Left-to-right associative)
   */
  public static applyBinary(
    operator: string,
    operandA: unknown,
    operandB: unknown
  ): unknown {
    if (operator === "AND") {
      return Boolean(operandA) && Boolean(operandB)
    }
    if (operator === "OR") {
      return Boolean(operandA) || Boolean(operandB)
    }
    if (
      ["=", "!=", ">", "<", ">=", "<=", "~", "IN"].includes(operator)
    ) {
      return this.compare(operator, operandA, operandB)
    }
    if (["+", "-", "*", "/"].includes(operator)) {
      return this.arithmetic(operator, operandA, operandB)
    }
    return undefined
  }

  /**
   * General operator dispatcher
   */
  public static execute(operator: string, operands: unknown[]): unknown {
    if (operands.length === 0) return undefined
    if (operands.length === 1) return operands[0]

    return operands.reduce((acc, curr) => this.applyBinary(operator, acc, curr))
  }
}
