import type {
  Expression,
  PrimaryOperand,
  Operator,
  AggreeateFunction,
  DateFunction,
  EntityQuery,
  PathExpression,
} from "@/lib/query-types"
import { SilicLexer, type Token, type TokenType } from "./SilicLexer"

export class SilicParser {
  private tokens: Token[] = []
  private pos: number = 0

  constructor(input: string) {
    const lexer = new SilicLexer(input)
    this.tokens = lexer.tokenize()
  }

  public static parse(input: string): EntityQuery {
    const parser = new SilicParser(input)
    return parser.parseQuery()
  }

  public static parsePath(input: string): PathExpression {
    const parser = new SilicParser(input)
    return parser.parsePathQuery()
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset
    return idx < this.tokens.length
      ? this.tokens[idx]
      : { type: "EOF", value: "", pos: -1 }
  }

  private advance(): Token {
    return this.tokens[this.pos++]
  }

  private consume(type: TokenType, errMsg?: string): Token {
    if (this.peek().type === type) {
      return this.advance()
    }
    throw new Error(
      errMsg ||
        `Expected token '${type}', got '${this.peek().type}' ('${this.peek().value}') at position ${this.peek().pos}`
    )
  }

  public parseQuery(): EntityQuery {
    if (this.peek().type === "EOF") {
      return {
        where: {
          type: "NEUTRAL",
          subject: {
            value: {
              type: "LITERAL",
              value: true,
            },
          },
        },
      }
    }
    const whereExpr = this.parseExpression()
    if (this.peek().type !== "EOF") {
      throw new Error(
        `Unexpected token '${this.peek().value}' at position ${this.peek().pos}`
      )
    }
    return {
      where: whereExpr,
    }
  }

  public parseExpression(): Expression {
    return this.parseOrExpression()
  }

  private parseOrExpression(): Expression {
    const subjects: (Expression | PrimaryOperand)[] = []
    const operators: Operator[] = []

    let left = this.parseAndExpression()
    subjects.push(left)

    while (
      this.peek().type === "LOGICAL_OP" &&
      this.peek().value.toUpperCase() === "OR"
    ) {
      this.advance() // skip OR
      operators.push("OR")
      const right = this.parseAndExpression()
      subjects.push(right)
    }

    if (operators.length === 0) {
      return left
    }

    return {
      type: "MULTI",
      operators,
      subjects,
    }
  }

  private parseAndExpression(): Expression {
    const subjects: (Expression | PrimaryOperand)[] = []
    const operators: Operator[] = []

    let left = this.parseComparisonExpression()
    subjects.push(left)

    while (
      this.peek().type === "LOGICAL_OP" &&
      this.peek().value.toUpperCase() === "AND"
    ) {
      this.advance() // skip AND
      operators.push("AND")
      const right = this.parseComparisonExpression()
      subjects.push(right)
    }

    if (operators.length === 0) {
      return left
    }

    return {
      type: "MULTI",
      operators,
      subjects,
    }
  }

  private parseComparisonExpression(): Expression {
    const subjects: (Expression | PrimaryOperand)[] = []
    const operators: Operator[] = []

    let left = this.parseAdditiveExpression()
    subjects.push(left)

    const compOps = ["=", "!=", ">", "<", ">=", "<=", "~", "IN"]
    while (
      this.peek().type === "OPERATOR" &&
      compOps.includes(this.peek().value.toUpperCase())
    ) {
      const opToken = this.advance()
      const op = opToken.value.toUpperCase() as Operator
      operators.push(op)
      const right = this.parseAdditiveExpression()
      subjects.push(right)
    }

    if (operators.length === 0) {
      return left
    }

    return {
      type: "MULTI",
      operators,
      subjects,
    }
  }

  private parseAdditiveExpression(): Expression {
    const subjects: (Expression | PrimaryOperand)[] = []
    const operators: Operator[] = []

    let left = this.parseMultiplicativeExpression()
    subjects.push(left)

    while (
      this.peek().type === "OPERATOR" &&
      (this.peek().value === "+" || this.peek().value === "-")
    ) {
      const opToken = this.advance()
      operators.push(opToken.value as Operator)
      const right = this.parseMultiplicativeExpression()
      subjects.push(right)
    }

    if (operators.length === 0) {
      return left
    }

    return {
      type: "MULTI",
      operators,
      subjects,
    }
  }

