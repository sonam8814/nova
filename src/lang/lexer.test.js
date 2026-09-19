import { describe, it, expect } from 'vitest'
import { Lexer, LexerError } from './lexer.js'
import { TokenType } from './tokens.js'

function tokenize(source) {
  return new Lexer(source, 'test.nova').tokenize()
}

function types(source) {
  return tokenize(source).map(t => t.type)
}

function values(source) {
  return tokenize(source).filter(t => t.type !== TokenType.EOF).map(t => t.value)
}

describe('Lexer', () => {
  // 1. Numbers
  it('tokenizes integers', () => {
    expect(values('42')).toEqual([42])
  })

  it('tokenizes floats', () => {
    expect(values('3.14')).toEqual([3.14])
  })

  it('tokenizes numbers with exponent', () => {
    expect(values('1e6')).toEqual([1e6])
    expect(values('2.5E3')).toEqual([2.5e3])
    expect(values('1e-2')).toEqual([0.01])
  })

  it('rejects double decimal point', () => {
    expect(() => tokenize('1.2.3')).toThrow('second decimal point')
  })

  it('rejects incomplete exponent', () => {
    expect(() => tokenize('1e')).toThrow('expected digits after exponent')
  })

  // 2. Text literals
  it('tokenizes text', () => {
    const tokens = tokenize('"hello"')
    expect(tokens[0].type).toBe(TokenType.TEXT)
    expect(tokens[0].value).toBe('hello')
  })

  it('handles escape sequences', () => {
    expect(values('"a\\nb"')).toEqual(['a\nb'])
    expect(values('"a\\tb"')).toEqual(['a\tb'])
    expect(values('"a\\\\"')).toEqual(['a\\'])
    expect(values('"a\\"b"')).toEqual(['a"b'])
  })

  it('handles escaped braces', () => {
    const tokens = tokenize('"\\{not interpolation}"')
    expect(tokens[0].value).toBe('\\{not interpolation}')
    expect(tokens[0].hasInterpolation).toBe(false)
  })

  it('marks interpolation', () => {
    const tokens = tokenize('"hello {name}"')
    expect(tokens[0].hasInterpolation).toBe(true)
  })

  it('marks no interpolation for plain text', () => {
    const tokens = tokenize('"hello world"')
    expect(tokens[0].hasInterpolation).toBe(false)
  })

  it('rejects unterminated text', () => {
    expect(() => tokenize('"hello')).toThrow('Unterminated text')
  })

  it('rejects unknown escape', () => {
    expect(() => tokenize('"\\x"')).toThrow('Unknown escape')
  })

  // 3. Identifiers
  it('tokenizes identifiers', () => {
    expect(values('foo bar_baz')).toEqual(['foo', 'bar_baz'])
    expect(types('foo')[0]).toBe(TokenType.IDENT)
  })

  it('identifiers can have digits after first char', () => {
    expect(values('x1 item2')).toEqual(['x1', 'item2'])
  })

  // 4. Keywords
  it('tokenizes keywords', () => {
    expect(types('remember')).toEqual([TokenType.KEYWORD, TokenType.EOF])
    expect(types('set')).toEqual([TokenType.KEYWORD, TokenType.EOF])
    expect(types('done')).toEqual([TokenType.KEYWORD, TokenType.EOF])
  })

  it('tokenizes multi-word keywords as separate tokens', () => {
    expect(values('check if')).toEqual(['check', 'if'])
    expect(values('give back')).toEqual(['give', 'back'])
    expect(values('for each')).toEqual(['for', 'each'])
    expect(values('size of')).toEqual(['size', 'of'])
    expect(values('is not')).toEqual(['is', 'not'])
    expect(values('is a')).toEqual(['is', 'a'])
  })

  // 5. Types
  it('tokenizes type names', () => {
    expect(types('number')[0]).toBe(TokenType.TYPE)
    expect(types('text')[0]).toBe(TokenType.TYPE)
    expect(types('truth')[0]).toBe(TokenType.TYPE)
    expect(types('list')[0]).toBe(TokenType.TYPE)
    expect(types('map')[0]).toBe(TokenType.TYPE)
    expect(types('anything')[0]).toBe(TokenType.TYPE)
  })

  // 6. Operators
  it('tokenizes arithmetic operators', () => {
    expect(types('+ - * / % ^')).toEqual([
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR,
      TokenType.SLASH, TokenType.PERCENT, TokenType.CARET,
      TokenType.EOF,
    ])
  })

  it('tokenizes comparison operators', () => {
    expect(types('< > <= >=')).toEqual([
      TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE, TokenType.EOF,
    ])
  })

  it('tokenizes equality operators', () => {
    expect(types('== !=')).toEqual([TokenType.EQEQ, TokenType.BANGEQ, TokenType.EOF])
  })

  // 7. Delimiters
  it('tokenizes delimiters', () => {
    expect(types('( ) [ ] { } , . :')).toEqual([
      TokenType.LPAREN, TokenType.RPAREN,
      TokenType.LBRACKET, TokenType.RBRACKET,
      TokenType.LBRACE, TokenType.RBRACE,
      TokenType.COMMA, TokenType.DOT, TokenType.COLON,
      TokenType.EOF,
    ])
  })

  // 8. Comments
  it('skips note comments', () => {
    expect(values('42 note this is a comment\n7')).toEqual([42, 7])
  })

  it('skips hash comments', () => {
    expect(values('42 # comment\n7')).toEqual([42, 7])
  })

  it('handles comment at end of file', () => {
    const tokens = tokenize('42 note end comment')
    expect(tokens.length).toBe(2) // NUMBER + EOF
    expect(tokens[0].value).toBe(42)
  })

  // 9. Error cases
  it('rejects lone =', () => {
    expect(() => tokenize('=')).toThrow("use 'as' for assignment")
  })

  it('rejects lone !', () => {
    expect(() => tokenize('!')).toThrow("use 'not' for negation")
  })

  it('rejects unrecognized character', () => {
    expect(() => tokenize('@')).toThrow("Unexpected character '@'")
  })

  // 10. Whitespace handling
  it('ignores all whitespace types', () => {
    expect(values('1  \t  2  \r\n  3')).toEqual([1, 2, 3])
  })

  // 11. Positions
  it('tracks line and column correctly', () => {
    const tokens = tokenize('remember x as 5\nset x to 10')
    // "remember" is at line 1, col 1
    expect(tokens[0].line).toBe(1)
    expect(tokens[0].column).toBe(1)
    // "set" is at line 2, col 1
    const setToken = tokens.find(t => t.value === 'set')
    expect(setToken.line).toBe(2)
    expect(setToken.column).toBe(1)
  })

  it('tracks start and end offsets', () => {
    const tokens = tokenize('abc 123')
    expect(tokens[0].start).toBe(0)
    expect(tokens[0].end).toBe(3)
    expect(tokens[1].start).toBe(4)
    expect(tokens[1].end).toBe(7)
  })

  // 12. Truthiness keywords
  it('tokenizes yes, no, nothing as keywords', () => {
    expect(types('yes')).toEqual([TokenType.KEYWORD, TokenType.EOF])
    expect(types('no')).toEqual([TokenType.KEYWORD, TokenType.EOF])
    expect(types('nothing')).toEqual([TokenType.KEYWORD, TokenType.EOF])
  })

  // 13. Logic keywords
  it('tokenizes and, or, not as keywords', () => {
    expect(types('and or not')).toEqual([
      TokenType.KEYWORD, TokenType.KEYWORD, TokenType.KEYWORD, TokenType.EOF,
    ])
  })

  // 14. EOF token
  it('always ends with EOF', () => {
    const tokens = tokenize('')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe(TokenType.EOF)
  })

  it('EOF carries final position', () => {
    const tokens = tokenize('a')
    const eof = tokens[tokens.length - 1]
    expect(eof.line).toBe(1)
    expect(eof.column).toBe(2)
  })

  // 15. Full program
  it('tokenizes a multi-line program with correct last-token position', () => {
    const program = `remember nums as [5, 3, 8, 1]

define search with list, target
  remember low as 0
  remember high as size of list - 1
  while low <= high
    remember mid as floor((low + high) / 2)
    check if list[mid] == target
      give back mid
    or if list[mid] < target
      set low to mid + 1
    otherwise
      set high to mid - 1
    done
  done
  give back -1
done

show search(nums, 8)
note should find index 2`

    const tokens = tokenize(program)
    expect(tokens.filter(t => t.type === TokenType.EOF)).toHaveLength(1)
    const lastNonEof = tokens[tokens.length - 2]
    expect(lastNonEof.type).toBe(TokenType.RPAREN)
    expect(lastNonEof.line).toBe(19)

    // verify various token types appear
    const tokenTypes = new Set(tokens.map(t => t.type))
    expect(tokenTypes.has(TokenType.KEYWORD)).toBe(true)
    expect(tokenTypes.has(TokenType.IDENT)).toBe(true)
    expect(tokenTypes.has(TokenType.NUMBER)).toBe(true)
    expect(tokenTypes.has(TokenType.LBRACKET)).toBe(true)
    expect(tokenTypes.has(TokenType.COMMA)).toBe(true)
  })

  // 16. Mixed expressions
  it('tokenizes a complex expression', () => {
    expect(values('2 + 3 * 4')).toEqual([2, '+', 3, '*', 4])
  })

  // 17. Negative number context
  it('minus is an operator, not part of a number', () => {
    const tokens = tokenize('-7')
    expect(tokens[0].type).toBe(TokenType.MINUS)
    expect(tokens[1].type).toBe(TokenType.NUMBER)
    expect(tokens[1].value).toBe(7)
  })

  // 18. String with newlines
  it('handles multiline text', () => {
    const tokens = tokenize('"line1\nline2"')
    expect(tokens[0].value).toBe('line1\nline2')
    expect(tokens[1].line).toBe(2)
  })

  // 19. Adjacent tokens
  it('tokenizes tokens without spaces', () => {
    expect(types('f(x)')).toEqual([
      TokenType.IDENT, TokenType.LPAREN, TokenType.IDENT, TokenType.RPAREN, TokenType.EOF,
    ])
  })

  // 20. Error location in LexerError
  it('error contains file, line, and column', () => {
    try {
      tokenize('@')
      expect.fail('should throw')
    } catch (e) {
      expect(e).toBeInstanceOf(LexerError)
      expect(e.file).toBe('test.nova')
      expect(e.line).toBe(1)
      expect(e.column).toBe(1)
    }
  })

  // 21. Lexeme matches source exactly
  it('lexeme matches source text', () => {
    const tokens = tokenize('"hello" 3.14 foo')
    expect(tokens[0].lexeme).toBe('"hello"')
    expect(tokens[1].lexeme).toBe('3.14')
    expect(tokens[2].lexeme).toBe('foo')
  })

  // 22. Map literal tokens
  it('tokenizes map literal syntax', () => {
    expect(types('{"a": 1}')).toEqual([
      TokenType.LBRACE, TokenType.TEXT, TokenType.COLON,
      TokenType.NUMBER, TokenType.RBRACE, TokenType.EOF,
    ])
  })

  // 23. Chained access
  it('tokenizes chained property and index access', () => {
    expect(types('obj.name[0]')).toEqual([
      TokenType.IDENT, TokenType.DOT, TokenType.IDENT,
      TokenType.LBRACKET, TokenType.NUMBER, TokenType.RBRACKET,
      TokenType.EOF,
    ])
  })

  // 24. Multiple strings
  it('tokenizes multiple text literals', () => {
    expect(values('"a" "b" "c"')).toEqual(['a', 'b', 'c'])
  })

  // 25. Error on unterminated string reports opening line
  it('unterminated text error references the opening position', () => {
    try {
      tokenize('x\n"hello')
      expect.fail('should throw')
    } catch (e) {
      expect(e.message).toContain('line 2')
    }
  })
})
