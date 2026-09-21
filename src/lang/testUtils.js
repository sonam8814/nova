import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Interpreter } from './interpreter.js'

export function run(source, { input = [], files = {} } = {}) {
  const output = []
  let error = null

  try {
    const tokens = new Lexer(source, 'test.nova').tokenize()
    const parser = new Parser(tokens, 'test.nova')
    const program = parser.parse()
    const interp = new Interpreter({
      output: (text) => output.push(text),
      fileName: 'test.nova',
    })
    interp.run(program)
  } catch (e) {
    error = e
  }

  return { output, error }
}
