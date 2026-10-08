import { typeName } from '../values.js'

export function getRandomBuiltins(error) {
  return {
    random_pick: {
      _type: 'function', name: 'random_pick', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'random_pick' expects 1 argument, got ${args.length}.`, null, null)
        const list = args[0]
        if (!list || list._type !== 'list') throw error('TypeError', `'random_pick' expects a list, got ${typeName(list)}.`, null, null)
        if (list.elements.length === 0) throw error('IndexError', `Cannot pick from an empty list.`, null, null)
        return list.elements[Math.floor(Math.random() * list.elements.length)]
      }
    },

    random_shuffle: {
      _type: 'function', name: 'random_shuffle', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'random_shuffle' expects 1 argument, got ${args.length}.`, null, null)
        const list = args[0]
        if (!list || list._type !== 'list') throw error('TypeError', `'random_shuffle' expects a list, got ${typeName(list)}.`, null, null)
        const copy = [...list.elements]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return { _type: 'list', elements: copy }
      }
    },

    random_chance: {
      _type: 'function', name: 'random_chance', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 1) throw error('TypeError', `'random_chance' expects 1 argument (percent), got ${args.length}.`, null, null)
        const pct = args[0]
        if (typeof pct !== 'number') throw error('TypeError', `'random_chance' expects a number, got ${typeName(pct)}.`, null, null)
        return Math.random() * 100 < pct
      }
    },

    random_id: {
      _type: 'function', name: 'random_id', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 0) throw error('TypeError', `'random_id' expects 0 arguments, got ${args.length}.`, null, null)
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let id = ''
        for (let i = 0; i < 8; i++) {
          id += chars[Math.floor(Math.random() * chars.length)]
        }
        return id
      }
    },

    random_sample: {
      _type: 'function', name: 'random_sample', params: [], body: null, closure: null, boundThis: null,
      _native(args) {
        if (args.length !== 2) throw error('TypeError', `'random_sample' expects 2 arguments (list, count), got ${args.length}.`, null, null)
        const list = args[0]
        const count = args[1]
        if (!list || list._type !== 'list') throw error('TypeError', `'random_sample' first argument must be a list, got ${typeName(list)}.`, null, null)
        if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
          throw error('TypeError', `'random_sample' count must be a non-negative integer, got ${typeName(count)}.`, null, null)
        }
        if (count > list.elements.length) {
          throw error('ValueError', `'random_sample' count (${count}) exceeds list size (${list.elements.length}).`, null, null)
        }
        const pool = [...list.elements]
        const result = []
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * pool.length)
          result.push(pool[idx])
          pool.splice(idx, 1)
        }
        return { _type: 'list', elements: result }
      }
    },
  }
}
