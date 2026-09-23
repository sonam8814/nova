import { typeName, toDisplay, isTruthy } from '../values.js'

export function getListMethod(list, name, callFunction, error, loc) {
  const methods = {
    add(args) {
      if (args.length !== 1) throw error('TypeError', `'add' expects 1 argument, got ${args.length}.`, null, loc)
      list.elements.push(args[0])
      return null
    },

    insert(args) {
      if (args.length !== 2) throw error('TypeError', `'insert' expects 2 arguments (index, value), got ${args.length}.`, null, loc)
      const idx = args[0]
      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw error('TypeError', `'insert' index must be an integer, got ${typeName(idx)}.`, null, loc)
      }
      let index = idx
      if (index < 0) index = list.elements.length + index
      if (index < 0 || index > list.elements.length) {
        throw error('IndexError', `Insert index ${idx} out of bounds for list of size ${list.elements.length}.`, null, loc)
      }
      list.elements.splice(index, 0, args[1])
      return null
    },

    remove(args) {
      if (args.length !== 1) throw error('TypeError', `'remove' expects 1 argument (index), got ${args.length}.`, null, loc)
      const idx = args[0]
      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw error('TypeError', `'remove' index must be an integer, got ${typeName(idx)}.`, null, loc)
      }
      let index = idx
      if (index < 0) index = list.elements.length + index
      if (index < 0 || index >= list.elements.length) {
        throw error('IndexError', `Remove index ${idx} out of bounds for list of size ${list.elements.length}.`, null, loc)
      }
      return list.elements.splice(index, 1)[0]
    },

    pop(args) {
      if (args.length !== 0) throw error('TypeError', `'pop' expects 0 arguments, got ${args.length}.`, null, loc)
      if (list.elements.length === 0) {
        throw error('IndexError', 'Cannot pop from an empty list.', null, loc)
      }
      return list.elements.pop()
    },

    index_of(args) {
      if (args.length !== 1) throw error('TypeError', `'index_of' expects 1 argument, got ${args.length}.`, null, loc)
      const target = args[0]
      for (let i = 0; i < list.elements.length; i++) {
        if (list.elements[i] === target || (list.elements[i] === null && target === null)) return i
      }
      return -1
    },

    has(args) {
      if (args.length !== 1) throw error('TypeError', `'has' expects 1 argument, got ${args.length}.`, null, loc)
      const target = args[0]
      for (const el of list.elements) {
        if (el === target || (el === null && target === null)) return true
      }
      return false
    },

    slice(args) {
      if (args.length < 1 || args.length > 2) throw error('TypeError', `'slice' expects 1 or 2 arguments, got ${args.length}.`, null, loc)
      const start = args[0]
      const end = args.length === 2 ? args[1] : list.elements.length
      if (typeof start !== 'number' || !Number.isInteger(start)) {
        throw error('TypeError', `'slice' start must be an integer.`, null, loc)
      }
      if (typeof end !== 'number' || !Number.isInteger(end)) {
        throw error('TypeError', `'slice' end must be an integer.`, null, loc)
      }
      return { _type: 'list', elements: list.elements.slice(start, end) }
    },

    join(args) {
      if (args.length !== 1) throw error('TypeError', `'join' expects 1 argument (separator), got ${args.length}.`, null, loc)
      const sep = args[0]
      if (typeof sep !== 'string') {
        throw error('TypeError', `'join' separator must be text, got ${typeName(sep)}.`, null, loc)
      }
      return list.elements.map(el => toDisplay(el)).join(sep)
    },

    reverse(args) {
      if (args.length !== 0) throw error('TypeError', `'reverse' expects 0 arguments, got ${args.length}.`, null, loc)
      return { _type: 'list', elements: [...list.elements].reverse() }
    },

    sort(args) {
      if (args.length !== 0) throw error('TypeError', `'sort' expects 0 arguments. Use 'sort_by' for custom sorting.`, null, loc)
      const elems = [...list.elements]
      const first = elems.find(e => e !== null && e !== undefined)
      if (first === undefined) return { _type: 'list', elements: elems }
      if (typeof first === 'number') {
        elems.sort((a, b) => a - b)
      } else if (typeof first === 'string') {
        elems.sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
      } else {
        throw error('TypeError', `Cannot sort a list of ${typeName(first)}.`, 'sort works on numbers and text.', loc)
      }
      return { _type: 'list', elements: elems }
    },

    sort_by(args) {
      if (args.length !== 1) throw error('TypeError', `'sort_by' expects 1 argument (comparator action), got ${args.length}.`, null, loc)
      const fn = args[0]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'sort_by' argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      const elems = [...list.elements]
      const mapped = elems.map(el => ({ el, key: callFunction(fn, [el], loc) }))
      mapped.sort((a, b) => {
        if (typeof a.key === 'number' && typeof b.key === 'number') return a.key - b.key
        if (typeof a.key === 'string' && typeof b.key === 'string') return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
        throw error('TypeError', `sort_by comparator must return numbers or text, got ${typeName(a.key)}.`, null, loc)
      })
      return { _type: 'list', elements: mapped.map(m => m.el) }
    },

    copy(args) {
      if (args.length !== 0) throw error('TypeError', `'copy' expects 0 arguments, got ${args.length}.`, null, loc)
      return { _type: 'list', elements: [...list.elements] }
    },

    map(args) {
      if (args.length !== 1) throw error('TypeError', `'map' expects 1 argument (action), got ${args.length}.`, null, loc)
      const fn = args[0]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'map' argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      const result = list.elements.map(el => callFunction(fn, [el], loc))
      return { _type: 'list', elements: result }
    },

    filter(args) {
      if (args.length !== 1) throw error('TypeError', `'filter' expects 1 argument (action), got ${args.length}.`, null, loc)
      const fn = args[0]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'filter' argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      const result = list.elements.filter(el => isTruthy(callFunction(fn, [el], loc)))
      return { _type: 'list', elements: result }
    },

    reduce(args) {
      if (args.length !== 2) throw error('TypeError', `'reduce' expects 2 arguments (action, initial), got ${args.length}.`, null, loc)
      const fn = args[0]
      const initial = args[1]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'reduce' first argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      let acc = initial
      for (const el of list.elements) {
        acc = callFunction(fn, [acc, el], loc)
      }
      return acc
    },

    sum(args) {
      if (args.length !== 0) throw error('TypeError', `'sum' expects 0 arguments, got ${args.length}.`, null, loc)
      let total = 0
      for (const el of list.elements) {
        if (typeof el !== 'number') throw error('TypeError', `'sum' requires all elements to be numbers, found ${typeName(el)}.`, null, loc)
        total += el
      }
      return total
    },

    min(args) {
      if (args.length !== 0) throw error('TypeError', `'min' expects 0 arguments, got ${args.length}.`, null, loc)
      if (list.elements.length === 0) throw error('IndexError', `Cannot get min of an empty list.`, null, loc)
      let result = list.elements[0]
      for (let i = 1; i < list.elements.length; i++) {
        if (typeof list.elements[i] !== 'number') throw error('TypeError', `'min' requires all elements to be numbers, found ${typeName(list.elements[i])}.`, null, loc)
        if (list.elements[i] < result) result = list.elements[i]
      }
      return result
    },

    max(args) {
      if (args.length !== 0) throw error('TypeError', `'max' expects 0 arguments, got ${args.length}.`, null, loc)
      if (list.elements.length === 0) throw error('IndexError', `Cannot get max of an empty list.`, null, loc)
      let result = list.elements[0]
      for (let i = 1; i < list.elements.length; i++) {
        if (typeof list.elements[i] !== 'number') throw error('TypeError', `'max' requires all elements to be numbers, found ${typeName(list.elements[i])}.`, null, loc)
        if (list.elements[i] > result) result = list.elements[i]
      }
      return result
    },

    all(args) {
      if (args.length !== 1) throw error('TypeError', `'all' expects 1 argument (action), got ${args.length}.`, null, loc)
      const fn = args[0]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'all' argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      for (const el of list.elements) {
        if (!isTruthy(callFunction(fn, [el], loc))) return false
      }
      return true
    },

    any(args) {
      if (args.length !== 1) throw error('TypeError', `'any' expects 1 argument (action), got ${args.length}.`, null, loc)
      const fn = args[0]
      if (!fn || fn._type !== 'function') {
        throw error('TypeError', `'any' argument must be an action, got ${typeName(fn)}.`, null, loc)
      }
      for (const el of list.elements) {
        if (isTruthy(callFunction(fn, [el], loc))) return true
      }
      return false
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

