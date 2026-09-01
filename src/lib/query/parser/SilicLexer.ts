export type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "IDENTIFIER"
  | "RECORD_SELECTOR"
  | "TEMPLATE_SELECTOR"
  | "ARROW_LEFT" // <-- or <--n-- or <--[tpl].rec--
  | "LPAREN" // (
  | "RPAREN" // )
  | "LBRACKET" // [
  | "RBRACKET" // ]
  | "COMMA" // ,
  | "DOT" // .
  | "NOT" // ! or NOT
  | "OPERATOR" // =, !=, >, <, >=, <=, ~, IN, +, -, *, /
  | "LOGICAL_OP" // AND, OR
  | "FUNCTION" // MONTH, DAY, YEAR, HOUR, MINUTE, SECOND, COUNT, SUM, MEAN, MEDIAN, MIN, MAX
  | "KEYWORD" // SELF, NEIGHBORS, TEMPLATE
  | "EOF"

export interface Token {
  type: TokenType
  value: string
  pos: number
  hop?: number
  selector?: {
    template?: string[] | "*"
    record: string
  }
}

export class SilicLexer {
  private input: string
  private pos: number = 0

  constructor(input: string) {
    this.input = input
  }

  private peek(offset: number = 0): string {
    return this.pos + offset < this.input.length
      ? this.input[this.pos + offset]
      : ""
  }

  private advance(): string {
    return this.input[this.pos++]
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && this.isWhitespace(this.peek())) {
      this.advance()
    }
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []
    this.skipWhitespace()

