import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Random builtins', async () => {
  describe('random_pick', async () => {
    it('picks an element from a list', async () => {
      const { output } = await run(`
        remember nums as [10, 20, 30]
        remember picked as random_pick(nums)
        show nums.has(picked)
      `)
      expect(output).toEqual(['yes'])
    })

    it('errors on empty list', async () => {
      const r = await run('show random_pick([])')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('empty')
    })

    it('errors on non-list', async () => {
      const r = await run('show random_pick("hello")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('list')
    })
  })

  describe('random_shuffle', async () => {
    it('returns a list of the same length', async () => {
      const { output } = await run(`
        remember nums as [1, 2, 3, 4, 5]
        remember shuffled as random_shuffle(nums)
        show size of shuffled == size of nums
      `)
      expect(output).toEqual(['yes'])
    })

    it('does not mutate the original', async () => {
      const { output } = await run(`
        remember nums as [1, 2, 3]
        random_shuffle(nums)
        show size of nums
      `)
      expect(output).toEqual(['3'])
    })

    it('errors on non-list', async () => {
      const r = await run('show random_shuffle(42)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('list')
    })
  })

  describe('random_chance', async () => {
    it('returns yes for 100 percent', async () => {
      const { output } = await run('show random_chance(100)')
      expect(output).toEqual(['yes'])
    })

    it('returns no for 0 percent', async () => {
      const { output } = await run('show random_chance(0)')
      expect(output).toEqual(['no'])
    })

    it('errors on non-number', async () => {
      const r = await run('show random_chance("half")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('number')
    })
  })

  describe('random_id', async () => {
    it('returns an 8-character text', async () => {
      const { output } = await run(`
        remember id as random_id()
        show size of id
      `)
      expect(output).toEqual(['8'])
    })

    it('errors on arguments', async () => {
      const r = await run('show random_id(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('0 arguments')
    })
  })

  describe('random_sample', async () => {
    it('returns correct count of unique elements', async () => {
      const { output } = await run(`
        remember nums as [1, 2, 3, 4, 5]
        remember s as random_sample(nums, 3)
        show size of s
      `)
      expect(output).toEqual(['3'])
    })

    it('errors when count exceeds list size', async () => {
      const r = await run(`
        remember nums as [1, 2]
        show random_sample(nums, 5)
      `)
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('exceeds')
    })

    it('errors on non-list', async () => {
      const r = await run('show random_sample("hello", 2)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('list')
    })

    it('errors on non-integer count', async () => {
      const r = await run('show random_sample([1, 2, 3], 1.5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('non-negative integer')
    })
  })
})
