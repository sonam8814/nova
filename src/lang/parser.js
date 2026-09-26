import { TokenType } from './tokens.js'
import { Lexer } from './lexer.js'
import * as AST from './ast.js'

export class ParseError extends Error {
  constructor(message, file, line, column, hint) {
    super(message)
    this.name = 'ParseError'
    this.kind = 'SyntaxError'
    this.file = file
    this.line = line
    this.column = column
    this.hint = hint || null
  }
}

export class Parser {
  constructor(tokens, fileName = 'unknown') {
    this.tokens = tokens
    this.fileName = fileName
    this.current = 0
    this.loopDepth = 0
  }

  // --- Helpers ---

  peek() {
    return this.tokens[this.current]
  }

  previous() {
    return this.tokens[this.current - 1]
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF
  }

  check(type) {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  checkKeyword(value) {
    if (this.isAtEnd()) return false
    const t = this.peek()
    return t.type === TokenType.KEYWORD && t.value === value
  }

  advance() {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  matchKeyword(...keywords) {
    for (const kw of keywords) {
      if (this.checkKeyword(kw)) {
        this.advance()
        return true
      }
    }
    return false
  }

  consume(type, message, hint) {
    if (this.check(type)) return this.advance()
    const t = this.peek()
    throw new ParseError(message, this.fileName, t.line, t.column, hint)
  }

  consumeKeyword(keyword, message, hint) {
    if (this.checkKeyword(keyword)) return this.advance()
    const t = this.peek()
    throw new ParseError(message, this.fileName, t.line, t.column, hint)
  }

  consumePropertyName() {
    const t = this.peek()
    if (t.type === TokenType.IDENT || t.type === TokenType.KEYWORD || t.type === TokenType.TYPE) {
      return this.advance()
    }
    throw new ParseError("Expected property name after '.'.", this.fileName, t.line, t.column, null)
  }

  error(message, token, hint) {
    const t = token || this.peek()
    throw new ParseError(message, this.fileName, t.line, t.column, hint)
  }

  locFrom(startToken) {
    const end = this.previous()
    return {
      line: startToken.line,
      column: startToken.column,
      start: startToken.start,
      end: end.end,
    }
  }

  // --- Expression Parsing (precedence climbing) ---

  parseExpression() {
    return this.orExpr()
  }

  orExpr() {
    let left = this.andExpr()
    while (this.checkKeyword('or') && !this.isOrIf()) {
      const op = this.advance()
      const right = this.andExpr()
      left = AST.Binary(left, 'or', right, this.locFromNodes(left, right))
    }
    return left
  }

  isOrIf() {
    if (!this.checkKeyword('or')) return false
    const next = this.tokens[this.current + 1]
    return next && next.type === TokenType.KEYWORD && next.value === 'if'
  }

  andExpr() {
    let left = this.equality()
    while (this.matchKeyword('and')) {
      const right = this.equality()
      left = AST.Binary(left, 'and', right, this.locFromNodes(left, right))
    }
    return left
  }

  equality() {
    let left = this.comparison()
    while (true) {
      if (this.match(TokenType.EQEQ)) {
        const right = this.comparison()
        left = AST.Binary(left, '==', right, this.locFromNodes(left, right))
      } else if (this.match(TokenType.BANGEQ)) {
        const right = this.comparison()
        left = AST.Binary(left, '!=', right, this.locFromNodes(left, right))
      } else if (this.checkKeyword('is')) {
        const next = this.tokens[this.current + 1]
        if (next && next.type === TokenType.KEYWORD && next.value === 'not') {
          this.advance() // consume 'is'
          this.advance() // consume 'not'
          const right = this.comparison()
          left = AST.Binary(left, 'is not', right, this.locFromNodes(left, right))
        } else if (next && next.type === TokenType.IDENT && next.value === 'a') {
          this.advance() // consume 'is'
          this.advance() // consume 'a'
          const right = this.comparison()
          left = AST.Binary(left, 'is a', right, this.locFromNodes(left, right))
        } else {
          this.advance() // consume 'is'
          const right = this.comparison()
          left = AST.Binary(left, 'is', right, this.locFromNodes(left, right))
        }
      } else {
        break
      }
    }
    return left
  }

  comparison() {
    let left = this.term()
    while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE)) {
      const op = this.previous()
      const right = this.term()
      left = AST.Binary(left, op.lexeme, right, this.locFromNodes(left, right))
    }
    return left
  }

