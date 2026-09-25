import { typeName, toDisplay, isTruthy } from '../values.js'
import { getMathBuiltins } from './math.js'

function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  if (a._type === 'list' && b._type === 'list') {
    if (a.elements.length !== b.elements.length) return false
    for (let i = 0; i < a.elements.length; i++) {
      if (!deepEqual(a.elements[i], b.elements[i])) return false
    }
    return true
  }

  if (a._type === 'map' && b._type === 'map') {
    if (a.entries.size !== b.entries.size) return false
    for (const [k, v] of a.entries) {
      if (!b.entries.has(k)) return false
      if (!deepEqual(v, b.entries.get(k))) return false
    }
    return true
  }

  return false
}

export function registerGlobals(env, error) {
  const mathBuiltins = getMathBuiltins(error)
  for (const [name, fn] of Object.entries(mathBuiltins)) {
    env.declare(name, fn, {})
  }

  env.declare('to_number', {
    _type: 'function', name: 'to_number', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 1) throw error('TypeError', `'to_number' expects 1 argument, got ${args.length}.`, null, null)
      const v = args[0]
      if (typeof v === 'number') return v
      if (typeof v === 'boolean') return v ? 1 : 0
      if (typeof v === 'string') {
        const n = Number(v)
        if (isNaN(n)) throw error('TypeError', `Cannot convert "${v}" to a number.`, null, null)
        return n
      }
      if (v === null) return 0
      throw error('TypeError', `Cannot convert ${typeName(v)} to a number.`, null, null)
    }
  }, {})

  env.declare('to_text', {
    _type: 'function', name: 'to_text', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 1) throw error('TypeError', `'to_text' expects 1 argument, got ${args.length}.`, null, null)
      return toDisplay(args[0])
    }
  }, {})

  env.declare('to_truth', {
    _type: 'function', name: 'to_truth', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 1) throw error('TypeError', `'to_truth' expects 1 argument, got ${args.length}.`, null, null)
      return isTruthy(args[0])
    }
  }, {})

  env.declare('type_of', {
    _type: 'function', name: 'type_of', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 1) throw error('TypeError', `'type_of' expects 1 argument, got ${args.length}.`, null, null)
      return typeName(args[0])
    }
  }, {})

  env.declare('same', {
    _type: 'function', name: 'same', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 2) throw error('TypeError', `'same' expects 2 arguments, got ${args.length}.`, null, null)
      return deepEqual(args[0], args[1])
    }
  }, {})

  env.declare('range', {
    _type: 'function', name: 'range', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length < 2 || args.length > 3) throw error('TypeError', `'range' expects 2 or 3 arguments (start, end, [step]), got ${args.length}.`, null, null)
      const start = args[0]
      const end = args[1]
      const step = args.length === 3 ? args[2] : 1
      if (typeof start !== 'number') throw error('TypeError', `'range' start must be a number, got ${typeName(start)}.`, null, null)
      if (typeof end !== 'number') throw error('TypeError', `'range' end must be a number, got ${typeName(end)}.`, null, null)
      if (typeof step !== 'number' || step === 0) throw error('TypeError', `'range' step must be a non-zero number.`, null, null)
      const elements = []
      if (step > 0) {
        for (let i = start; i < end; i += step) elements.push(i)
      } else {
        for (let i = start; i > end; i += step) elements.push(i)
      }
      return { _type: 'list', elements }
    }
  }, {})

  env.declare('sleep', {
    _type: 'function', name: 'sleep', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 1) throw error('TypeError', `'sleep' expects 1 argument (ms), got ${args.length}.`, null, null)
      if (typeof args[0] !== 'number') throw error('TypeError', `'sleep' argument must be a number, got ${typeName(args[0])}.`, null, null)
      return null
    }
  }, {})

  env.declare('time_now', {
    _type: 'function', name: 'time_now', params: [], body: null, closure: null, boundThis: null,
    _native(args) {
      if (args.length !== 0) throw error('TypeError', `'time_now' expects 0 arguments, got ${args.length}.`, null, null)
      return Date.now()
    }
  }, {})
}
