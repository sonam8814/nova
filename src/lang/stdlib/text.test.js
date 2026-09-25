import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 8 — Text stdlib', () => {
  describe('upper', () => {
    it('converts to uppercase', () => {
      expect(run('show "hello".upper()').output).toEqual(['HELLO'])
    })

    it('handles empty text', () => {
      expect(run('show "".upper()').output).toEqual([''])
    })

    it('errors on arguments', () => {
      const r = run('show "hi".upper("x")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('0 arguments')
    })
  })

  describe('lower', () => {
    it('converts to lowercase', () => {
      expect(run('show "HELLO".lower()').output).toEqual(['hello'])
    })

    it('handles mixed case', () => {
      expect(run('show "HeLLo WoRLd".lower()').output).toEqual(['hello world'])
    })
  })

  describe('trim', () => {
    it('removes leading and trailing whitespace', () => {
      expect(run('show "  hello  ".trim()').output).toEqual(['hello'])
    })

    it('trims tabs and newlines', () => {
      expect(run('show "\\thello\\n".trim()').output).toEqual(['hello'])
    })
  })

  describe('split', () => {
    it('splits by separator', () => {
      const r = run('show "a,b,c".split(",")')
      expect(r.output).toEqual(['["a", "b", "c"]'])
    })

    it('splits by space', () => {
      const r = run('show "hello world".split(" ")')
      expect(r.output).toEqual(['["hello", "world"]'])
    })

    it('returns list of single-char strings with empty separator', () => {
      const r = run('show "abc".split("")')
      expect(r.output).toEqual(['["a", "b", "c"]'])
    })

    it('errors on non-text separator', () => {
      const r = run('show "abc".split(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('has', () => {
    it('returns yes when substring exists', () => {
      expect(run('show "hello world".has("world")').output).toEqual(['yes'])
    })

    it('returns no when substring absent', () => {
      expect(run('show "hello".has("xyz")').output).toEqual(['no'])
    })

    it('empty text is always found', () => {
      expect(run('show "hello".has("")').output).toEqual(['yes'])
    })
  })

  describe('starts_with', () => {
    it('returns yes for matching prefix', () => {
      expect(run('show "hello".starts_with("he")').output).toEqual(['yes'])
    })

    it('returns no for non-matching prefix', () => {
      expect(run('show "hello".starts_with("lo")').output).toEqual(['no'])
    })
  })

  describe('ends_with', () => {
    it('returns yes for matching suffix', () => {
      expect(run('show "hello".ends_with("lo")').output).toEqual(['yes'])
    })

    it('returns no for non-matching suffix', () => {
      expect(run('show "hello".ends_with("he")').output).toEqual(['no'])
    })
  })

  describe('replace', () => {
    it('replaces all occurrences', () => {
      expect(run('show "aabaa".replace("a", "x")').output).toEqual(['xxbxx'])
    })

    it('replaces with empty string', () => {
      expect(run('show "hello".replace("l", "")').output).toEqual(['heo'])
    })

    it('handles no match', () => {
      expect(run('show "hello".replace("z", "x")').output).toEqual(['hello'])
    })

    it('errors on non-text arguments', () => {
      const r = run('show "hello".replace(5, "x")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('slice', () => {
    it('slices with start and end', () => {
      expect(run('show "hello".slice(0, 3)').output).toEqual(['hel'])
    })

    it('slices with start only', () => {
      expect(run('show "hello".slice(2)').output).toEqual(['llo'])
    })

    it('handles negative start', () => {
      expect(run('show "hello".slice(-3)').output).toEqual(['llo'])
    })
  })

  describe('index_of', () => {
    it('returns position of substring', () => {
      expect(run('show "hello world".index_of("world")').output).toEqual(['6'])
    })

    it('returns -1 when not found', () => {
      expect(run('show "hello".index_of("xyz")').output).toEqual(['-1'])
    })

    it('finds at start', () => {
      expect(run('show "hello".index_of("he")').output).toEqual(['0'])
    })
  })

  describe('repeat', () => {
    it('repeats text', () => {
      expect(run('show "ab".repeat(3)').output).toEqual(['ababab'])
    })

    it('returns empty for zero repeats', () => {
      expect(run('show "ab".repeat(0)').output).toEqual([''])
    })

    it('errors on negative count', () => {
      const r = run('show "ab".repeat(-1)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('non-negative')
    })
  })

  describe('chars', () => {
    it('returns list of characters', () => {
      expect(run('show "abc".chars()').output).toEqual(['["a", "b", "c"]'])
    })

    it('returns empty list for empty text', () => {
      expect(run('show "".chars()').output).toEqual(['[]'])
    })
  })

  describe('code_at', () => {
    it('returns character code', () => {
      expect(run('show "H".code_at(0)').output).toEqual(['72'])
    })

    it('returns code for later position', () => {
      expect(run('show "Hello".code_at(1)').output).toEqual(['101'])
    })

    it('handles negative index', () => {
      expect(run('show "Hello".code_at(-1)').output).toEqual(['111'])
    })

    it('errors on out of bounds', () => {
      const r = run('show "Hi".code_at(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('out of bounds')
    })
  })

  describe('invalid method', () => {
    it('errors on unknown text method', () => {
      const r = run('show "hello".foo()')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain("no method 'foo'")
    })
  })

  describe('chaining', () => {
    it('chains text methods', () => {
      expect(run('show "  Hello World  ".trim().upper()').output).toEqual(['HELLO WORLD'])
    })

    it('chains split then access', () => {
      expect(run('show "a,b,c".split(",")[1]').output).toEqual(['b'])
    })
  })
})

describe('Phase 8 — Interpolation', () => {
  it('evaluates expressions in text', () => {
    expect(run('show "a{1+1}b{2+2}c"').output).toEqual(['a2b4c'])
  })

  it('handles variable interpolation', () => {
    const src = `
remember name as "Nova"
show "Hello, {name}!"
`
    expect(run(src).output).toEqual(['Hello, Nova!'])
  })

  it('keeps escaped brace literal', () => {
    expect(run('show "\\{not interpolated}"').output).toEqual(['{not interpolated}'])
  })

  it('handles nested expressions', () => {
    const src = `
remember x as 5
show "result: {x * 2 + 1}"
`
    expect(run(src).output).toEqual(['result: 11'])
  })

  it('handles multiple interpolations', () => {
    const src = `
remember a as 10
remember b as 20
show "{a} + {b} = {a + b}"
`
    expect(run(src).output).toEqual(['10 + 20 = 30'])
  })

  it('displays list in interpolation', () => {
    expect(run('show "nums: {[1, 2, 3]}"').output).toEqual(['nums: [1, 2, 3]'])
  })
})
