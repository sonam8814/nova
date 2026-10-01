import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 8 — Math builtins', async () => {
  describe('abs', async () => {
    it('returns absolute value of negative', async () => {
      expect((await run('show abs(-5)')).output).toEqual(['5'])
    })

    it('returns same for positive', async () => {
      expect((await run('show abs(5)')).output).toEqual(['5'])
    })

    it('returns 0 for zero', async () => {
      expect((await run('show abs(0)')).output).toEqual(['0'])
    })

    it('errors on non-number', async () => {
      const r = await run('show abs("hi")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('number')
    })
  })

  describe('min', async () => {
    it('returns minimum of two numbers', async () => {
      expect((await run('show min(3, 7)')).output).toEqual(['3'])
    })

    it('returns minimum of multiple', async () => {
      expect((await run('show min(5, 2, 8, 1)')).output).toEqual(['1'])
    })

    it('errors on fewer than 2 arguments', async () => {
      const r = await run('show min(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('at least 2')
    })
  })

  describe('max', async () => {
    it('returns maximum of two numbers', async () => {
      expect((await run('show max(3, 7)')).output).toEqual(['7'])
    })

    it('returns maximum of multiple', async () => {
      expect((await run('show max(5, 2, 8, 1)')).output).toEqual(['8'])
    })
  })

  describe('floor', async () => {
    it('floors down', async () => {
      expect((await run('show floor(3.7)')).output).toEqual(['3'])
    })

    it('floors negative', async () => {
      expect((await run('show floor(-3.2)')).output).toEqual(['-4'])
    })

    it('no-op on integer', async () => {
      expect((await run('show floor(5)')).output).toEqual(['5'])
    })
  })

  describe('ceil', async () => {
    it('ceils up', async () => {
      expect((await run('show ceil(3.2)')).output).toEqual(['4'])
    })

    it('ceils negative', async () => {
      expect((await run('show ceil(-3.7)')).output).toEqual(['-3'])
    })
  })

  describe('round', async () => {
    it('rounds to nearest integer', async () => {
      expect((await run('show round(3.6)')).output).toEqual(['4'])
    })

    it('rounds down at .4', async () => {
      expect((await run('show round(3.4)')).output).toEqual(['3'])
    })

    it('rounds to specified decimal places', async () => {
      expect((await run('show round(3.14159, 2)')).output).toEqual(['3.14'])
    })
  })

  describe('sqrt', async () => {
    it('returns square root', async () => {
      expect((await run('show sqrt(16)')).output).toEqual(['4'])
    })

    it('returns fractional root', async () => {
      expect((await run('show sqrt(2)')).output).toEqual([String(Math.sqrt(2))])
    })

    it('errors on negative', async () => {
      const r = await run('show sqrt(-1)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('negative')
    })
  })

  describe('power', async () => {
    it('computes exponent', async () => {
      expect((await run('show power(2, 10)')).output).toEqual(['1024'])
    })

    it('computes fractional exponent', async () => {
      expect((await run('show power(4, 0.5)')).output).toEqual(['2'])
    })
  })

  describe('random', async () => {
    it('returns a number between 0 and 1', async () => {
      const r = await run('show random() >= 0 and random() < 1')
      expect(r.output).toEqual(['yes'])
    })
  })

  describe('random_between', async () => {
    it('returns integer in range', async () => {
      const src = `
remember n as random_between(1, 10)
show n >= 1 and n <= 10
`
      expect((await run(src)).output).toEqual(['yes'])
    })
  })
})
