import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'
import { formatError, novaError } from './errors.js'

describe('Phase 10 — Errors', async () => {
  describe('raise', async () => {
    it('raise with text creates a UserError', async () => {
      const { error } = await run('raise "something went wrong"')
      expect(error.kind).toBe('UserError')
      expect(error.message).toBe('something went wrong')
    })

    it('raise with expression converts to text', async () => {
      const { error } = await run('raise 42')
      expect(error.kind).toBe('UserError')
      expect(error.message).toBe('42')
    })

    it('raise with a map uses kind and message fields', async () => {
      const { error } = await run('raise {"kind": "CustomError", "message": "bad input", "hint": "try again"}')
      expect(error.kind).toBe('CustomError')
      expect(error.message).toBe('bad input')
    })
  })

  describe('attempt / rescue', async () => {
    it('caught raise binds e.message', async () => {
      const { output } = await run(`
        attempt
          raise "oops"
        rescue e
          show e["message"]
        done
      `)
      expect(output).toEqual(['oops'])
    })

    it('caught raise binds e.kind', async () => {
      const { output } = await run(`
        attempt
          raise "bad"
        rescue e
          show e["kind"]
        done
      `)
      expect(output).toEqual(['UserError'])
    })

    it('rescue catches internal errors too', async () => {
      const { output } = await run(`
        attempt
          remember x as 10 / 0
        rescue e
          show e["kind"]
          show e["message"]
        done
      `)
      expect(output[0]).toBe('MathError')
      expect(output[1]).toContain('divide by zero')
    })

    it('execution continues after rescued error', async () => {
      const { output } = await run(`
        attempt
          raise "fail"
        rescue e
          show "caught"
        done
        show "after"
      `)
      expect(output).toEqual(['caught', 'after'])
    })

    it('unrescued error propagates', async () => {
      const { error } = await run(`
        attempt
          raise "inner"
        rescue e
          raise "rethrown"
        done
      `)
      expect(error.kind).toBe('UserError')
      expect(error.message).toBe('rethrown')
    })
  })

  describe('always', async () => {
    it('always runs after normal execution', async () => {
      const { output } = await run(`
        attempt
          show "body"
        rescue e
          show "rescue"
        always
          show "always"
        done
      `)
      expect(output).toEqual(['body', 'always'])
    })

    it('always runs after an error', async () => {
      const { output } = await run(`
        attempt
          raise "fail"
        rescue e
          show "rescued"
        always
          show "cleanup"
        done
      `)
      expect(output).toEqual(['rescued', 'cleanup'])
    })

    it('always runs after give back inside attempt', async () => {
      const { output } = await run(`
        define test
          attempt
            show "before"
            give back 42
          rescue e
            show "rescue"
          always
            show "always ran"
          done
        done
        remember result as test()
        show result
      `)
      expect(output).toEqual(['before', 'always ran', '42'])
    })

    it('always runs even when rescue rethrows', async () => {
      const { output, error } = await run(`
        attempt
          raise "original"
        rescue e
          show "in rescue"
          raise "rethrown"
        always
          show "always"
        done
      `)
      expect(output).toEqual(['in rescue', 'always'])
      expect(error.message).toBe('rethrown')
    })
  })

  describe('nested attempt blocks', async () => {
    it('inner attempt catches, outer does not fire', async () => {
      const { output } = await run(`
        attempt
          attempt
            raise "inner"
          rescue e
            show "inner caught"
          done
          show "outer continues"
        rescue e
          show "outer caught"
        done
      `)
      expect(output).toEqual(['inner caught', 'outer continues'])
    })

    it('inner unhandled error caught by outer', async () => {
      const { output, error } = await run(`
        attempt
          attempt
            raise "deep"
          rescue e
            raise e["message"]
          done
        rescue outer_e
          show outer_e["message"]
        done
      `)
      expect(error).toBeNull()
      expect(output).toEqual(['deep'])
    })

    it('nested always blocks all run', async () => {
      const { output } = await run(`
        attempt
          attempt
            raise "fail"
          rescue e
            show "inner rescue"
          always
            show "inner always"
          done
        rescue e
          show "outer rescue"
        always
          show "outer always"
        done
      `)
      expect(output).toEqual(['inner rescue', 'inner always', 'outer always'])
    })
  })

  describe('error data on caught errors', async () => {
    it('caught error has line and column', async () => {
      const { output } = await run(`
        attempt
          remember x as 10 / 0
        rescue e
          show e["line"]
          show e["column"]
        done
      `)
      expect(Number(output[0])).toBeGreaterThan(0)
      expect(Number(output[1])).toBeGreaterThan(0)
    })
  })

  describe('formatError', async () => {
    it('produces the correct formatted block with caret', async () => {
      const sources = {
        'main.nova': 'remember x as 5\nshow "total: " + nums\nshow "done"',
      }
      const err = novaError('TypeError', 'Cannot add text and list.', {
        hint: 'Convert the list first with nums.join(", ")',
        file: 'main.nova',
        line: 2,
        column: 16,
      })
      const formatted = formatError(sources, err)
      const lines = formatted.split('\n')

      expect(lines[0]).toBe('TypeError at main.nova line 2, column 16')
      expect(lines[1]).toBe('')
      expect(lines[2]).toBe('    show "total: " + nums')
      expect(lines[3]).toBe('                   ^')
      expect(lines[4]).toBe('Cannot add text and list.')
      expect(lines[5]).toBe('Hint: Convert the list first with nums.join(", ")')
    })

    it('formats error without hint', async () => {
      const sources = { 'test.nova': 'show 1 / 0' }
      const err = novaError('MathError', 'Cannot divide by zero.', {
        file: 'test.nova',
        line: 1,
        column: 7,
      })
      const formatted = formatError(sources, err)
      expect(formatted).not.toContain('Hint:')
      expect(formatted).toContain('MathError at test.nova line 1, column 7')
      expect(formatted).toContain('Cannot divide by zero.')
    })

    it('formats error without source', async () => {
      const err = novaError('RuntimeError', 'Something failed.', {
        file: 'missing.nova',
        line: 5,
        column: 3,
      })
      const formatted = formatError({}, err)
      expect(formatted).toContain('RuntimeError at missing.nova line 5, column 3')
      expect(formatted).toContain('Something failed.')
      expect(formatted).not.toContain('    ')
    })
  })
})
