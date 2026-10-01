import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Resolver } from './resolver.js'
import { Interpreter } from './interpreter.js'
import { ModuleLoader } from './modules.js'

export async function run(source, { input = [], files = {}, fileSystem } = {}) {
  const output = []
  let error = null
  const inputQueue = [...input]

  try {
    const tokens = new Lexer(source, 'test.nova').tokenize()
    const parser = new Parser(tokens, 'test.nova')
    const program = parser.parse()

    const resolver = new Resolver('test.nova')
    const resolverErrors = resolver.resolve(program)
    if (resolverErrors.length > 0) {
      return { output, error: resolverErrors[0], resolverErrors }
    }

    const onAsk = inputQueue.length > 0
      ? async (prompt) => {
          output.push(prompt)
          if (inputQueue.length === 0) {
            throw new Error('No more input available for ask')
          }
          return inputQueue.shift()
        }
      : null

    const interp = new Interpreter({
      output: (text) => output.push(text),
      onAsk,
      fileName: 'test.nova',
    })

    const allSources = { 'test.nova': source, ...files }
    const loader = new ModuleLoader(allSources, {
      output: (text) => output.push(text),
      onAsk,
      fileSystem: fileSystem || null,
    })
    interp.moduleLoader = loader

    if (fileSystem) {
      loader.registerFileSystemGlobals(interp)
    }

    await interp.run(program)
  } catch (e) {
    error = e
  }

  return { output, error }
}

export function createMemoryFS(initial = {}) {
  const store = new Map(Object.entries(initial))
  return {
    read(path) {
      if (!store.has(path)) return null
      return store.get(path)
    },
    write(path, content) {
      store.set(path, content)
    },
    remove(path) {
      store.delete(path)
    },
    list() {
      return [...store.keys()].sort()
    },
    _store: store,
  }
}