  private parseMultiplicativeExpression(): Expression {
    const subjects: (Expression | PrimaryOperand)[] = []
    const operators: Operator[] = []

    let left = this.parseUnaryExpression()
    subjects.push(left)

    while (
      this.peek().type === "OPERATOR" &&
      (this.peek().value === "*" || this.peek().value === "/")
    ) {
      const opToken = this.advance()
      operators.push(opToken.value as Operator)
      const right = this.parseUnaryExpression()
      subjects.push(right)
    }

    if (operators.length === 0) {
      return left
    }

    return {
      type: "MULTI",
      operators,
      subjects,
    }
  }

  private parseUnaryExpression(): Expression {
    if (this.peek().type === "NOT") {
      this.advance() // skip ! or NOT
      const inner = this.parseUnaryExpression()
      return {
        type: "NOT",
        subject: inner,
      }
    }

    return this.parsePrimaryExpression()
  }

  private parsePrimaryExpression(): Expression {
    // 1. Traversal: SELF (...) <-- (...) or NEIGHBORS (...) <-- (...)
    if (
      this.peek().type === "KEYWORD" &&
      (this.peek().value === "SELF" || this.peek().value === "NEIGHBORS")
    ) {
      const kw = this.advance().value as "SELF" | "NEIGHBORS"
      let connExpr: Expression | undefined = undefined

      // Check for optional connection condition in parens: SELF (connCondition)
      if (this.peek().type === "LPAREN") {
        this.advance() // skip (
        connExpr = this.parseExpression()
        this.consume("RPAREN", "Expected ')' after connection condition")
      }

      // Must be followed by ARROW_LEFT token e.g. <-- or <--n-- or <--selector--
      if (this.peek().type === "ARROW_LEFT") {
        const arrowToken = this.advance()
        let embeddedConnExpr: Expression | undefined = undefined

        if (arrowToken.selector) {
          // e.g. <--[t1].record--
          embeddedConnExpr = {
            type: "NEUTRAL",
            subject: {
              value: {
                type: "RECORDSELECTOR",
                value: arrowToken.selector,
              },
            },
          }
        }

        const targetExpr = this.parseExpression()

        const connectionList: Expression[] = []
        if (connExpr) connectionList.push(connExpr)
        if (embeddedConnExpr) connectionList.push(embeddedConnExpr)

        return {
          type: "TRANVERSAL",
          operators: [],
          hop: arrowToken.hop,
          subjectType: kw,
          connection: connectionList.length > 0 ? connectionList : undefined,
          subjects: [targetExpr],
        }
      }
    }

    // 2. Date Function e.g. MONTH(x), YEAR(x)
    const dateFns: DateFunction[] = [
      "MONTH",
      "DAY",
      "YEAR",
      "HOUR",
      "MINUTE",
      "SECOND",
    ]
    if (
      this.peek().type === "FUNCTION" &&
      dateFns.includes(this.peek().value.toUpperCase() as DateFunction)
    ) {
      const fnName = this.advance().value.toUpperCase() as DateFunction
      this.consume("LPAREN", `Expected '(' after function ${fnName}`)
      const innerExpr = this.parseExpression()
      this.consume("RPAREN", `Expected ')' after argument to ${fnName}`)

      if (
        "value" in innerExpr &&
        typeof (innerExpr as any).value === "object"
      ) {
        const op = innerExpr as unknown as PrimaryOperand
        ;(op.value as any).dateFunction = fnName
        return {
          type: "NEUTRAL",
          subject: op,
        }
      }

      if (
        "type" in innerExpr &&
        innerExpr.type === "NEUTRAL" &&
        (innerExpr as any).subject?.value
      ) {
        ;(innerExpr as any).subject.value.dateFunction = fnName
        return innerExpr
      }

      return {
        type: "NEUTRAL",
        subject: {
          value: {
            type: "RECORDSELECTOR",
            value: { record: "" },
            dateFunction: fnName,
          },
        },
      }
    }

    // 3. Aggregate Function e.g. COUNT(x), SUM(x)
    const aggFns: AggreeateFunction[] = [
      "COUNT",
      "SUM",
      "MEAN",
      "MEDIAN",
      "MIN",
      "MAX",
    ]
    if (
      this.peek().type === "FUNCTION" &&
      aggFns.includes(this.peek().value.toUpperCase() as AggreeateFunction)
    ) {
      const fnName = this.advance().value.toUpperCase() as AggreeateFunction
      this.consume("LPAREN", `Expected '(' after function ${fnName}`)
      const innerExpr = this.parseExpression()
      this.consume("RPAREN", `Expected ')' after argument to ${fnName}`)

      if (
        "value" in innerExpr &&
        typeof (innerExpr as any).value === "object"
      ) {
        const op = innerExpr as unknown as PrimaryOperand
        ;(op.value as any).function = fnName
        return {
          type: "NEUTRAL",
          subject: op,
        }
      }

      if (
        "type" in innerExpr &&
        innerExpr.type === "NEUTRAL" &&
        (innerExpr as any).subject?.value
      ) {
        ;(innerExpr as any).subject.value.function = fnName
        return innerExpr
      }

      return innerExpr
    }

    // 4. Parenthesized expression: ( Expression ) or ()
    if (this.peek().type === "LPAREN") {
      this.advance() // skip (
      if (this.peek().type === "RPAREN") {
        this.advance() // skip )
        return {
          type: "NEUTRAL",
          subject: {
            value: {
              type: "LITERAL",
              value: true,
            },
          },
        }
      }
      const inner = this.parseExpression()
      this.consume("RPAREN", "Expected ')' to close parenthesized expression")
      return inner
    }

    // 5. RECORD_SELECTOR e.g. *.name, Character.age, [t1, t2].score
    if (this.peek().type === "RECORD_SELECTOR") {
      const token = this.advance()
      const selector = token.selector || { record: token.value }
      const operand: PrimaryOperand = {
        value: {
          type: "RECORDSELECTOR",
          value: selector,
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 6. TEMPLATE_SELECTOR e.g. templateName.
    if (this.peek().type === "TEMPLATE_SELECTOR") {
      const token = this.advance()
      const tplName =
        token.selector?.template && Array.isArray(token.selector.template)
          ? token.selector.template[0]
          : token.value.replace(/\.$/, "")
      const operand: PrimaryOperand = {
        value: {
          type: "TEMPLATESELECTOR",
          value: { template: tplName },
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 7. KEYWORD TEMPLATE
    if (this.peek().type === "KEYWORD" && this.peek().value === "TEMPLATE") {
      this.advance()
      const operand: PrimaryOperand = {
        value: {
          type: "TEMPLATE",
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 8. ARRAY literal: [ 1, 2, 3 ]
    if (this.peek().type === "LBRACKET") {
      this.advance() // skip [
      const items: any[] = []
      while (this.peek().type !== "RBRACKET" && this.peek().type !== "EOF") {
        const itemToken = this.advance()
        if (itemToken.type === "NUMBER") {
          items.push(parseFloat(itemToken.value))
        } else if (itemToken.type === "STRING") {
          items.push(itemToken.value)
        } else if (itemToken.type === "BOOLEAN") {
          items.push(itemToken.value === "TRUE")
        } else {
          items.push(itemToken.value)
        }
        if (this.peek().type === "COMMA") {
          this.advance() // skip ,
        }
      }
      this.consume("RBRACKET", "Expected ']' to close array")
      const operand: PrimaryOperand = {
        value: {
          type: "ARRAY",
          value: items,
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 9. NUMBER literal
    if (this.peek().type === "NUMBER") {
      const token = this.advance()
      const numVal = parseFloat(token.value)
      const operand: PrimaryOperand = {
        value: {
          type: "LITERAL",
          value: numVal,
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 10. STRING literal
    if (this.peek().type === "STRING") {
      const token = this.advance()
      const operand: PrimaryOperand = {
        value: {
          type: "LITERAL",
          value: token.value,
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 11. BOOLEAN literal
    if (this.peek().type === "BOOLEAN") {
      const token = this.advance()
      const boolVal = token.value === "TRUE"
      const operand: PrimaryOperand = {
        value: {
          type: "LITERAL",
          value: boolVal,
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    // 12. IDENTIFIER
    if (this.peek().type === "IDENTIFIER") {
      const token = this.advance()
      // Fallback: treat as *.identifier record selector
      const operand: PrimaryOperand = {
        value: {
          type: "RECORDSELECTOR",
          value: {
            template: "*",
            record: token.value,
          },
        },
      }
      return {
        type: "NEUTRAL",
        subject: operand,
      }
    }

    throw new Error(
      `Unexpected token '${this.peek().value}' (${this.peek().type}) at position ${this.peek().pos}`
    )
  }

  // ==========================================
  // SILIC PATH QUERY PARSING
  // ==========================================

  public parsePathQuery(): PathExpression {
    if (this.peek().type === "EOF") {
      return {
        type: "PATH_CONSTRAINT",
        quantifier: "AT_LEAST_ONE",
        expression: {
          type: "NEUTRAL",
          subject: {
            value: {
              type: "LITERAL",
              value: true,
            },
          },
        },
      }
    }
    const pathExpr = this.parsePathArrowExpression()
    if (this.peek().type !== "EOF") {
      throw new Error(
        `Unexpected token '${this.peek().value}' at position ${this.peek().pos}`
      )
    }
    return pathExpr
  }

  private parsePathArrowExpression(): PathExpression {
    // Check if starts directly with arrow: <-- (entityExpr) or just <--
    if (this.peek().type === "ARROW_LEFT") {
      this.advance() // <--
      if (this.peek().type === "EOF" || this.peek().type === "RPAREN") {
        return {
          type: "PATH_ARROW",
          connectionExpr: {
            type: "PATH_CONSTRAINT",
            quantifier: "AT_LEAST_ONE",
            expression: {
              type: "NEUTRAL",
              subject: {
                value: {
                  type: "LITERAL",
                  value: true,
                },
              },
            },
          },
          entityExpr: {
            type: "PATH_CONSTRAINT",
            quantifier: "AT_LEAST_ONE",
            expression: {
              type: "NEUTRAL",
              subject: {
                value: {
                  type: "LITERAL",
                  value: true,
                },
              },
            },
          },
        }
      }
      const entityExpr = this.parsePathSequenceExpression()
      return {
        type: "PATH_ARROW",
        entityExpr,
      }
    }

    const left = this.parsePathSequenceExpression()

    if (this.peek().type === "ARROW_LEFT") {
      this.advance() // <--
      if (this.peek().type === "EOF" || this.peek().type === "RPAREN") {
        return {
          type: "PATH_ARROW",
          connectionExpr: left,
          entityExpr: {
            type: "PATH_CONSTRAINT",
            quantifier: "AT_LEAST_ONE",
            expression: {
              type: "NEUTRAL",
              subject: {
                value: {
                  type: "LITERAL",
                  value: true,
                },
              },
            },
          },
        }
      }
      const right = this.parsePathSequenceExpression()
      return {
        type: "PATH_ARROW",
        connectionExpr: left,
        entityExpr: right,
      }
    }

    return left
  }

  private parsePathSequenceExpression(): PathExpression {
    let left = this.parsePathOrExpression()

    while (this.peek().type === "OPERATOR" && this.peek().value === "<<") {
      this.advance() // <<
      const right = this.parsePathOrExpression()
      left = {
        type: "PATH_SEQUENCE",
        left,
        right,
      }
    }

    return left
  }

  private parsePathOrExpression(): PathExpression {
    let left = this.parsePathAndExpression()

    while (
      (this.peek().type === "OPERATOR" && this.peek().value === "||") ||
      (this.peek().type === "LOGICAL_OP" && this.peek().value.toUpperCase() === "OR")
    ) {
      this.advance() // || or OR
      const right = this.parsePathAndExpression()
      left = {
        type: "PATH_OR",
        left,
        right,
      }
    }

    return left
  }

  private parsePathAndExpression(): PathExpression {
    let left = this.parsePathPrimaryExpression()

    while (
      this.peek().type === "LOGICAL_OP" &&
      this.peek().value.toUpperCase() === "AND"
    ) {
      this.advance() // AND
      const right = this.parsePathPrimaryExpression()
      left = {
        type: "PATH_AND",
        left,
        right,
      }
    }

    return left
  }

  private parsePathPrimaryExpression(): PathExpression {
    // 1. AVOID prefix
    if (
      this.peek().type === "KEYWORD" &&
      this.peek().value.toUpperCase() === "AVOID"
    ) {
      this.advance() // AVOID
      const inner = this.parsePathAtomExpression()
      return {
        type: "PATH_CONSTRAINT",
        quantifier: "AVOID",
        expression: this.extractInnerExpression(inner),
      }
    }

    // 2. ALL TIMES or ONLY prefix
    if (
      this.peek().type === "KEYWORD" &&
      (this.peek().value.toUpperCase() === "ALL" ||
        this.peek().value.toUpperCase() === "ONLY")
    ) {
      const kw = this.advance()
      if (kw.value.toUpperCase() === "ALL") {
        if (
          this.peek().type === "KEYWORD" &&
          this.peek().value.toUpperCase() === "TIMES"
        ) {
          this.advance()
        }
      }
      const inner = this.parsePathAtomExpression()
      return {
        type: "PATH_CONSTRAINT",
        quantifier: "ALL_TIMES",
        expression: this.extractInnerExpression(inner),
      }
    }

    // 3. n TIMES prefix (e.g. 2 TIMES ...)
    if (
      this.peek().type === "NUMBER" &&
      this.peek(1).type === "KEYWORD" &&
      this.peek(1).value.toUpperCase() === "TIMES"
    ) {
      const numTok = this.advance()
      this.advance() // TIMES
      const count = parseInt(numTok.value, 10) || 0
      const inner = this.parsePathAtomExpression()
      return {
        type: "PATH_CONSTRAINT",
        quantifier: count === 0 ? "AVOID" : { times: count },
        expression: this.extractInnerExpression(inner),
      }
    }

    return this.parsePathAtomExpression()
  }

  private parsePathAtomExpression(): PathExpression {
    // Parentheses grouping: check if inside is compound PathExpression or WHERE expression
    if (this.peek().type === "LPAREN") {
      const savedPos = this.pos
      this.advance() // (

      // Direct empty () check
      if (this.peek().type === "RPAREN") {
        this.advance() // )
        return {
          type: "PATH_CONSTRAINT",
          quantifier: "AT_LEAST_ONE",
          expression: {
            type: "NEUTRAL",
            subject: {
              value: {
                type: "LITERAL",
                value: true,
              },
            },
          },
        }
      }

      // Try parsing as nested path expression
      try {
        const nested = this.parsePathArrowExpression()
        if (this.peek().type === "RPAREN") {
          this.advance() // )
          return nested
        }
      } catch {
        // backtrack
        this.pos = savedPos
      }

      // If backtrack or standard expression inside parens:
      if (this.pos === savedPos) {
        this.advance() // (
        if (this.peek().type === "RPAREN") {
          this.advance() // )
          return {
            type: "PATH_CONSTRAINT",
            quantifier: "AT_LEAST_ONE",
            expression: {
              type: "NEUTRAL",
              subject: {
                value: {
                  type: "LITERAL",
                  value: true,
                },
              },
            },
          }
        }
        const expr = this.parseExpression()
        this.consume("RPAREN", "Expected ')'")
        return {
          type: "PATH_CONSTRAINT",
          quantifier: "AT_LEAST_ONE",
          expression: expr,
        }
      }
    }

    // Standard WHERE expression as path constraint
    const expr = this.parseComparisonExpression()
    return {
      type: "PATH_CONSTRAINT",
      quantifier: "AT_LEAST_ONE",
      expression: expr,
    }
  }

  private extractInnerExpression(
    pathExpr: PathExpression
  ): Expression | PrimaryOperand {
    if (pathExpr.type === "PATH_CONSTRAINT") {
      return pathExpr.expression
    }
    // If it's a sequence/or/and inside constraint, wrap it as a NEUTRAL expression
    return {
      type: "NEUTRAL",
      subject: {
        value: {
          type: "LITERAL",
          value: true,
        },
      },
    }
  }
}
