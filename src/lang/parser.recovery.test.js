import { describe, it, expect } from 'vitest'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'

function parse(src) {
  const tokens = new Lexer(src, 'test.nova').tokenize()
  const parser = new Parser(tokens, 'test.nova')
  return parser.parse()
}

describe('parser error recovery', () => {
  it('recovers from a bad statement and parses the next one', () => {
    const ast = parse('remember x as\nremember y as 10')
    expect(ast.errors.length).toBeGreaterThanOrEqual(1)
    const validStmts = ast.body.filter(s => s.type === 'Declare')
    expect(validStmts.length).toBe(1)
    expect(validStmts[0].name).toBe('y')
  })

  it('collects multiple errors from different statements', () => {
    const ast = parse('remember a as\nremember b as\nremember c as 42')
    expect(ast.errors.length).toBeGreaterThanOrEqual(2)
    const validStmts = ast.body.filter(s => s.type === 'Declare')
    expect(validStmts.length).toBe(1)
    expect(validStmts[0].name).toBe('c')
  })

  it('recovers inside a block and continues parsing', () => {
    const src = `check if yes
  remember x as
  show "hello"
done`
    const ast = parse(src)
    expect(ast.errors.length).toBeGreaterThanOrEqual(1)
    expect(ast.body.length).toBe(1)
    expect(ast.body[0].type).toBe('If')
  })

  it('still works for valid programs with no errors', () => {
    const ast = parse('remember x as 5\nshow x')
    expect(ast.errors).toEqual([])
    expect(ast.body.length).toBe(2)
  })

  it('reports error for missing done keyword', () => {
    const src = `while yes
  show 1
remember x as 5`
    expect(() => parse(src)).toThrow(/done/)
  })

  it('errors have line and column info', () => {
    const ast = parse('remember x as\nremember y as 10')
    expect(ast.errors.length).toBeGreaterThanOrEqual(1)
    const err = ast.errors[0]
    expect(err.line).toBeDefined()
    expect(err.column).toBeDefined()
  })

  it('recovers from bad expression in show statement', () => {
    const src = `show )\nshow "valid"`
    const ast = parse(src)
    expect(ast.errors.length).toBeGreaterThanOrEqual(1)
    const showStmts = ast.body.filter(s => s.type === 'Show')
    expect(showStmts.length).toBe(1)
  })

  it('attaches errors array to the program node', () => {
    const ast = parse('remember x as 5')
    expect(Array.isArray(ast.errors)).toBe(true)
  })

  it('throws the first error if no valid statements could be parsed', () => {
    expect(() => parse(')')).toThrow()
  })
})
