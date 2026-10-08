import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Convert builtins', async () => {
  describe('to_list', async () => {
    it('converts text to character list', async () => {
      const { output } = await run('show to_list("abc")')
      expect(output).toEqual(['["a", "b", "c"]'])
    })

    it('returns list as-is', async () => {
      const { output } = await run('show to_list([1, 2, 3])')
      expect(output).toEqual(['[1, 2, 3]'])
    })

    it('converts map to list of pairs', async () => {
      const { output } = await run(`
        remember m as {"a": 1}
        remember pairs as to_list(m)
        show size of pairs
        show pairs[0][0]
        show pairs[0][1]
      `)
      expect(output).toEqual(['1', 'a', '1'])
    })

    it('errors on number', async () => {
      const r = await run('show to_list(42)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('Cannot convert')
    })
  })

  describe('to_map', async () => {
    it('converts list of pairs to map', async () => {
      const { output } = await run(`
        remember pairs as [["x", 1], ["y", 2]]
        remember m as to_map(pairs)
        show m["x"]
        show m["y"]
      `)
      expect(output).toEqual(['1', '2'])
    })

    it('errors on non-list', async () => {
      const r = await run('show to_map("hello")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('list')
    })

    it('errors on invalid pair', async () => {
      const r = await run('show to_map([[1]])')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('pair')
    })
  })

  describe('to_json', async () => {
    it('converts a number', async () => {
      const { output } = await run('show to_json(42)')
      expect(output).toEqual(['42'])
    })

    it('converts a text', async () => {
      const { output } = await run('show to_json("hello")')
      expect(output).toEqual(['"hello"'])
    })

    it('converts a list', async () => {
      const { output } = await run('show to_json([1, 2, 3])')
      expect(output).toEqual(['[1,2,3]'])
    })

    it('converts a map', async () => {
      const { output } = await run('show to_json({"a": 1})')
      expect(output).toEqual(['{"a":1}'])
    })

    it('converts nothing to null', async () => {
      const { output } = await run('show to_json(nothing)')
      expect(output).toEqual(['null'])
    })
  })

  describe('from_json', async () => {
    it('parses a number', async () => {
      const { output } = await run('show from_json("42")')
      expect(output).toEqual(['42'])
    })

    it('parses a list', async () => {
      const { output } = await run('show from_json("[1,2,3]")')
      expect(output).toEqual(['[1, 2, 3]'])
    })

    it('parses an object into a map', async () => {
      const { output } = await run(`
        remember lb as char_from(123)
        remember rb as char_from(125)
        remember q as char_from(34)
        remember json_text as lb + q + "x" + q + ":10" + rb
        remember m as from_json(json_text)
        show m["x"]
      `)
      expect(output).toEqual(['10'])
    })

    it('parses null as nothing', async () => {
      const { output } = await run('show from_json("null")')
      expect(output).toEqual(['nothing'])
    })

    it('errors on invalid JSON', async () => {
      const r = await run(`
        remember lb as char_from(123)
        remember rb as char_from(125)
        show from_json(lb + "bad" + rb)
      `)
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('Invalid JSON')
    })

    it('errors on non-text', async () => {
      const r = await run('show from_json(42)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('char_from', async () => {
    it('returns character from code', async () => {
      const { output } = await run('show char_from(65)')
      expect(output).toEqual(['A'])
    })

    it('returns newline from code 10', async () => {
      const { output } = await run(`
        remember nl as char_from(10)
        show size of nl
      `)
      expect(output).toEqual(['1'])
    })

    it('errors on non-integer', async () => {
      const r = await run('show char_from(3.5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('integer')
    })

    it('errors on text', async () => {
      const r = await run('show char_from("A")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('integer')
    })
  })
})
