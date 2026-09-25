import { typeName } from '../values.js'

export function getTextMethod(str, name, error, loc) {
  const methods = {
    upper(args) {
      if (args.length !== 0) throw error('TypeError', `'upper' expects 0 arguments, got ${args.length}.`, null, loc)
      return str.toUpperCase()
    },

    lower(args) {
      if (args.length !== 0) throw error('TypeError', `'lower' expects 0 arguments, got ${args.length}.`, null, loc)
      return str.toLowerCase()
    },

    trim(args) {
      if (args.length !== 0) throw error('TypeError', `'trim' expects 0 arguments, got ${args.length}.`, null, loc)
      return str.trim()
    },

    split(args) {
      if (args.length !== 1) throw error('TypeError', `'split' expects 1 argument (separator), got ${args.length}.`, null, loc)
      const sep = args[0]
      if (typeof sep !== 'string') {
        throw error('TypeError', `'split' separator must be text, got ${typeName(sep)}.`, null, loc)
      }
      return { _type: 'list', elements: str.split(sep) }
    },

    has(args) {
      if (args.length !== 1) throw error('TypeError', `'has' expects 1 argument, got ${args.length}.`, null, loc)
      const sub = args[0]
      if (typeof sub !== 'string') {
        throw error('TypeError', `'has' argument must be text, got ${typeName(sub)}.`, null, loc)
      }
      return str.includes(sub)
    },

    starts_with(args) {
      if (args.length !== 1) throw error('TypeError', `'starts_with' expects 1 argument, got ${args.length}.`, null, loc)
      const prefix = args[0]
      if (typeof prefix !== 'string') {
        throw error('TypeError', `'starts_with' argument must be text, got ${typeName(prefix)}.`, null, loc)
      }
      return str.startsWith(prefix)
    },

    ends_with(args) {
      if (args.length !== 1) throw error('TypeError', `'ends_with' expects 1 argument, got ${args.length}.`, null, loc)
      const suffix = args[0]
      if (typeof suffix !== 'string') {
        throw error('TypeError', `'ends_with' argument must be text, got ${typeName(suffix)}.`, null, loc)
      }
      return str.endsWith(suffix)
    },

    replace(args) {
      if (args.length !== 2) throw error('TypeError', `'replace' expects 2 arguments (target, replacement), got ${args.length}.`, null, loc)
      const target = args[0]
      const replacement = args[1]
      if (typeof target !== 'string') {
        throw error('TypeError', `'replace' target must be text, got ${typeName(target)}.`, null, loc)
      }
      if (typeof replacement !== 'string') {
        throw error('TypeError', `'replace' replacement must be text, got ${typeName(replacement)}.`, null, loc)
      }
      return str.replaceAll(target, replacement)
    },

    slice(args) {
      if (args.length < 1 || args.length > 2) throw error('TypeError', `'slice' expects 1 or 2 arguments, got ${args.length}.`, null, loc)
      const start = args[0]
      const end = args.length === 2 ? args[1] : str.length
      if (typeof start !== 'number' || !Number.isInteger(start)) {
        throw error('TypeError', `'slice' start must be an integer.`, null, loc)
      }
      if (typeof end !== 'number' || !Number.isInteger(end)) {
        throw error('TypeError', `'slice' end must be an integer.`, null, loc)
      }
      return str.slice(start, end)
    },

    index_of(args) {
      if (args.length !== 1) throw error('TypeError', `'index_of' expects 1 argument, got ${args.length}.`, null, loc)
      const sub = args[0]
      if (typeof sub !== 'string') {
        throw error('TypeError', `'index_of' argument must be text, got ${typeName(sub)}.`, null, loc)
      }
      return str.indexOf(sub)
    },

    repeat(args) {
      if (args.length !== 1) throw error('TypeError', `'repeat' expects 1 argument (count), got ${args.length}.`, null, loc)
      const count = args[0]
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
        throw error('TypeError', `'repeat' count must be a non-negative integer, got ${typeName(count)}.`, null, loc)
      }
      return str.repeat(count)
    },

    chars(args) {
      if (args.length !== 0) throw error('TypeError', `'chars' expects 0 arguments, got ${args.length}.`, null, loc)
      return { _type: 'list', elements: str.split('') }
    },

    code_at(args) {
      if (args.length !== 1) throw error('TypeError', `'code_at' expects 1 argument (index), got ${args.length}.`, null, loc)
      const idx = args[0]
      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw error('TypeError', `'code_at' index must be an integer, got ${typeName(idx)}.`, null, loc)
      }
      let index = idx
      if (index < 0) index = str.length + index
      if (index < 0 || index >= str.length) {
        throw error('IndexError', `Index ${idx} out of bounds for text of length ${str.length}.`, null, loc)
      }
      return str.charCodeAt(index)
    },
  }

  if (!(name in methods)) return null
  return {
    _type: 'function',
    name,
    params: [],
    body: null,
    closure: null,
    boundThis: null,
    _native: methods[name],
  }
}
