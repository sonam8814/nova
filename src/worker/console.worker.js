import { Lexer } from '../lang/lexer.js'
import { Parser } from '../lang/parser.js'
import { Resolver } from '../lang/resolver.js'
import { Interpreter } from '../lang/interpreter.js'
import { formatError } from '../lang/errors.js'
import { toDisplay } from '../lang/values.js'
import { registerGlobals } from '../lang/stdlib/globals.js'
import { Environment } from '../lang/environment.js'

let interpreter = null

function createInterpreter(post) {
  const env = new Environment()
  const interp = new Interpreter({
    output: (text) => post({ type: 'output', text, stream: 'out' }),
    fileName: 'console',
  })
  registerGlobals(interp.globals, (kind, msg, hint, loc) => interp.error(kind, msg, hint, loc))
  return interp
}

async function evalLine(code, post) {
  if (!interpreter) {
    interpreter = createInterpreter(post)
  }

  const source = code.trim()
  if (!source) {
    post({ type: 'result', value: null })
    return
  }

  try {
    const tokens = new Lexer(source, 'console').tokenize()

    let program
    try {
      const parser = new Parser(tokens, 'console')
      program = parser.parse()
    } catch (parseErr) {
      if (parseErr.kind || parseErr.name === 'ParseError') {
        post({ type: 'error', text: parseErr.message })
        return
      }
      throw parseErr
    }

    const resolver = new Resolver('console')
    const resolverErrors = resolver.resolve(program)
    if (resolverErrors.length > 0) {
      post({ type: 'error', text: resolverErrors[0].message })
      return
    }

    let lastValue = null
    const origOutput = interpreter.output
    interpreter.output = (text) => post({ type: 'output', text, stream: 'out' })
    interpreter.steps = 0

    try {
      for (const stmt of program.body) {
        interpreter.hoistFunctions([stmt])

        if (stmt.type === 'ExprStmt') {
          lastValue = await interpreter.evaluate(stmt.expression)
        } else {
          await interpreter.execute(stmt)
          lastValue = null
        }
      }
    } finally {
      interpreter.output = origOutput
    }

    if (lastValue !== null && lastValue !== undefined) {
      post({ type: 'result', value: toDisplay(lastValue) })
    } else {
      post({ type: 'result', value: null })
    }
  } catch (e) {
    if (e.errorData) {
      post({ type: 'error', text: e.errorData.message })
    } else {
      post({ type: 'error', text: e.message || 'Unknown error' })
    }
  }
}

function resetInterpreter() {
  interpreter = null
}

if (typeof self !== 'undefined') {
  self.onmessage = function (e) {
    const { type, ...data } = e.data

    switch (type) {
      case 'eval':
        evalLine(data.code, (msg) => self.postMessage(msg))
          .then(() => self.postMessage({ type: 'done' }))
        break
      case 'reset':
        resetInterpreter()
        self.postMessage({ type: 'reset-done' })
        break
    }
  }
}
