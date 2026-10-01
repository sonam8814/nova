import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 8 — Global builtins', async () => {
  describe('to_number', async () => {
    it('converts text to number', async () => {
      expect((await run('show to_number("42")')).output).toEqual(['42'])
    })

    it('converts float text', async () => {
      expect((await run('show to_number("3.14")')).output).toEqual(['3.14'])
    })

    it('passes through numbers', async () => {
      expect((await run('show to_number(7)')).output).toEqual(['7'])
    })

    it('converts yes to 1', async () => {
      expect((await run('show to_number(yes)')).output).toEqual(['1'])
    })

    it('converts no to 0', async () => {
      expect((await run('show to_number(no)')).output).toEqual(['0'])
    })

    it('converts nothing to 0', async () => {
      expect((await run('show to_number(nothing)')).output).toEqual(['0'])
    })

    it('errors on non-numeric text', async () => {
      const r = await run('show to_number("abc")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('Cannot convert')
    })
  })

  describe('to_text', async () => {
    it('converts number to text', async () => {
      const src = `
remember t as to_text(42)
show t
show type_of(t)
`
      expect((await run(src)).output).toEqual(['42', 'text'])
    })

    it('converts nothing', async () => {
      expect((await run('show to_text(nothing)')).output).toEqual(['nothing'])
    })

    it('converts truth', async () => {
      expect((await run('show to_text(yes)')).output).toEqual(['yes'])
    })

    it('converts list', async () => {
      expect((await run('show to_text([1, 2, 3])')).output).toEqual(['[1, 2, 3]'])
    })
  })

  describe('to_truth', async () => {
    it('converts truthy number', async () => {
      expect((await run('show to_truth(1)')).output).toEqual(['yes'])
    })

    it('converts falsy zero', async () => {
      expect((await run('show to_truth(0)')).output).toEqual(['no'])
    })

    it('converts empty text to no', async () => {
      expect((await run('show to_truth("")')).output).toEqual(['no'])
    })

    it('converts non-empty text to yes', async () => {
      expect((await run('show to_truth("hi")')).output).toEqual(['yes'])
    })

    it('converts nothing to no', async () => {
      expect((await run('show to_truth(nothing)')).output).toEqual(['no'])
    })
  })

  describe('type_of', async () => {
    it('returns number for number', async () => {
      expect((await run('show type_of(42)')).output).toEqual(['number'])
    })

    it('returns text for text', async () => {
      expect((await run('show type_of("hi")')).output).toEqual(['text'])
    })

    it('returns truth for truth', async () => {
      expect((await run('show type_of(yes)')).output).toEqual(['truth'])
    })

    it('returns nothing for nothing', async () => {
      expect((await run('show type_of(nothing)')).output).toEqual(['nothing'])
    })

    it('returns list for list', async () => {
      expect((await run('show type_of([1, 2])')).output).toEqual(['list'])
    })

    it('returns map for map', async () => {
      expect((await run('show type_of({"a": 1})')).output).toEqual(['map'])
    })

    it('returns action for action', async () => {
      const src = `
define foo
  show "hi"
done
show type_of(foo)
`
      expect((await run(src)).output).toEqual(['action'])
    })
  })

  describe('same', async () => {
    it('compares equal lists deeply', async () => {
      expect((await run('show same([1, 2, 3], [1, 2, 3])')).output).toEqual(['yes'])
    })

    it('detects different lists', async () => {
      expect((await run('show same([1, 2], [1, 3])')).output).toEqual(['no'])
    })

    it('compares equal maps deeply', async () => {
      expect((await run('show same({"a": 1}, {"a": 1})')).output).toEqual(['yes'])
    })

    it('detects different maps', async () => {
      expect((await run('show same({"a": 1}, {"a": 2})')).output).toEqual(['no'])
    })

    it('compares nested structures', async () => {
      expect((await run('show same([[1, 2], [3]], [[1, 2], [3]])')).output).toEqual(['yes'])
    })

    it('compares primitives', async () => {
      expect((await run('show same(5, 5)')).output).toEqual(['yes'])
    })

    it('compares nothing', async () => {
      expect((await run('show same(nothing, nothing)')).output).toEqual(['yes'])
    })
  })

  describe('range', async () => {
    it('creates range with start and end', async () => {
      expect((await run('show range(0, 5)')).output).toEqual(['[0, 1, 2, 3, 4]'])
    })

    it('creates range with step', async () => {
      expect((await run('show range(0, 10, 2)')).output).toEqual(['[0, 2, 4, 6, 8]'])
    })

    it('creates descending range with negative step', async () => {
      expect((await run('show range(5, 0, -1)')).output).toEqual(['[5, 4, 3, 2, 1]'])
    })

    it('returns empty list when start equals end', async () => {
      expect((await run('show range(5, 5)')).output).toEqual(['[]'])
    })

    it('errors on zero step', async () => {
      const r = await run('show range(0, 5, 0)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('non-zero')
    })
  })

  describe('time_now', async () => {
    it('returns a number', async () => {
      expect((await run('show type_of(time_now())')).output).toEqual(['number'])
    })

    it('returns reasonable timestamp', async () => {
      expect((await run('show time_now() > 0')).output).toEqual(['yes'])
    })
  })

  describe('sleep', async () => {
    it('does not error (no-op in sync mode)', async () => {
      const r = await run('sleep(0)')
      expect(r.error).toBeNull()
    })
  })
})
