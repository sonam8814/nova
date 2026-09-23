import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 7 — Map stdlib', () => {

  // --- Basic access ---

  describe('index access', () => {
    it('reads a key', () => {
      const { output } = run(`
        remember ages as {"aditya": 21, "riya": 23}
        show ages["aditya"]
      `)
      expect(output).toEqual(['21'])
    })

    it('missing key returns nothing', () => {
      const { output } = run(`
        remember m as {"a": 1}
        show m["z"]
      `)
      expect(output).toEqual(['nothing'])
    })

    it('set adds a new key', () => {
      const { output } = run(`
        remember m as {"a": 1}
        set m["b"] to 2
        show m
      `)
      expect(output).toEqual(['{"a": 1, "b": 2}'])
    })

    it('set overwrites existing key', () => {
      const { output } = run(`
        remember m as {"a": 1}
        set m["a"] to 99
        show m
      `)
      expect(output).toEqual(['{"a": 99}'])
    })

    it('supports number keys', () => {
      const { output } = run(`
        remember m as {1: "one", 2: "two"}
        show m[1]
      `)
      expect(output).toEqual(['one'])
    })
  })

  // --- has ---

  describe('has', () => {
    it('returns yes for existing key', () => {
      const { output } = run(`
        remember m as {"x": 10}
        show m.has("x")
      `)
      expect(output).toEqual(['yes'])
    })

    it('returns no for missing key', () => {
      const { output } = run(`
        remember m as {"x": 10}
        show m.has("y")
      `)
      expect(output).toEqual(['no'])
    })
  })

  // --- keys, values, entries ---

  describe('keys', () => {
    it('returns list of keys', () => {
      const { output } = run(`
        remember m as {"a": 1, "b": 2}
        show m.keys()
      `)
      expect(output).toEqual(['["a", "b"]'])
    })
  })

  describe('values', () => {
    it('returns list of values', () => {
      const { output } = run(`
        remember m as {"a": 1, "b": 2}
        show m.values()
      `)
      expect(output).toEqual(['[1, 2]'])
    })
  })

  describe('entries', () => {
    it('returns list of [key, value] pairs', () => {
      const { output } = run(`
        remember m as {"x": 10, "y": 20}
        remember e as m.entries()
        show e[0]
        show e[1]
      `)
      expect(output).toEqual(['["x", 10]', '["y", 20]'])
    })
  })

  // --- remove ---

  describe('remove', () => {
    it('removes a key and returns its value', () => {
      const { output } = run(`
        remember m as {"a": 1, "b": 2, "c": 3}
        show m.remove("b")
        show m
      `)
      expect(output).toEqual(['2', '{"a": 1, "c": 3}'])
    })

    it('raises KeyError for missing key', () => {
      const { error } = run(`
        remember m as {"a": 1}
        m.remove("z")
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('KeyError')
    })
  })

  // --- size of ---

  describe('size of', () => {
    it('returns number of entries', () => {
      const { output } = run(`
        remember m as {"a": 1, "b": 2, "c": 3}
        show size of m
      `)
      expect(output).toEqual(['3'])
    })

    it('returns 0 for empty map', () => {
      const { output } = run(`
        remember m as {}
        show size of m
      `)
      expect(output).toEqual(['0'])
    })
  })

  // --- for each iteration ---

  describe('for each', () => {
    it('iterates over keys', () => {
      const { output } = run(`
        remember m as {"x": 1, "y": 2}
        for each k in m
          show k
        done
      `)
      expect(output).toEqual(['x', 'y'])
    })

    it('iterates over key-value pairs', () => {
      const { output } = run(`
        remember m as {"a": 10, "b": 20}
        for each k to v in m
          show "{k}={v}"
        done
      `)
      expect(output).toEqual(['a=10', 'b=20'])
    })
  })

  // --- mutation is shared ---

  describe('mutation', () => {
    it('map is shared by reference', () => {
      const { output } = run(`
        remember a as {"x": 1}
        remember b as a
        set a["y"] to 2
        show b
      `)
      expect(output).toEqual(['{"x": 1, "y": 2}'])
    })
  })

  // --- unknown method ---

  describe('unknown method', () => {
    it('raises NameError for nonexistent method', () => {
      const { error } = run(`
        remember m as {"a": 1}
        m.foo()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('NameError')
    })
  })
})
