import { typeName } from '../values.js'

export function getMapMethod(map, name, error, loc) {
  const methods = {
    has(args) {
      if (args.length !== 1) throw error('TypeError', `'has' expects 1 argument, got ${args.length}.`, null, loc)
      return map.entries.has(args[0])
    },

    keys(args) {
      if (args.length !== 0) throw error('TypeError', `'keys' expects 0 arguments, got ${args.length}.`, null, loc)
      return { _type: 'list', elements: [...map.entries.keys()] }
    },

    values(args) {
      if (args.length !== 0) throw error('TypeError', `'values' expects 0 arguments, got ${args.length}.`, null, loc)
      return { _type: 'list', elements: [...map.entries.values()] }
    },

    entries(args) {
      if (args.length !== 0) throw error('TypeError', `'entries' expects 0 arguments, got ${args.length}.`, null, loc)
      const result = []
      for (const [k, v] of map.entries) {
        result.push({ _type: 'list', elements: [k, v] })
      }
      return { _type: 'list', elements: result }
    },

    remove(args) {
      if (args.length !== 1) throw error('TypeError', `'remove' expects 1 argument (key), got ${args.length}.`, null, loc)
      const key = args[0]
      if (!map.entries.has(key)) {
        throw error('KeyError', `Key ${typeof key === 'string' ? '"' + key + '"' : key} not found in map.`, null, loc)
      }
      const val = map.entries.get(key)
      map.entries.delete(key)
      return val
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
