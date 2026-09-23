import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 7 — List stdlib', () => {

  // --- Mutation methods ---

  describe('add', () => {
    it('appends an element', () => {
      const { output } = run(`
        remember nums as [1, 2]
        nums.add(3)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })

    it('mutates in place', () => {
      const { output } = run(`
        remember a as [1]
        remember b as a
        a.add(2)
        show b
      `)
      expect(output).toEqual(['[1, 2]'])
    })
  })

  describe('insert', () => {
    it('inserts at index', () => {
      const { output } = run(`
        remember nums as [1, 3]
        nums.insert(1, 2)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })

    it('inserts at beginning', () => {
      const { output } = run(`
        remember nums as [2, 3]
        nums.insert(0, 1)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })

    it('inserts at end', () => {
      const { output } = run(`
        remember nums as [1, 2]
        nums.insert(2, 3)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })
  })

  describe('remove', () => {
    it('removes by index and returns the value', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums.remove(1)
        show nums
      `)
      expect(output).toEqual(['20', '[10, 30]'])
    })

    it('supports negative index', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums.remove(-1)
        show nums
      `)
      expect(output).toEqual(['30', '[10, 20]'])
    })

    it('raises IndexError for out of bounds', () => {
      const { error } = run(`
        remember nums as [1, 2]
        nums.remove(5)
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('IndexError')
    })
  })

  describe('pop', () => {
    it('removes and returns last element', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.pop()
        show nums
      `)
      expect(output).toEqual(['3', '[1, 2]'])
    })

    it('raises IndexError on empty list', () => {
      const { error } = run(`
        remember nums as []
        nums.pop()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('IndexError')
    })
  })

  // --- Query methods ---

  describe('index_of', () => {
    it('returns index of element', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums.index_of(20)
      `)
      expect(output).toEqual(['1'])
    })

    it('returns -1 if absent', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums.index_of(99)
      `)
      expect(output).toEqual(['-1'])
    })
  })

  describe('has', () => {
    it('returns yes when element exists', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.has(2)
      `)
      expect(output).toEqual(['yes'])
    })

    it('returns no when element absent', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.has(9)
      `)
      expect(output).toEqual(['no'])
    })
  })

  // --- Non-mutating methods (return new list) ---

  describe('slice', () => {
    it('slices [start, end)', () => {
      const { output } = run(`
        remember nums as [10, 20, 30, 40, 50]
        show nums.slice(1, 3)
      `)
      expect(output).toEqual(['[20, 30]'])
    })

    it('leaves original unchanged', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        remember s as nums.slice(0, 2)
        s.add(99)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })
  })

  describe('join', () => {
    it('joins with separator', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.join(", ")
      `)
      expect(output).toEqual(['1, 2, 3'])
    })

    it('joins empty list to empty text', () => {
      const { output } = run(`
        remember nums as []
        show nums.join("-")
      `)
      expect(output).toEqual([''])
    })
  })

  describe('reverse', () => {
    it('returns a reversed copy', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.reverse()
        show nums
      `)
      expect(output).toEqual(['[3, 2, 1]', '[1, 2, 3]'])
    })
  })

  describe('sort', () => {
    it('sorts numbers ascending', () => {
      const { output } = run(`
        remember nums as [3, 1, 4, 1, 5]
        show nums.sort()
      `)
      expect(output).toEqual(['[1, 1, 3, 4, 5]'])
    })

    it('sorts text alphabetically', () => {
      const { output } = run(`
        remember words as ["banana", "apple", "cherry"]
        show words.sort()
      `)
      expect(output).toEqual(['["apple", "banana", "cherry"]'])
    })

    it('leaves original unchanged', () => {
      const { output } = run(`
        remember nums as [3, 1, 2]
        remember sorted as nums.sort()
        show nums
        show sorted
      `)
      expect(output).toEqual(['[3, 1, 2]', '[1, 2, 3]'])
    })
  })

  describe('sort_by', () => {
    it('sorts by key function', () => {
      const { output } = run(`
        remember nums as [3, 1, 2]
        show nums.sort_by(action with x
          give back -x
        done)
      `)
      expect(output).toEqual(['[3, 2, 1]'])
    })
  })

  describe('copy', () => {
    it('returns a shallow copy', () => {
      const { output } = run(`
        remember a as [1, 2, 3]
        remember b as a.copy()
        b.add(4)
        show a
        show b
      `)
      expect(output).toEqual(['[1, 2, 3]', '[1, 2, 3, 4]'])
    })
  })

  // --- Higher-order methods ---

  describe('map', () => {
    it('maps with an action', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        show nums.map(action with x
          give back x * 2
        done)
      `)
      expect(output).toEqual(['[2, 4, 6]'])
    })

    it('returns new list, leaves original unchanged', () => {
      const { output } = run(`
        remember nums as [1, 2, 3]
        remember doubled as nums.map(action with x
          give back x * 2
        done)
        show nums
      `)
      expect(output).toEqual(['[1, 2, 3]'])
    })
  })

  describe('filter', () => {
    it('filters with a predicate', () => {
      const { output } = run(`
        remember nums as [1, 2, 3, 4, 5, 6]
        show nums.filter(action with x
          give back x % 2 == 0
        done)
      `)
      expect(output).toEqual(['[2, 4, 6]'])
    })
  })

  describe('reduce', () => {
    it('reduces with accumulator', () => {
      const { output } = run(`
        remember nums as [1, 2, 3, 4]
        show nums.reduce(action with acc, x
          give back acc + x
        done, 0)
      `)
      expect(output).toEqual(['10'])
    })
  })

  describe('sum', () => {
    it('sums numbers', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums.sum()
      `)
      expect(output).toEqual(['60'])
    })

    it('raises TypeError on non-numbers', () => {
      const { error } = run(`
        remember items as [1, "two"]
        items.sum()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('TypeError')
    })
  })

  describe('min and max', () => {
    it('min returns smallest', () => {
      const { output } = run(`
        remember nums as [5, 2, 8, 1]
        show nums.min()
      `)
      expect(output).toEqual(['1'])
    })

    it('max returns largest', () => {
      const { output } = run(`
        remember nums as [5, 2, 8, 1]
        show nums.max()
      `)
      expect(output).toEqual(['8'])
    })

    it('min on empty list raises IndexError', () => {
      const { error } = run(`
        remember nums as []
        nums.min()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('IndexError')
    })
  })

  describe('all and any', () => {
    it('all returns yes when all match', () => {
      const { output } = run(`
        remember nums as [2, 4, 6]
        show nums.all(action with x
          give back x % 2 == 0
        done)
      `)
      expect(output).toEqual(['yes'])
    })

    it('all returns no when one fails', () => {
      const { output } = run(`
        remember nums as [2, 3, 6]
        show nums.all(action with x
          give back x % 2 == 0
        done)
      `)
      expect(output).toEqual(['no'])
    })

    it('any returns yes when one matches', () => {
      const { output } = run(`
        remember nums as [1, 3, 4]
        show nums.any(action with x
          give back x % 2 == 0
        done)
      `)
      expect(output).toEqual(['yes'])
    })

    it('any returns no when none match', () => {
      const { output } = run(`
        remember nums as [1, 3, 5]
        show nums.any(action with x
          give back x % 2 == 0
        done)
      `)
      expect(output).toEqual(['no'])
    })
  })

  // --- Index access (already in interpreter, but verify edge cases) ---

  describe('index access', () => {
    it('negative index reads from end', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        show nums[-1]
      `)
      expect(output).toEqual(['30'])
    })

    it('out of bounds raises IndexError', () => {
      const { error } = run(`
        remember nums as [1, 2, 3]
        show nums[10]
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('IndexError')
      expect(error.message).toMatch(/10/)
      expect(error.message).toMatch(/3/)
    })
  })

  // --- Unknown method ---

  describe('unknown method', () => {
    it('raises NameError for nonexistent method', () => {
      const { error } = run(`
        remember nums as [1, 2]
        nums.foo()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('NameError')
    })
  })
})
