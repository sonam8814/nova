import { TokenType, KEYWORDS, TYPE_NAMES } from './tokens.js'

export class LexerError extends Error {
  constructor(message, file, line, column) {
    super(message)
    this.name = 'LexerError'
    this.file = file
    this.line = line
    this.column = column
  }
}

export class Lexer {
  constructor(source, fileName = 'unknown') {
    this.source = source
    this.fileName = fileName
    this.tokens = []
    this.pos = 0
    this.line = 1
    this.column = 1
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments()
      if (this.isAtEnd()) break
      this.scanToken()
    }
    this.tokens.push({
      type: TokenType.EOF,
      value: null,
      lexeme: '',
      line: this.line,
      column: this.column,
      start: this.pos,
      end: this.pos,
    })
    return this.tokens
  }

  isAtEnd() {
    return this.pos >= this.source.length
  }

  peek() {
    return this.source[this.pos]
  }

  peekNext() {
    if (this.pos + 1 >= this.source.length) return '\0'
    return this.source[this.pos + 1]
  }

  advance() {
    const ch = this.source[this.pos]
    this.pos++
    this.column++
    return ch
  }

  skipWhitespaceAndComments() {
    while (!this.isAtEnd()) {
      const ch = this.peek()
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance()
      } else if (ch === '\n') {
        this.pos++
        this.line++
        this.column = 1
      } else if (ch === '#') {
        this.consumeToEndOfLine()
      } else {
        break
      }
    }
  }

  consumeToEndOfLine() {
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.pos++
      this.column++
    }
  }

  scanToken() {
    const startLine = this.line
    const startColumn = this.column
    const startPos = this.pos
    const ch = this.peek()

    if (ch === '"') {
      this.scanText(startLine, startColumn, startPos)
      return
    }

    if (this.isDigit(ch)) {
      this.scanNumber(startLine, startColumn, startPos)
      return
    }

    if (this.isAlpha(ch)) {
      this.scanIdentifier(startLine, startColumn, startPos)
      return
    }

    this.advance()

    switch (ch) {
      case '+': this.addToken(TokenType.PLUS, '+', '+', startLine, startColumn, startPos, this.pos); break
      case '-': this.addToken(TokenType.MINUS, '-', '-', startLine, startColumn, startPos, this.pos); break
      case '*': this.addToken(TokenType.STAR, '*', '*', startLine, startColumn, startPos, this.pos); break
      case '/': this.addToken(TokenType.SLASH, '/', '/', startLine, startColumn, startPos, this.pos); break
      case '%': this.addToken(TokenType.PERCENT, '%', '%', startLine, startColumn, startPos, this.pos); break
      case '^': this.addToken(TokenType.CARET, '^', '^', startLine, startColumn, startPos, this.pos); break
      case '(': this.addToken(TokenType.LPAREN, '(', '(', startLine, startColumn, startPos, this.pos); break
      case ')': this.addToken(TokenType.RPAREN, ')', ')', startLine, startColumn, startPos, this.pos); break
      case '[': this.addToken(TokenType.LBRACKET, '[', '[', startLine, startColumn, startPos, this.pos); break
      case ']': this.addToken(TokenType.RBRACKET, ']', ']', startLine, startColumn, startPos, this.pos); break
      case '{': this.addToken(TokenType.LBRACE, '{', '{', startLine, startColumn, startPos, this.pos); break
      case '}': this.addToken(TokenType.RBRACE, '}', '}', startLine, startColumn, startPos, this.pos); break
      case ',': this.addToken(TokenType.COMMA, ',', ',', startLine, startColumn, startPos, this.pos); break
      case '.': this.addToken(TokenType.DOT, '.', '.', startLine, startColumn, startPos, this.pos); break
      case ':': this.addToken(TokenType.COLON, ':', ':', startLine, startColumn, startPos, this.pos); break
      case '<':
        if (!this.isAtEnd() && this.peek() === '=') {
          this.advance()
          this.addToken(TokenType.LTE, '<=', '<=', startLine, startColumn, startPos, this.pos)
        } else {
          this.addToken(TokenType.LT, '<', '<', startLine, startColumn, startPos, this.pos)
        }
        break
      case '>':
        if (!this.isAtEnd() && this.peek() === '=') {
          this.advance()
          this.addToken(TokenType.GTE, '>=', '>=', startLine, startColumn, startPos, this.pos)
        } else {
          this.addToken(TokenType.GT, '>', '>', startLine, startColumn, startPos, this.pos)
        }
        break
      case '=':
        if (!this.isAtEnd() && this.peek() === '=') {
          this.advance()
          this.addToken(TokenType.EQEQ, '==', '==', startLine, startColumn, startPos, this.pos)
        } else {
          this.error(`Unexpected character '='. Hint: use 'as' for assignment, '==' for comparison.`, startLine, startColumn)
        }
        break
      case '!':
        if (!this.isAtEnd() && this.peek() === '=') {
          this.advance()
          this.addToken(TokenType.BANGEQ, '!=', '!=', startLine, startColumn, startPos, this.pos)
        } else {
          this.error(`Unexpected character '!'. Hint: use 'not' for negation.`, startLine, startColumn)
        }
        break
      default:
        this.error(`Unexpected character '${ch}'.`, startLine, startColumn)
    }
  }

  scanText(startLine, startColumn, startPos) {
    this.advance() // consume opening "
    let value = ''
    let hasInterpolation = false
    const openLine = startLine
    const openColumn = startColumn

    while (!this.isAtEnd() && this.peek() !== '"') {
      const ch = this.peek()

      if (ch === '\n') {
        this.pos++
        this.line++
        this.column = 1
        value += '\n'
        continue
      }

      if (ch === '\\') {
        this.advance()
        if (this.isAtEnd()) {
          this.error(`Unterminated text literal starting at line ${openLine}, column ${openColumn}.`, this.line, this.column)
        }
        const escaped = this.advance()
        switch (escaped) {
          case 'n': value += '\n'; break
          case 't': value += '\t'; break
          case '\\': value += '\\'; break
          case '"': value += '"'; break
          case '{': value += '\\{'; break
          default:
            this.error(`Unknown escape sequence '\\${escaped}'.`, this.line, this.column - 1)
        }
        continue
      }

      if (ch === '{') {
        hasInterpolation = true
      }

      value += this.advance()
    }

    if (this.isAtEnd()) {
      this.error(`Unterminated text literal starting at line ${openLine}, column ${openColumn}.`, openLine, openColumn)
    }

    this.advance() // consume closing "
    const lexeme = this.source.slice(startPos, this.pos)
    this.addToken(TokenType.TEXT, value, lexeme, startLine, startColumn, startPos, this.pos, hasInterpolation)
  }

  scanNumber(startLine, startColumn, startPos) {
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance()
    }

    if (!this.isAtEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance() // consume .
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance()
      }
    }

    if (!this.isAtEnd() && (this.peek() === 'e' || this.peek() === 'E')) {
      this.advance()
      if (!this.isAtEnd() && (this.peek() === '+' || this.peek() === '-')) {
        this.advance()
      }
      if (this.isAtEnd() || !this.isDigit(this.peek())) {
        this.error(`Invalid number: expected digits after exponent.`, startLine, startColumn)
      }
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance()
      }
    }

    if (!this.isAtEnd() && this.peek() === '.') {
      this.error(`Invalid number: unexpected second decimal point.`, this.line, this.column)
    }

    const lexeme = this.source.slice(startPos, this.pos)
    const value = Number(lexeme)
    this.addToken(TokenType.NUMBER, value, lexeme, startLine, startColumn, startPos, this.pos)
  }

  scanIdentifier(startLine, startColumn, startPos) {
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      this.advance()
    }

    const lexeme = this.source.slice(startPos, this.pos)

    if (lexeme === 'note') {
      this.consumeToEndOfLine()
      return
    }

    if (TYPE_NAMES.has(lexeme)) {
      this.addToken(TokenType.TYPE, lexeme, lexeme, startLine, startColumn, startPos, this.pos)
      return
    }

    if (KEYWORDS.has(lexeme)) {
      this.addToken(TokenType.KEYWORD, lexeme, lexeme, startLine, startColumn, startPos, this.pos)
      return
    }

    this.addToken(TokenType.IDENT, lexeme, lexeme, startLine, startColumn, startPos, this.pos)
  }

  addToken(type, value, lexeme, line, column, start, end, hasInterpolation = false) {
    const token = { type, value, lexeme, line, column, start, end }
    if (type === TokenType.TEXT) {
      token.hasInterpolation = hasInterpolation
    }
    this.tokens.push(token)
  }

  isDigit(ch) {
    return ch >= '0' && ch <= '9'
  }

  isAlpha(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
  }

  isAlphaNumeric(ch) {
    return this.isDigit(ch) || this.isAlpha(ch)
  }

  error(message, line, column) {
    throw new LexerError(message, this.fileName, line, column)
  }
}
