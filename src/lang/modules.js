import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Resolver } from './resolver.js'
import { Interpreter } from './interpreter.js'
import { FILE_EXT } from './config.js'
import { novaError, NovaThrow } from './errors.js'

export class ModuleLoader {
  constructor(sources, { output, onAsk, fileSystem, debugHook } = {}) {
    this.sources = sources
    this.output = output || (() => {})
    this.onAsk = onAsk || null
    this.fileSystem = fileSystem || null
    this.debugHook = debugHook || null
    this.cache = new Map()
    this.loading = new Set()
  }

  resolvePath(requestedPath) {
    let path = requestedPath
    if (!path.endsWith(FILE_EXT)) {
      path = path + FILE_EXT
    }
    return path
  }

  async load(requestedPath, fromFile) {
    const path = this.resolvePath(requestedPath)

    if (this.cache.has(path)) {
      return this.cache.get(path)
    }

    if (this.loading.has(path)) {
      const cycle = [...this.loading, path].join(' -> ')
      throw new NovaThrow(novaError('FileError', `Circular use — ${cycle}`, {
        hint: 'Break the cycle by restructuring your modules.',
      }))
    }

    if (!(path in this.sources)) {
      throw new NovaThrow(novaError('FileError', `Module '${requestedPath}' not found.`, {
        hint: `Expected a file named '${path}' in the project.`,
        file: fromFile || null,
      }))
    }

    this.loading.add(path)

    const source = this.sources[path]
    const tokens = new Lexer(source, path).tokenize()
    const parser = new Parser(tokens, path)
    const program = parser.parse()

    if (parser.errors.length > 0) {
      this.loading.delete(path)
      const err = parser.errors[0]
      throw new NovaThrow(novaError('SyntaxError', err.message, {
        hint: err.hint,
        file: path,
        line: err.line,
        column: err.column,
      }))
    }

    const resolver = new Resolver(path)
    const resolverErrors = resolver.resolve(program)
    if (resolverErrors.length > 0) {
      this.loading.delete(path)
      throw new NovaThrow(resolverErrors[0])
    }

    const interp = new Interpreter({
      output: this.output,
      onAsk: this.onAsk,
      fileName: path,
      debugHook: this.debugHook,
    })

    interp.moduleLoader = this

    if (this.fileSystem) {
      this.registerFileSystemGlobals(interp)
    }

    await interp.run(program)

    this.loading.delete(path)
    this.cache.set(path, interp.env)

    return interp.env
  }

  registerFileSystemGlobals(interp) {
    const fs = this.fileSystem
    const makeError = (kind, msg, hint) => {
      return new NovaThrow(novaError(kind, msg, { hint, file: interp.fileName }))
    }

    interp.globals.declare('__save__', {
      _type: 'function',
      name: '__save__',
      _native(args) {
        const [content, path] = args
        if (typeof content !== 'string') {
          throw makeError('TypeError', `save expects text content, got ${typeof content}.`, null)
        }
        if (typeof path !== 'string') {
          throw makeError('TypeError', `save expects a text path, got ${typeof path}.`, null)
        }
        fs.write(path, content)
        return null
      },
    }, {})

    interp.globals.declare('__delete_file__', {
      _type: 'function',
      name: '__delete_file__',
      _native(args) {
        const [path] = args
        if (typeof path !== 'string') {
          throw makeError('TypeError', `delete file expects a text path, got ${typeof path}.`, null)
        }
        fs.remove(path)
        return null
      },
    }, {})

    interp.globals.declare('files', {
      _type: 'function',
      name: 'files',
      _native(args) {
        if (args.length !== 0) {
          throw makeError('TypeError', `'files' expects 0 arguments, got ${args.length}.`, null)
        }
        const list = fs.list()
        return { _type: 'list', elements: list }
      },
    }, {})
  }
}
