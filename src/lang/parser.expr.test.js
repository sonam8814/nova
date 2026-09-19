import { describe, it, expect } from 'vitest'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'

function parse(source) {
  const lexer = new Lexer(source, 'test.nova')
  const tokens = lexer.tokenize()
  const parser = new Parser(tokens, 'test.nova')
  return parser.parseExpression()
}

describe('Parser — expressions', () => {
  it('parses 2 + 3 * 4 with correct precedence', () => {
    const ast = parse('2 + 3 * 4')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('+')
    expect(ast.left.type).toBe('Num')
    expect(ast.left.value).toBe(2)
    expect(ast.right.type).toBe('Binary')
    expect(ast.right.operator).toBe('*')
    expect(ast.right.left.value).toBe(3)
    expect(ast.right.right.value).toBe(4)
  })

  it('parses (2 + 3) * 4 with grouping', () => {
    const ast = parse('(2 + 3) * 4')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('*')
    expect(ast.left.type).toBe('Grouping')
    expect(ast.left.expression.type).toBe('Binary')
    expect(ast.left.expression.operator).toBe('+')
    expect(ast.right.value).toBe(4)
  })

  it('parses 2 ^ 3 ^ 2 as right-associative', () => {
    const ast = parse('2 ^ 3 ^ 2')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('^')
    expect(ast.left.value).toBe(2)
    expect(ast.right.type).toBe('Binary')
    expect(ast.right.operator).toBe('^')
    expect(ast.right.left.value).toBe(3)
    expect(ast.right.right.value).toBe(2)
  })

  it('parses not foo and bar correctly (not binds tighter)', () => {
    const ast = parse('not foo and bar')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('and')
    expect(ast.left.type).toBe('Unary')
    expect(ast.left.operator).toBe('not')
    expect(ast.left.operand.name).toBe('foo')
    expect(ast.right.name).toBe('bar')
  })

  it('parses val or bar and baz correctly (and binds tighter)', () => {
    const ast = parse('val or bar and baz')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('or')
    expect(ast.left.name).toBe('val')
    expect(ast.right.type).toBe('Binary')
    expect(ast.right.operator).toBe('and')
  })

  it('parses -x ^ 2 as (-x) ^ 2 per spec precedence', () => {
    const ast = parse('-x ^ 2')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('^')
    expect(ast.left.type).toBe('Unary')
    expect(ast.left.operator).toBe('-')
    expect(ast.left.operand.name).toBe('x')
    expect(ast.right.value).toBe(2)
  })

  it('parses size of nums + 1 as (size of nums) + 1', () => {
    const ast = parse('size of nums + 1')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('+')
    expect(ast.left.type).toBe('Unary')
    expect(ast.left.operator).toBe('size of')
    expect(ast.left.operand.name).toBe('nums')
    expect(ast.right.value).toBe(1)
  })

  it('parses foo.bar.baz as chained property access', () => {
    const ast = parse('foo.bar.baz')
    expect(ast.type).toBe('Property')
    expect(ast.name).toBe('baz')
    expect(ast.object.type).toBe('Property')
    expect(ast.object.name).toBe('bar')
    expect(ast.object.object.name).toBe('foo')
  })

  it('parses f(1)(2) as chained calls', () => {
    const ast = parse('f(1)(2)')
    expect(ast.type).toBe('Call')
    expect(ast.args[0].value).toBe(2)
    expect(ast.callee.type).toBe('Call')
    expect(ast.callee.args[0].value).toBe(1)
    expect(ast.callee.callee.name).toBe('f')
  })

  it('parses m["k"][0] as chained index', () => {
    const ast = parse('m["k"][0]')
    expect(ast.type).toBe('Index')
    expect(ast.index.value).toBe(0)
    expect(ast.object.type).toBe('Index')
    expect(ast.object.index.value).toBe('k')
    expect(ast.object.object.name).toBe('m')
  })

  it('parses [1, [2, 3]] as nested list literal', () => {
    const ast = parse('[1, [2, 3]]')
    expect(ast.type).toBe('ListLit')
    expect(ast.elements).toHaveLength(2)
    expect(ast.elements[0].value).toBe(1)
    expect(ast.elements[1].type).toBe('ListLit')
    expect(ast.elements[1].elements).toHaveLength(2)
  })

  it('parses {"a": {"b": 1}} as nested map literal', () => {
    const ast = parse('{"a": {"b": 1}}')
    expect(ast.type).toBe('MapLit')
    expect(ast.pairs).toHaveLength(1)
    expect(ast.pairs[0].key.value).toBe('a')
    expect(ast.pairs[0].value.type).toBe('MapLit')
    expect(ast.pairs[0].value.pairs[0].key.value).toBe('b')
    expect(ast.pairs[0].value.pairs[0].value.value).toBe(1)
  })

  it('parses interpolated text "hi {n + 1} there"', () => {
    const ast = parse('"hi {n + 1} there"')
    expect(ast.type).toBe('Interpolation')
    expect(ast.parts).toHaveLength(3)
    expect(ast.parts[0].type).toBe('Text')
    expect(ast.parts[0].value).toBe('hi ')
    expect(ast.parts[1].type).toBe('Binary')
    expect(ast.parts[1].operator).toBe('+')
    expect(ast.parts[2].type).toBe('Text')
    expect(ast.parts[2].value).toBe(' there')
  })

  it('parses yes, no, nothing as literals', () => {
    expect(parse('yes').type).toBe('Bool')
    expect(parse('yes').value).toBe(true)
    expect(parse('no').type).toBe('Bool')
    expect(parse('no').value).toBe(false)
    expect(parse('nothing').type).toBe('Nothing')
  })

  it('parses my and parent as identifiers', () => {
    expect(parse('my').type).toBe('Ident')
    expect(parse('my').name).toBe('my')
    expect(parse('parent').type).toBe('Ident')
    expect(parse('parent').name).toBe('parent')
  })

  it('parses == and != operators', () => {
    const eq = parse('foo == bar')
    expect(eq.type).toBe('Binary')
    expect(eq.operator).toBe('==')

    const neq = parse('foo != bar')
    expect(neq.type).toBe('Binary')
    expect(neq.operator).toBe('!=')
  })

  it('parses is, is not, is a operators', () => {
    const is_ = parse('foo is bar')
    expect(is_.operator).toBe('is')

    const isNot = parse('foo is not bar')
    expect(isNot.operator).toBe('is not')

    const isA = parse('d is a Dog')
    expect(isA.operator).toBe('is a')
  })

  it('parses comparison operators', () => {
    expect(parse('foo < bar').operator).toBe('<')
    expect(parse('foo > bar').operator).toBe('>')
    expect(parse('foo <= bar').operator).toBe('<=')
    expect(parse('foo >= bar').operator).toBe('>=')
  })

  it('parses empty list []', () => {
    const ast = parse('[]')
    expect(ast.type).toBe('ListLit')
    expect(ast.elements).toHaveLength(0)
  })

  it('parses empty map {}', () => {
    const ast = parse('{}')
    expect(ast.type).toBe('MapLit')
    expect(ast.pairs).toHaveLength(0)
  })

  it('parses trailing comma in list [1, 2,]', () => {
    const ast = parse('[1, 2,]')
    expect(ast.type).toBe('ListLit')
    expect(ast.elements).toHaveLength(2)
  })

  it('parses trailing comma in map {"a": 1,}', () => {
    const ast = parse('{"a": 1,}')
    expect(ast.type).toBe('MapLit')
    expect(ast.pairs).toHaveLength(1)
  })

  it('parses new ClassName(args)', () => {
    const ast = parse('new Dog("Rex", 3)')
    expect(ast.type).toBe('New')
    expect(ast.className).toBe('Dog')
    expect(ast.args).toHaveLength(2)
    expect(ast.args[0].value).toBe('Rex')
    expect(ast.args[1].value).toBe(3)
  })

  it('parses a plain text string without interpolation', () => {
    const ast = parse('"hello world"')
    expect(ast.type).toBe('Text')
    expect(ast.value).toBe('hello world')
  })

  it('parses escaped brace in text as literal', () => {
    const ast = parse('"use \\{braces}"')
    expect(ast.type).toBe('Text')
    expect(ast.value).toBe('use {braces}')
  })

  it('parses complex mixed expression obj.prop[0](x).field', () => {
    const ast = parse('obj.prop[0](x).field')
    expect(ast.type).toBe('Property')
    expect(ast.name).toBe('field')
    expect(ast.object.type).toBe('Call')
    expect(ast.object.callee.type).toBe('Index')
    expect(ast.object.callee.object.type).toBe('Property')
    expect(ast.object.callee.object.object.name).toBe('obj')
  })

  it('parses unary minus on a number', () => {
    const ast = parse('-7')
    expect(ast.type).toBe('Unary')
    expect(ast.operator).toBe('-')
    expect(ast.operand.value).toBe(7)
  })

  it('parses multiple arithmetic operators left-to-right', () => {
    const ast = parse('1 + 2 + 3')
    expect(ast.type).toBe('Binary')
    expect(ast.operator).toBe('+')
    expect(ast.left.type).toBe('Binary')
    expect(ast.left.operator).toBe('+')
    expect(ast.left.left.value).toBe(1)
    expect(ast.left.right.value).toBe(2)
    expect(ast.right.value).toBe(3)
  })

  it('every node has a loc with line, column, start, end', () => {
    const ast = parse('2 + 3')
    expect(ast.loc).toBeDefined()
    expect(ast.loc.line).toBe(1)
    expect(ast.loc.column).toBe(1)
    expect(typeof ast.loc.start).toBe('number')
    expect(typeof ast.loc.end).toBe('number')
    expect(ast.left.loc).toBeDefined()
    expect(ast.right.loc).toBeDefined()
  })

  it('throws on unexpected token with hint', () => {
    expect(() => parse(')')).toThrow()
    try {
      parse(')')
    } catch (e) {
      expect(e.kind).toBe('SyntaxError')
      expect(e.line).toBe(1)
      expect(e.column).toBe(1)
    }
  })
})