    while (this.pos < this.input.length) {
      const startPos = this.pos
      const char = this.peek()

      // Traversal arrows: <-- or <--n-- or <--...--
      if (char === "<" && this.peek(1) === "-" && this.peek(2) === "-") {
        tokens.push(this.readArrow())
        this.skipWhitespace()
        continue
      }

      // Strings: "..." or "template"."record" or "template".
      if (char === '"' || char === "'") {
        const stringToken = this.readString(char)
        if (this.peek() === ".") {
          this.advance() // skip '.'
          if (this.peek() === '"' || this.peek() === "'") {
            const recToken = this.readString(this.peek())
            tokens.push({
              type: "RECORD_SELECTOR",
              value: `"${stringToken.value}"."${recToken.value}"`,
              pos: startPos,
              selector: {
                template: [stringToken.value],
                record: recToken.value,
              },
            })
            this.skipWhitespace()
            continue
          }
          if (
            this.peek() &&
            !this.isWhitespace(this.peek()) &&
            !/[(),[\]!=<>~+*/]/.test(this.peek())
          ) {
            let recordName = ""
            while (
              this.pos < this.input.length &&
              !this.isWhitespace(this.peek()) &&
              !/[(),[\]!=<>~+*/]/.test(this.peek())
            ) {
              recordName += this.advance()
            }
            tokens.push({
              type: "RECORD_SELECTOR",
              value: `"${stringToken.value}".${recordName}`,
              pos: startPos,
              selector: {
                template: [stringToken.value],
                record: recordName,
              },
            })
            this.skipWhitespace()
            continue
          }
          // e.g. "templateName".
          tokens.push({
            type: "TEMPLATE_SELECTOR",
            value: `"${stringToken.value}".`,
            pos: startPos,
            selector: {
              template: [stringToken.value],
              record: "",
            },
          })
          this.skipWhitespace()
          continue
        }

        tokens.push(stringToken)
        this.skipWhitespace()
        continue
      }

      // Numbers: 123, 3.14
      if (/\d/.test(char)) {
        tokens.push(this.readNumber())
        this.skipWhitespace()
        continue
      }

      // Symbols and Single/Double char operators
      if (char === "(") {
        this.advance()
        tokens.push({ type: "LPAREN", value: "(", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === ")") {
        this.advance()
        tokens.push({ type: "RPAREN", value: ")", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === "[") {
        // Check if this bracket is the start of a RecordSelector e.g. [t1, t2].recordName
        const bracketSelector = this.tryReadBracketRecordSelector()
        if (bracketSelector) {
          tokens.push(bracketSelector)
          this.skipWhitespace()
          continue
        }
        this.advance()
        tokens.push({ type: "LBRACKET", value: "[", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === "]") {
        this.advance()
        tokens.push({ type: "RBRACKET", value: "]", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === ",") {
        this.advance()
        tokens.push({ type: "COMMA", value: ",", pos: startPos })
        this.skipWhitespace()
        continue
      }
      // Leading dot for record selector: .recordName or ."record name"
      if (char === ".") {
        if (this.peek(1) === '"' || this.peek(1) === "'") {
          this.advance() // skip '.'
          const recToken = this.readString(this.peek())
          tokens.push({
            type: "RECORD_SELECTOR",
            value: `."${recToken.value}"`,
            pos: startPos,
            selector: {
              template: "*",
              record: recToken.value,
            },
          })
          this.skipWhitespace()
          continue
        }
        if (
          this.peek(1) &&
          !this.isWhitespace(this.peek(1)) &&
          !/[(),[\]!=<>~+*/]/.test(this.peek(1)) &&
          !/\d/.test(this.peek(1))
        ) {
          this.advance() // skip '.'
          let recordName = ""
          while (
            this.pos < this.input.length &&
            !this.isWhitespace(this.peek()) &&
            !/[(),[\]!=<>~+*/]/.test(this.peek())
          ) {
            recordName += this.advance()
          }
          tokens.push({
            type: "RECORD_SELECTOR",
            value: `.${recordName}`,
            pos: startPos,
            selector: {
              template: "*",
              record: recordName,
            },
          })
          this.skipWhitespace()
          continue
        }
      }

      if (char === "!") {
        this.advance()
        if (this.peek() === "=") {
          this.advance()
          tokens.push({ type: "OPERATOR", value: "!=", pos: startPos })
        } else {
          tokens.push({ type: "NOT", value: "!", pos: startPos })
        }
        this.skipWhitespace()
        continue
      }
      if (char === "=") {
        this.advance()
        tokens.push({ type: "OPERATOR", value: "=", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === ">") {
        this.advance()
        if (this.peek() === "=") {
          this.advance()
          tokens.push({ type: "OPERATOR", value: ">=", pos: startPos })
        } else {
          tokens.push({ type: "OPERATOR", value: ">", pos: startPos })
        }
        this.skipWhitespace()
        continue
      }
      if (char === "<") {
        this.advance()
        if (this.peek() === "<") {
          this.advance()
          tokens.push({ type: "OPERATOR", value: "<<", pos: startPos })
        } else if (this.peek() === "=") {
          this.advance()
          tokens.push({ type: "OPERATOR", value: "<=", pos: startPos })
        } else {
          tokens.push({ type: "OPERATOR", value: "<", pos: startPos })
        }
        this.skipWhitespace()
        continue
      }
      if (char === "|") {
        this.advance()
        if (this.peek() === "|") {
          this.advance()
          tokens.push({ type: "OPERATOR", value: "||", pos: startPos })
        } else {
          tokens.push({ type: "OPERATOR", value: "|", pos: startPos })
        }
        this.skipWhitespace()
        continue
      }
      if (char === "~") {
        this.advance()
        tokens.push({ type: "OPERATOR", value: "~", pos: startPos })
        this.skipWhitespace()
        continue
      }
      if (char === "+" || char === "-" || char === "*" || char === "/") {
        // Special case: check if * is part of *.recordName
        if (char === "*" && this.peek(1) === ".") {
          tokens.push(this.readWildcardSelector())
          this.skipWhitespace()
          continue
        }
        this.advance()
        tokens.push({ type: "OPERATOR", value: char, pos: startPos })
        this.skipWhitespace()
        continue
      }

      // Identifiers, Selectors, Keywords, and Functions
      const wordToken = this.readIdentifierOrSelector()
      tokens.push(wordToken)
      this.skipWhitespace()
    }

    tokens.push({ type: "EOF", value: "", pos: this.pos })
    return tokens
  }

  private readArrow(): Token {
    const startPos = this.pos
    // Advance past '<--'
    this.advance() // <
    this.advance() // -
    this.advance() // -

    // Check if there is an embedded hop count or connection selector before closing '--'
    // e.g. <--2-- or <--[t1, t2].record--
    const remaining = this.input.slice(this.pos)
    const endDashIdx = remaining.indexOf("--")

    if (endDashIdx !== -1) {
      const middle = remaining.slice(0, endDashIdx).trim()
      // If middle is a number -> hop
      if (/^\d+$/.test(middle)) {
        const hop = parseInt(middle, 10)
        this.pos += endDashIdx + 2
        return {
          type: "ARROW_LEFT",
          value: `<--${middle}--`,
          pos: startPos,
          hop,
        }
      }
      // If middle is a selector e.g. [t1].record or t1.record
      if (middle.includes(".")) {
        const selector = this.parseSelectorString(middle)
        this.pos += endDashIdx + 2
        return {
          type: "ARROW_LEFT",
          value: `<--${middle}--`,
          pos: startPos,
          selector,
        }
      }
    }

    return { type: "ARROW_LEFT", value: "<--", pos: startPos }
  }

  private parseSelectorString(str: string): {
    template?: string[] | "*"
    record: string
  } {
    const dotIdx = str.lastIndexOf(".")
    if (dotIdx === -1) {
      return { record: str }
    }
    const tplPart = str.slice(0, dotIdx).trim()
    const recPart = str.slice(dotIdx + 1).trim()

    if (tplPart === "*") {
      return { template: "*", record: recPart }
    }
    if (tplPart.startsWith("[") && tplPart.endsWith("]")) {
      const tpls = tplPart
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
      return { template: tpls, record: recPart }
    }
    return { template: [tplPart], record: recPart }
  }

  private readString(quote: string): Token {
    const startPos = this.pos
    this.advance() // skip opening quote
    let str = ""
    while (this.pos < this.input.length && this.peek() !== quote) {
      if (this.peek() === "\\" && this.pos + 1 < this.input.length) {
        this.advance()
        str += this.advance()
      } else {
        str += this.advance()
      }
    }
    if (this.peek() === quote) {
      this.advance() // skip closing quote
    }
    return { type: "STRING", value: str, pos: startPos }
  }

  private readNumber(): Token {
    const startPos = this.pos
    let numStr = ""
    while (this.pos < this.input.length && /[\d.]/.test(this.peek())) {
      numStr += this.advance()
    }
    return { type: "NUMBER", value: numStr, pos: startPos }
  }

  private readWildcardSelector(): Token {
    const startPos = this.pos
    this.advance() // *
    this.advance() // .

    if (this.peek() === '"' || this.peek() === "'") {
      const recToken = this.readString(this.peek())
      return {
        type: "RECORD_SELECTOR",
        value: `*."${recToken.value}"`,
        pos: startPos,
        selector: {
          template: "*",
          record: recToken.value,
        },
      }
    }

    let recordName = ""
    while (
      this.pos < this.input.length &&
      !this.isWhitespace(this.peek()) &&
      !/[(),[\]!=<>~+*/]/.test(this.peek())
    ) {
      recordName += this.advance()
    }
    return {
      type: "RECORD_SELECTOR",
      value: `*.${recordName}`,
      pos: startPos,
      selector: {
        template: "*",
        record: recordName,
      },
    }
  }

  private tryReadBracketRecordSelector(): Token | null {
    const startPos = this.pos
    let offset = 0
    if (this.peek(offset) !== "[") return null
    offset++

    while (this.pos + offset < this.input.length && this.peek(offset) !== "]") {
      offset++
    }
    if (this.peek(offset) !== "]") return null
    offset++ // skip ]

    // Check if followed by '.' and an identifier or quoted string
    if (this.peek(offset) === ".") {
      const bracketContent = this.input.slice(
        this.pos + 1,
        this.pos + offset - 1
      )
      this.pos += offset + 1 // skip past '.'

      let recordName = ""
      if (this.peek() === '"' || this.peek() === "'") {
        recordName = this.readString(this.peek()).value
      } else {
        while (
          this.pos < this.input.length &&
          !this.isWhitespace(this.peek()) &&
          !/[(),[\]!=<>~+*/]/.test(this.peek())
        ) {
          recordName += this.advance()
        }
      }

      const tpls = bracketContent
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
      return {
        type: "RECORD_SELECTOR",
        value: `[${bracketContent}]."${recordName}"`,
        pos: startPos,
        selector: {
          template: tpls,
          record: recordName,
        },
      }
    }

    return null
  }

  private readIdentifierOrSelector(): Token {
    const startPos = this.pos
    let raw = ""

    while (
      this.pos < this.input.length &&
      !this.isWhitespace(this.peek()) &&
      !/[(),[\]!=<>~+*/|]/.test(this.peek())
    ) {
      // If dot is followed by quote e.g. templateName."record", stop here to let trailing logic handle it
      if (
        this.peek() === "." &&
        (this.peek(1) === '"' || this.peek(1) === "'")
      ) {
        break
      }
      raw += this.advance()
    }

    // Check if next is '.' followed by quote: e.g. templateName."record name"
    if (this.peek() === "." && (this.peek(1) === '"' || this.peek(1) === "'")) {
      this.advance() // skip '.'
      const recToken = this.readString(this.peek())
      return {
        type: "RECORD_SELECTOR",
        value: `${raw}."${recToken.value}"`,
        pos: startPos,
        selector: { template: [raw], record: recToken.value },
      }
    }

    // Check if starts with '.' e.g. .recordName
    if (raw.startsWith(".")) {
      const rec = raw.slice(1)
      return {
        type: "RECORD_SELECTOR",
        value: raw,
        pos: startPos,
        selector: { template: "*", record: rec },
      }
    }

    // Check if it's a dotted selector or template selector e.g. templateName.recordName or templateName.
    if (raw.includes(".")) {
      const dotIdx = raw.indexOf(".")
      const tpl = raw.slice(0, dotIdx)
      const rec = raw.slice(dotIdx + 1)

      if (rec === "") {
        // e.g. templateName.
        return {
          type: "TEMPLATE_SELECTOR",
          value: raw,
          pos: startPos,
          selector: { template: [tpl], record: "" },
        }
      }
      return {
        type: "RECORD_SELECTOR",
        value: raw,
        pos: startPos,
        selector: { template: [tpl], record: rec },
      }
    }

    const upper = raw.toUpperCase()

    // Boolean
    if (upper === "TRUE" || upper === "FALSE") {
      return { type: "BOOLEAN", value: upper, pos: startPos }
    }

    // Logical Ops
    if (upper === "AND" || upper === "OR") {
      return { type: "LOGICAL_OP", value: upper, pos: startPos }
    }

    // NOT
    if (upper === "NOT") {
      return { type: "NOT", value: "NOT", pos: startPos }
    }

    // IN
    if (upper === "IN") {
      return { type: "OPERATOR", value: "IN", pos: startPos }
    }

    // Keywords
    if (upper === "SELF") {
      return { type: "KEYWORD", value: "SELF", pos: startPos }
    }
    if (
      upper === "NEIGHBORS" ||
      upper === "NEIGHBOR" ||
      upper === "NEIGHBOURS" ||
      upper === "NEIGHBOUR"
    ) {
      return { type: "KEYWORD", value: "NEIGHBORS", pos: startPos }
    }
    if (upper === "TEMPLATE") {
      return { type: "KEYWORD", value: "TEMPLATE", pos: startPos }
    }
    if (upper === "AVOID") {
      return { type: "KEYWORD", value: "AVOID", pos: startPos }
    }
    if (upper === "TIMES") {
      return { type: "KEYWORD", value: "TIMES", pos: startPos }
    }
    if (upper === "ALL") {
      return { type: "KEYWORD", value: "ALL", pos: startPos }
    }
    if (upper === "ONLY") {
      return { type: "KEYWORD", value: "ONLY", pos: startPos }
    }

    // Functions
    const dateFns = ["MONTH", "DAY", "YEAR", "HOUR", "MINUTE", "SECOND"]
    if (dateFns.includes(upper)) {
      return { type: "FUNCTION", value: upper, pos: startPos }
    }

    const aggFns = ["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX", "AVG"]
    if (aggFns.includes(upper)) {
      return {
        type: "FUNCTION",
        value: upper === "AVG" ? "MEAN" : upper,
        pos: startPos,
      }
    }

    return { type: "IDENTIFIER", value: raw, pos: startPos }
  }
}
