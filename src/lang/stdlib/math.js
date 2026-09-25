import { typeName } from '../values.js'

export function getMathBuiltins(error) {
  function assertNumber(name, v, argName, loc) {
    if (typeof v !== 'number') {
      throw error('TypeError', `'${name}' expects a number for ${argName}, got ${typeName(v)}.`, null, loc)
    }
  }

  return {
    abs: {
      _type: 'function', name: 'abs', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'abs' expects 1 argument, got ${args.length}.`, null, null)
        assertNumber('abs', args[0], 'argument', null)
        return Math.abs(args[0])
      }
    },

    min: {
      _type: 'function', name: 'min', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length < 2) throw error('TypeError', `'min' expects at least 2 arguments, got ${args.length}.`, null, null)
        for (let i = 0; i < args.length; i++) {
          assertNumber('min', args[i], `argument ${i + 1}`, null)
        }
        return Math.min(...args)
      }
    },

    max: {
      _type: 'function', name: 'max', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length < 2) throw error('TypeError', `'max' expects at least 2 arguments, got ${args.length}.`, null, null)
        for (let i = 0; i < args.length; i++) {
          assertNumber('max', args[i], `argument ${i + 1}`, null)
        }
        return Math.max(...args)
      }
    },

    floor: {
      _type: 'function', name: 'floor', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'floor' expects 1 argument, got ${args.length}.`, null, null)
        assertNumber('floor', args[0], 'argument', null)
        return Math.floor(args[0])
      }
    },

    ceil: {
      _type: 'function', name: 'ceil', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'ceil' expects 1 argument, got ${args.length}.`, null, null)
        assertNumber('ceil', args[0], 'argument', null)
        return Math.ceil(args[0])
      }
    },

    round: {
      _type: 'function', name: 'round', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length < 1 || args.length > 2) throw error('TypeError', `'round' expects 1 or 2 arguments, got ${args.length}.`, null, null)
        assertNumber('round', args[0], 'argument', null)
        if (args.length === 2) {
          assertNumber('round', args[1], 'places', null)
          const factor = Math.pow(10, args[1])
          return Math.round(args[0] * factor) / factor
        }
        return Math.round(args[0])
      }
    },

    sqrt: {
      _type: 'function', name: 'sqrt', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'sqrt' expects 1 argument, got ${args.length}.`, null, null)
        assertNumber('sqrt', args[0], 'argument', null)
        if (args[0] < 0) throw error('MathError', 'Cannot take square root of a negative number.', null, null)
        return Math.sqrt(args[0])
      }
    },

    power: {
      _type: 'function', name: 'power', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 2) throw error('TypeError', `'power' expects 2 arguments (base, exponent), got ${args.length}.`, null, null)
        assertNumber('power', args[0], 'base', null)
        assertNumber('power', args[1], 'exponent', null)
        return Math.pow(args[0], args[1])
      }
    },

    random: {
      _type: 'function', name: 'random', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 0) throw error('TypeError', `'random' expects 0 arguments, got ${args.length}.`, null, null)
        return Math.random()
      }
    },

    random_between: {
      _type: 'function', name: 'random_between', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 2) throw error('TypeError', `'random_between' expects 2 arguments (low, high), got ${args.length}.`, null, null)
        assertNumber('random_between', args[0], 'low', null)
        assertNumber('random_between', args[1], 'high', null)
        const lo = Math.ceil(args[0])
        const hi = Math.floor(args[1])
        return Math.floor(Math.random() * (hi - lo + 1)) + lo
      }
    },
  }
}