  term() {
    let left = this.factor()
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous()
      const right = this.factor()
      left = AST.Binary(left, op.lexeme, right, this.locFromNodes(left, right))
    }
    return left
  }

  factor() {
    let left = this.power()
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const op = this.previous()
      const right = this.power()
      left = AST.Binary(left, op.lexeme, right, this.locFromNodes(left, right))
    }
    return left
  }

  power() {
    const base = this.unary()
    if (this.match(TokenType.CARET)) {
      const exp = this.power()
      return AST.Binary(base, '^', exp, this.locFromNodes(base, exp))
    }
    return base
  }

  unary() {
    if (this.match(TokenType.MINUS)) {
      const op = this.previous()
      const operand = this.unary()
      return AST.Unary('-', operand, { line: op.line, column: op.column, start: op.start, end: operand.loc.end })
    }
    if (this.matchKeyword('not')) {
      const op = this.previous()
      const operand = this.unary()
      return AST.Unary('not', operand, { line: op.line, column: op.column, start: op.start, end: operand.loc.end })
    }
    if (this.checkKeyword('size')) {
      const next = this.tokens[this.current + 1]
      if (next && next.type === TokenType.KEYWORD && next.value === 'of') {
        const op = this.advance() // consume 'size'
        this.advance() // consume 'of'
        const operand = this.unary()
        return AST.Unary('size of', operand, { line: op.line, column: op.column, start: op.start, end: operand.loc.end })
      }
    }
    return this.postfix()
  }

  postfix() {
    let expr = this.primary()
    while (true) {
      if (this.match(TokenType.LPAREN)) {
        const start = expr
        const args = []
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression())
          } while (this.match(TokenType.COMMA))
        }
        this.consume(TokenType.RPAREN, "Expected ')' after arguments.")
        expr = AST.Call(expr, args, { line: start.loc.line, column: start.loc.column, start: start.loc.start, end: this.previous().end })
      } else if (this.match(TokenType.LBRACKET)) {
        const start = expr
        const index = this.parseExpression()
        this.consume(TokenType.RBRACKET, "Expected ']' after index.")
        expr = AST.Index(expr, index, { line: start.loc.line, column: start.loc.column, start: start.loc.start, end: this.previous().end })
      } else if (this.match(TokenType.DOT)) {
        const start = expr
        const name = this.consumePropertyName()
        expr = AST.Property(expr, name.value, { line: start.loc.line, column: start.loc.column, start: start.loc.start, end: name.end })
      } else {
        break
      }
    }
    return expr
  }

  primary() {
    const t = this.peek()

    // Number literal
    if (this.match(TokenType.NUMBER)) {
      const tok = this.previous()
      return AST.Num(tok.value, this.locOfToken(tok))
    }

    // Text literal (with potential interpolation)
    if (this.check(TokenType.TEXT)) {
      return this.parseText()
    }

    // Boolean: yes / no
    if (this.checkKeyword('yes')) {
      const tok = this.advance()
      return AST.Bool(true, this.locOfToken(tok))
    }
    if (this.checkKeyword('no')) {
      const tok = this.advance()
      return AST.Bool(false, this.locOfToken(tok))
    }

    // Nothing
    if (this.checkKeyword('nothing')) {
      const tok = this.advance()
      return AST.Nothing(this.locOfToken(tok))
    }

    // my
    if (this.checkKeyword('my')) {
      const tok = this.advance()
      return AST.Ident('my', this.locOfToken(tok))
    }

    // parent
    if (this.checkKeyword('parent')) {
      const tok = this.advance()
      return AST.Ident('parent', this.locOfToken(tok))
    }

    // Identifier
    if (this.match(TokenType.IDENT)) {
      const tok = this.previous()
      return AST.Ident(tok.value, this.locOfToken(tok))
    }

    // Grouping: ( expression )
    if (this.match(TokenType.LPAREN)) {
      const start = this.previous()
      const expr = this.parseExpression()
      this.consume(TokenType.RPAREN, "Expected ')' after expression.")
      return AST.Grouping(expr, { line: start.line, column: start.column, start: start.start, end: this.previous().end })
    }

    // List literal: [ ... ]
    if (this.match(TokenType.LBRACKET)) {
      const start = this.previous()
      const elements = []
      if (!this.check(TokenType.RBRACKET)) {
        do {
          if (this.check(TokenType.RBRACKET)) break // trailing comma
          elements.push(this.parseExpression())
        } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after list elements.")
      return AST.ListLit(elements, { line: start.line, column: start.column, start: start.start, end: this.previous().end })
    }

    // Map literal: { ... }
    if (this.match(TokenType.LBRACE)) {
      const start = this.previous()
      const pairs = []
      if (!this.check(TokenType.RBRACE)) {
        do {
          if (this.check(TokenType.RBRACE)) break // trailing comma
          const key = this.parseExpression()
          this.consume(TokenType.COLON, "Expected ':' after map key.")
          const value = this.parseExpression()
          pairs.push({ key, value })
        } while (this.match(TokenType.COMMA))
      }
      this.consume(TokenType.RBRACE, "Expected '}' after map entries.")
      return AST.MapLit(pairs, { line: start.line, column: start.column, start: start.start, end: this.previous().end })
    }

    // action (anonymous function) — parsed here as an expression
    if (this.checkKeyword('action')) {
      return this.parseAction()
    }

    // new ClassName(args)
    if (this.checkKeyword('new')) {
      return this.parseNew()
    }

    // read expression
    if (this.checkKeyword('read')) {
      const tok = this.advance()
      const expr = this.parseExpression()
      return AST.Unary('read', expr, { line: tok.line, column: tok.column, start: tok.start, end: expr.loc.end })
    }

    // ask expression (as an expression, not a statement)
    if (this.checkKeyword('ask')) {
      const tok = this.advance()
      const expr = this.parseExpression()
      return AST.Unary('ask', expr, { line: tok.line, column: tok.column, start: tok.start, end: expr.loc.end })
    }

    // Type names used as identifiers (for `is a` checks)
    if (this.check(TokenType.TYPE)) {
      const tok = this.advance()
      return AST.Ident(tok.value, this.locOfToken(tok))
    }

    // Error: = used instead of as
    if (t.lexeme === '=') {
      this.error('Unexpected "=".', t, 'Use "remember x as 5", not "remember x = 5".')
    }

    this.error(`Unexpected token '${t.lexeme || t.type}'.`, t, 'Expected an expression.')
  }

  // --- Top-level parsing ---

  parse() {
    const body = []
    const start = this.peek()
    while (!this.isAtEnd()) {
      body.push(this.statement())
    }
    const loc = body.length > 0
      ? { line: body[0].loc.line, column: body[0].loc.column, start: body[0].loc.start, end: body[body.length - 1].loc.end }
      : this.locOfToken(start)
    return AST.Program(body, loc)
  }

  block() {
    const stmts = []
    while (
      !this.isAtEnd() &&
      !this.checkKeyword('done') &&
      !this.checkKeyword('otherwise') &&
      !this.checkKeyword('rescue') &&
      !this.checkKeyword('always') &&
      !this.isOrIf()
    ) {
      stmts.push(this.statement())
    }
    return stmts
  }

  statement() {
    if (this.checkKeyword('remember') || this.checkKeyword('constant')) {
      return this.declaration()
    }
    if (this.checkKeyword('set')) {
      return this.assignment()
    }
    if (this.checkKeyword('show')) {
      return this.showStatement()
    }
    if (this.checkKeyword('check')) {
      return this.ifStatement()
    }
    if (this.checkKeyword('while')) {
      return this.whileStatement()
    }
    if (this.checkKeyword('repeat')) {
      return this.repeatStatement()
    }
    if (this.checkKeyword('count')) {
      return this.countStatement()
    }
    if (this.checkKeyword('for')) {
      return this.forEachStatement()
    }
    if (this.checkKeyword('keep')) {
      return this.foreverStatement()
    }
    if (this.checkKeyword('describe')) {
      return this.classDecl()
    }
    if (this.checkKeyword('define')) {
      return this.funcDecl()
    }
    if (this.checkKeyword('give')) {
      return this.returnStatement()
    }
    if (this.checkKeyword('skip')) {
      return this.skipStatement()
    }
    if (this.checkKeyword('stop')) {
      return this.stopStatement()
    }
    return this.exprStatement()
  }

  // --- Declarations and assignment ---

  declaration() {
    const start = this.advance()
    const isConstant = start.value === 'constant'

    let typeHint = null
    if (this.check(TokenType.TYPE)) {
      typeHint = this.advance().value
    }

    if (!this.check(TokenType.IDENT)) {
      const t = this.peek()
      if (t.type === TokenType.NUMBER || t.type === TokenType.TEXT) {
        this.error(
          `Expected a variable name after '${start.value}', but got '${t.lexeme}'.`,
          t,
          `Use '${start.value} myVar as ${t.lexeme}', not '${start.value} ${t.lexeme} as myVar'.`
        )
      }
      this.error(`Expected a variable name after '${start.value}'.`, t)
    }
    const name = this.advance()

    this.consumeKeyword('as', `Expected 'as' after variable name '${name.value}'.`, `Use '${start.value} ${name.value} as <value>'.`)
    const value = this.parseExpression()

    return AST.Declare(
      name.value,
      value,
      isConstant,
      typeHint,
      { line: start.line, column: start.column, start: start.start, end: value.loc.end }
    )
  }

  assignment() {
    const start = this.advance() // consume 'set'

    const target = this.parseAssignTarget()

    this.consumeKeyword('to', "Expected 'to' after assignment target.", "Use 'set x to <value>'.")
    const value = this.parseExpression()

    return AST.Assign(
      target,
      value,
      { line: start.line, column: start.column, start: start.start, end: value.loc.end }
    )
  }

  parseAssignTarget() {
    let target

    if (this.checkKeyword('my')) {
      const myTok = this.advance()
      this.consume(TokenType.DOT, "Expected '.' after 'my'.")
      const prop = this.consumePropertyName()
      target = AST.Property(AST.Ident('my', this.locOfToken(myTok)), prop.value, {
        line: myTok.line, column: myTok.column, start: myTok.start, end: prop.end,
      })
    } else {
      const name = this.consume(TokenType.IDENT, "Expected a variable name after 'set'.")
      target = AST.Ident(name.value, this.locOfToken(name))
    }

    while (this.match(TokenType.DOT) || this.match(TokenType.LBRACKET)) {
      const prev = this.previous()
      if (prev.type === TokenType.DOT) {
        const prop = this.consumePropertyName()
        target = AST.Property(target, prop.value, {
          line: target.loc.line, column: target.loc.column, start: target.loc.start, end: prop.end,
        })
      } else {
        const index = this.parseExpression()
        this.consume(TokenType.RBRACKET, "Expected ']' after index.")
        target = AST.Index(target, index, {
          line: target.loc.line, column: target.loc.column, start: target.loc.start, end: this.previous().end,
        })
      }
    }

    return target
  }

  // --- Show ---

  showStatement() {
    const start = this.advance() // consume 'show'
    const expressions = [this.parseExpression()]
    while (this.match(TokenType.COMMA)) {
      expressions.push(this.parseExpression())
    }
    return AST.Show(expressions, {
      line: start.line, column: start.column, start: start.start,
      end: expressions[expressions.length - 1].loc.end,
    })
  }

  // --- Conditionals ---

  ifStatement() {
    const start = this.advance() // consume 'check'
    this.consumeKeyword('if', "Expected 'if' after 'check'.", "Use 'check if <condition>'.")

    const branches = []

    const firstCondition = this.parseExpression()
    const firstBody = this.block()
    branches.push({ condition: firstCondition, body: firstBody })

    while (this.isOrIf()) {
      this.advance() // consume 'or'
      this.advance() // consume 'if'
      const condition = this.parseExpression()
      const body = this.block()
      branches.push({ condition, body })
    }

    let otherwise = null
    if (this.matchKeyword('otherwise')) {
      otherwise = this.block()
    }

    this.consumeKeyword('done', "Expected 'done' to close 'check if' block.")
    return AST.If(branches, otherwise, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  // --- Loops ---

  whileStatement() {
    const start = this.advance() // consume 'while'
    const condition = this.parseExpression()

    this.loopDepth++
    const body = this.block()
    this.loopDepth--

    this.consumeKeyword('done', "Expected 'done' to close 'while' loop.")
    return AST.While(condition, body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  repeatStatement() {
    const start = this.advance() // consume 'repeat'
    const count = this.parseExpression()
    this.consumeKeyword('times', "Expected 'times' after repeat count.", "Use 'repeat 5 times'.")

    let name = null
    if (this.matchKeyword('as')) {
      const ident = this.consume(TokenType.IDENT, "Expected variable name after 'as'.")
      name = ident.value
    }

    this.loopDepth++
    const body = this.block()
    this.loopDepth--

    this.consumeKeyword('done', "Expected 'done' to close 'repeat' loop.")
    return AST.Repeat(count, name, body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  countStatement() {
    const start = this.advance() // consume 'count'
    const ident = this.consume(TokenType.IDENT, "Expected variable name after 'count'.")
    this.consumeKeyword('from', "Expected 'from' after variable name.", "Use 'count i from 1 to 10'.")
    const from = this.parseExpression()

    let isDown = false
    if (this.checkKeyword('down')) {
      this.advance()
      isDown = true
    }

    this.consumeKeyword('to', "Expected 'to' in count loop.", "Use 'count i from 1 to 10'.")
    const to = this.parseExpression()

    let by = null
    if (this.matchKeyword('by')) {
      by = this.parseExpression()
    }

    this.loopDepth++
    const body = this.block()
    this.loopDepth--

    this.consumeKeyword('done', "Expected 'done' to close 'count' loop.")
    return AST.Count(ident.value, from, to, by, isDown, body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  forEachStatement() {
    const start = this.advance() // consume 'for'
    this.consumeKeyword('each', "Expected 'each' after 'for'.", "Use 'for each item in list'.")

    const first = this.consume(TokenType.IDENT, "Expected variable name after 'for each'.")

    let keyName = first.value
    let valueName = null

    if (this.matchKeyword('to')) {
      const second = this.consume(TokenType.IDENT, "Expected value variable name after 'to'.")
      valueName = second.value
    }

    this.consumeKeyword('in', "Expected 'in' in for each loop.", "Use 'for each item in list'.")
    const iterable = this.parseExpression()

    this.loopDepth++
    const body = this.block()
    this.loopDepth--

    this.consumeKeyword('done', "Expected 'done' to close 'for each' loop.")
    return AST.ForEach(keyName, valueName, iterable, body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  foreverStatement() {
    const start = this.advance() // consume 'keep'
    this.consumeKeyword('going', "Expected 'going' after 'keep'.", "Use 'keep going'.")

    this.loopDepth++
    const body = this.block()
    this.loopDepth--

    this.consumeKeyword('done', "Expected 'done' to close 'keep going' loop.")
    return AST.Forever(body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  // --- Functions ---

  funcDecl() {
    const start = this.advance() // consume 'define'
    const name = this.consume(TokenType.IDENT, "Expected function name after 'define'.")

    const params = []
    if (this.matchKeyword('with')) {
      do {
        let type = null
        if (this.check(TokenType.TYPE)) {
          type = this.advance().value
        }
        const paramName = this.consume(TokenType.IDENT, "Expected parameter name.")
        let defaultValue = null
        if (this.matchKeyword('as')) {
          defaultValue = this.parseExpression()
        }
        params.push({ name: paramName.value, type, default: defaultValue, loc: this.locOfToken(paramName) })
      } while (this.match(TokenType.COMMA))
    }

    let returnType = null
    if (this.matchKeyword('gives')) {
      if (this.check(TokenType.TYPE)) {
        returnType = this.advance().value
      } else if (this.check(TokenType.IDENT)) {
        returnType = this.advance().value
      } else {
        this.error("Expected a type name after 'gives'.")
      }
    }

    const body = this.block()
    this.consumeKeyword('done', "Expected 'done' to close 'define' block.")

    return AST.FuncDecl(name.value, params, returnType, body, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  classDecl() {
    const start = this.advance() // consume 'describe'
    const name = this.consume(TokenType.IDENT, "Expected class name after 'describe'.")

    let superclass = null
    if (this.matchKeyword('from')) {
      const superToken = this.consume(TokenType.IDENT, "Expected superclass name after 'from'.")
      superclass = superToken.value
    }

    const fields = []
    const methods = []

    while (!this.isAtEnd() && !this.checkKeyword('done')) {
      if (this.checkKeyword('has')) {
        const hasTok = this.advance() // consume 'has'
        let typeHint = null
        if (this.check(TokenType.TYPE)) {
          typeHint = this.advance().value
        }
        const fieldName = this.consume(TokenType.IDENT, "Expected field name after 'has'.")
        let defaultValue = null
        if (this.matchKeyword('as')) {
          defaultValue = this.parseExpression()
        }
        fields.push(AST.FieldDecl(fieldName.value, typeHint, defaultValue, {
          line: hasTok.line, column: hasTok.column, start: hasTok.start, end: this.previous().end,
        }))
      } else if (this.checkKeyword('define')) {
        methods.push(this.funcDecl())
      } else {
        this.error(
          `Unexpected '${this.peek().lexeme}' inside class body.`,
          this.peek(),
          "A class body can only contain 'has' field declarations and 'define' method declarations."
        )
      }
    }

    this.consumeKeyword('done', "Expected 'done' to close 'describe' block.")

    return AST.ClassDecl(name.value, superclass, fields, methods, {
      line: start.line, column: start.column, start: start.start, end: this.previous().end,
    })
  }

  returnStatement() {
    const start = this.advance() // consume 'give'
    this.consumeKeyword('back', "Expected 'back' after 'give'.", "Use 'give back <value>'.")

    let value = null
    if (
      !this.isAtEnd() &&
      !this.checkKeyword('done') &&
      !this.checkKeyword('otherwise') &&
      !this.checkKeyword('rescue') &&
      !this.checkKeyword('always') &&
      !this.isOrIf()
    ) {
      value = this.parseExpression()
    }

    const end = value ? value.loc.end : this.previous().end
    return AST.Return(value, {
      line: start.line, column: start.column, start: start.start, end,
    })
  }

  // --- Skip / Stop ---

  skipStatement() {
    const tok = this.advance()
    if (this.loopDepth === 0) {
      this.error("'skip' can only be used inside a loop.", tok, "Move this inside a 'while', 'repeat', 'count', 'for each', or 'keep going' block.")
    }
    return AST.Skip(this.locOfToken(tok))
  }

  stopStatement() {
    const tok = this.advance()
    if (this.loopDepth === 0) {
      this.error("'stop' can only be used inside a loop.", tok, "Move this inside a 'while', 'repeat', 'count', 'for each', or 'keep going' block.")
    }
    return AST.Stop(this.locOfToken(tok))
  }

  // --- Expression statement ---

  exprStatement() {
    const expr = this.parseExpression()
    return AST.ExprStmt(expr, expr.loc)
  }

  // --- Interpolation ---

  parseText() {
    const tok = this.advance()
    const loc = this.locOfToken(tok)

    if (!tok.hasInterpolation) {
      return AST.Text(tok.value.replace(/\\{/g, '{'), loc)
    }

    const parts = []
    const raw = tok.value
    let i = 0

    while (i < raw.length) {
      // escaped brace — stored as \{ by the lexer
      if (raw[i] === '\\' && i + 1 < raw.length && raw[i + 1] === '{') {
        parts.push(AST.Text('{', loc))
        i += 2
        continue
      }

      if (raw[i] === '{') {
        i++ // skip {
        let depth = 1
        let exprStr = ''
        while (i < raw.length && depth > 0) {
          if (raw[i] === '{') depth++
          else if (raw[i] === '}') {
            depth--
            if (depth === 0) { i++; break }
          }
          exprStr += raw[i]
          i++
        }

        // The offset of the interpolation within the source
        // tok.start is the position of the opening " in source
        // We need to parse this sub-expression with its own lexer/parser
        const subLexer = new Lexer(exprStr, this.fileName)
        const subTokens = subLexer.tokenize()
        const subParser = new Parser(subTokens, this.fileName)
        const expr = subParser.parseExpression()

        // Offset the loc by the token's starting position
        // This is approximate — for accurate positions, we'd track exact offsets
        parts.push(expr)
        continue
      }

      // Plain text segment
      let text = ''
      while (i < raw.length && raw[i] !== '{') {
        if (raw[i] === '\\' && i + 1 < raw.length && raw[i + 1] === '{') {
          break
        }
        text += raw[i]
        i++
      }
      if (text.length > 0) {
        parts.push(AST.Text(text, loc))
      }
    }

    if (parts.length === 1 && parts[0].type === 'Text') {
      return parts[0]
    }

    return AST.Interpolation(parts, loc)
  }

  // --- Action (anonymous function) ---

  parseAction() {
    const start = this.advance() // consume 'action'
    const params = []

    if (this.matchKeyword('with')) {
      do {
        let type = null
        if (this.check(TokenType.TYPE)) {
          type = this.advance().value
        }
        const name = this.consume(TokenType.IDENT, "Expected parameter name.")
        let defaultValue = null
        if (this.matchKeyword('as')) {
          defaultValue = this.parseExpression()
        }
        params.push({ name: name.value, type, default: defaultValue, loc: this.locOfToken(name) })
      } while (this.match(TokenType.COMMA))
    }

    const body = this.block()
    this.consumeKeyword('done', "Expected 'done' to close 'action' block.")

    return {
      type: 'Action',
      params,
      body,
      loc: { line: start.line, column: start.column, start: start.start, end: this.previous().end },
    }
  }

  // --- New expression ---

  parseNew() {
    const start = this.advance() // consume 'new'
    const className = this.consume(TokenType.IDENT, "Expected class name after 'new'.")
    this.consume(TokenType.LPAREN, "Expected '(' after class name.")
    const args = []
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression())
      } while (this.match(TokenType.COMMA))
    }
    this.consume(TokenType.RPAREN, "Expected ')' after arguments.")
    return {
      type: 'New',
      className: className.value,
      args,
      loc: { line: start.line, column: start.column, start: start.start, end: this.previous().end },
    }
  }

  // --- Loc Utilities ---

  locOfToken(tok) {
    return { line: tok.line, column: tok.column, start: tok.start, end: tok.end }
  }

  locFromNodes(left, right) {
    return { line: left.loc.line, column: left.loc.column, start: left.loc.start, end: right.loc.end }
  }
}
