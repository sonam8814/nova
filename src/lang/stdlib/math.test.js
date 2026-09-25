import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 8 — Math builtins', () => {
  describe('abs', () => {
    it('returns absolute value of negative', () => {
      expect(run('show abs(-5)').output).toEqual(['5'])
    })

    it('returns same for positive', () => {
      expect(run('show abs(5)').output).toEqual(['5'])
    })

    it('returns 0 for zero', () => {
      expect(run('show abs(0)').output).toEqual(['0'])
    })

    it('errors on non-number', () => {
      const r = run('show abs("hi")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('number')
    })
  })

  describe('min', () => {
    it('returns minimum of two numbers', () => {
      expect(run('show min(3, 7)').output).toEqual(['3'])
    })

    it('returns minimum of multiple', () => {
      expect(run('show min(5, 2, 8, 1)').output).toEqual(['1'])
    })

    it('errors on fewer than 2 arguments', () => {
      const r = run('show min(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('at least 2')
    })
  })

  describe('max', () => {
    it('returns maximum of two numbers', () => {
      expect(run('show max(3, 7)').output).toEqual(['7'])
    })

    it('returns maximum of multiple', () => {
      expect(run('show max(5, 2, 8, 1)').output).toEqual(['8'])
    })
  })

  describe('floor', () => {
    it('floors down', () => {
      expect(run('show floor(3.7)').output).toEqual(['3'])
    })

    it('floors negative', () => {
      expect(run('show floor(-3.2)').output).toEqual(['-4'])
    })

    it('no-op on integer', () => {
      expect(run('show floor(5)').output).toEqual(['5'])
    })
  })

  describe('ceil', () => {
    it('ceils up', () => {
      expect(run('show ceil(3.2)').output).toEqual(['4'])
    })

    it('ceils negative', () => {
      expect(run('show ceil(-3.7)').output).toEqual(['-3'])
    })
  })

  describe('round', () => {
    it('rounds to nearest integer', () => {
      expect(run('show round(3.6)').output).toEqual(['4'])
    })

    it('rounds down at .4', () => {
      expect(run('show round(3.4)').output).toEqual(['3'])
    })

    it('rounds to specified decimal places', () => {
      expect(run('show round(3.14159, 2)').output).toEqual(['3.14'])
    })
  })

  describe('sqrt', () => {
    it('returns square root', () => {
      expect(run('show sqrt(16)').output).toEqual(['4'])
    })

    it('returns fractional root', () => {
      expect(run('show sqrt(2)').output).toEqual([String(Math.sqrt(2))])
    })

    it('errors on negative', () => {
      const r = run('show sqrt(-1)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('negative')
    })
  })

  describe('power', () => {
    it('computes exponent', () => {
      expect(run('show power(2, 10)').output).toEqual(['1024'])
    })

    it('computes fractional exponent', () => {
      expect(run('show power(4, 0.5)').output).toEqual(['2'])
    })
  })

  describe('random', () => {
    it('returns a number between 0 and 1', () => {
      const r = run('show random() >= 0 and random() < 1')
      expect(r.output).toEqual(['yes'])
    })
  })

  describe('random_between', () => {
    it('returns integer in range', () => {
      const src = `
remember n as random_between(1, 10)
show n >= 1 and n <= 10
`
      expect(run(src).output).toEqual(['yes'])
    })
  })
})
