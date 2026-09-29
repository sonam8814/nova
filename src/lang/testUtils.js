import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Resolver } from './resolver.js'
import { Interpreter } from './interpreter.js'

export function run(source, { input = [], files = {} } = {}) {
  const output = []
  let error = null

  try {
    const tokens = new Lexer(source, 'test.nova').tokenize()
    const parser = new Parser(tokens, 'test.nova')
    const program = parser.parse()

    const resolver = new Resolver('test.nova')
    const resolverErrors = resolver.resolve(program)
    if (resolverErrors.length > 0) {
      return { output, error: resolverErrors[0], resolverErrors }
    }

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
