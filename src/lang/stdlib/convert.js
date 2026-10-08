import { typeName, toDisplay } from '../values.js'

function novaToJs(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (value._type === 'list') return value.elements.map(novaToJs)
  if (value._type === 'map') {
    const obj = {}
    for (const [k, v] of value.entries) {
      obj[typeof k === 'string' ? k : toDisplay(k)] = novaToJs(v)
    }
    return obj
  }
  return toDisplay(value)
}

function jsToNova(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return { _type: 'list', elements: value.map(jsToNova) }
  }
  if (typeof value === 'object') {
    const entries = new Map()
    for (const [k, v] of Object.entries(value)) {
      entries.set(k, jsToNova(v))
    }
    return { _type: 'map', entries }
  }
  return String(value)
}

export function getConvertBuiltins(error) {
  return {
    to_list: {
      _type: 'function', name: 'to_list', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'to_list' expects 1 argument, got ${args.length}.`, null, null)
        const v = args[0]
        if (typeof v === 'string') {
          return { _type: 'list', elements: v.split('') }
        }
        if (v && v._type === 'list') return v
        if (v && v._type === 'map') {
          const pairs = []
          for (const [k, val] of v.entries) {
            pairs.push({ _type: 'list', elements: [k, val] })
          }
          return { _type: 'list', elements: pairs }
        }
        throw error('TypeError', `Cannot convert ${typeName(v)} to a list.`, "'to_list' works on text, list, and map.", null)
      }
    },

    to_map: {
      _type: 'function', name: 'to_map', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'to_map' expects 1 argument, got ${args.length}.`, null, null)
        const v = args[0]
        if (!v || v._type !== 'list') throw error('TypeError', `'to_map' expects a list of [key, value] pairs, got ${typeName(v)}.`, null, null)
        const entries = new Map()
        for (let i = 0; i < v.elements.length; i++) {
          const pair = v.elements[i]
          if (!pair || pair._type !== 'list' || pair.elements.length !== 2) {
            throw error('TypeError', `'to_map' element at index ${i} must be a [key, value] pair.`, null, null)
          }
          entries.set(pair.elements[0], pair.elements[1])
        }
        return { _type: 'map', entries }
      }
    },

    to_json: {
      _type: 'function', name: 'to_json', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'to_json' expects 1 argument, got ${args.length}.`, null, null)
        return JSON.stringify(novaToJs(args[0]))
      }
    },

    from_json: {
      _type: 'function', name: 'from_json', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'from_json' expects 1 argument, got ${args.length}.`, null, null)
        if (typeof args[0] !== 'string') throw error('TypeError', `'from_json' expects text, got ${typeName(args[0])}.`, null, null)
        try {
          return jsToNova(JSON.parse(args[0]))
        } catch (e) {
          throw error('ValueError', `Invalid JSON: ${e.message}`, null, null)
        }
      }
    },

    char_from: {
      _type: 'function', name: 'char_from', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'char_from' expects 1 argument (code), got ${args.length}.`, null, null)
        const code = args[0]
        if (typeof code !== 'number' || !Number.isInteger(code)) {
          throw error('TypeError', `'char_from' expects an integer, got ${typeName(code)}.`, null, null)
        }
        return String.fromCharCode(code)
      }
    },
  }
}
