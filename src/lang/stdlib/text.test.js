import { describe, it, expect } from 'vitest'
import { run } from '../testUtils.js'

describe('Phase 8 — Text stdlib', async () => {
  describe('upper', async () => {
    it('converts to uppercase', async () => {
      expect((await run('show "hello".upper()')).output).toEqual(['HELLO'])
    })

    it('handles empty text', async () => {
      expect((await run('show "".upper()')).output).toEqual([''])
    })

    it('errors on arguments', async () => {
      const r = await run('show "hi".upper("x")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('0 arguments')
    })
  })

  describe('lower', async () => {
    it('converts to lowercase', async () => {
      expect((await run('show "HELLO".lower()')).output).toEqual(['hello'])
    })

    it('handles mixed case', async () => {
      expect((await run('show "HeLLo WoRLd".lower()')).output).toEqual(['hello world'])
    })
  })

  describe('trim', async () => {
    it('removes leading and trailing whitespace', async () => {
      expect((await run('show "  hello  ".trim()')).output).toEqual(['hello'])
    })

    it('trims tabs and newlines', async () => {
      expect((await run('show "\\thello\\n".trim()')).output).toEqual(['hello'])
    })
  })

  describe('split', async () => {
    it('splits by separator', async () => {
      const r = await run('show "a,b,c".split(",")')
      expect(r.output).toEqual(['["a", "b", "c"]'])
    })

    it('splits by space', async () => {
      const r = await run('show "hello world".split(" ")')
      expect(r.output).toEqual(['["hello", "world"]'])
    })

    it('returns list of single-char strings with empty separator', async () => {
      const r = await run('show "abc".split("")')
      expect(r.output).toEqual(['["a", "b", "c"]'])
    })

    it('errors on non-text separator', async () => {
      const r = await run('show "abc".split(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('has', async () => {
    it('returns yes when substring exists', async () => {
      expect((await run('show "hello world".has("world")')).output).toEqual(['yes'])
    })

    it('returns no when substring absent', async () => {
      expect((await run('show "hello".has("xyz")')).output).toEqual(['no'])
    })

    it('empty text is always found', async () => {
      expect((await run('show "hello".has("")')).output).toEqual(['yes'])
    })
  })

  describe('starts_with', async () => {
    it('returns yes for matching prefix', async () => {
      expect((await run('show "hello".starts_with("he")')).output).toEqual(['yes'])
    })

    it('returns no for non-matching prefix', async () => {
      expect((await run('show "hello".starts_with("lo")')).output).toEqual(['no'])
    })
  })

  describe('ends_with', async () => {
    it('returns yes for matching suffix', async () => {
      expect((await run('show "hello".ends_with("lo")')).output).toEqual(['yes'])
    })

    it('returns no for non-matching suffix', async () => {
      expect((await run('show "hello".ends_with("he")')).output).toEqual(['no'])
    })
  })

  describe('replace', async () => {
    it('replaces all occurrences', async () => {
      expect((await run('show "aabaa".replace("a", "x")')).output).toEqual(['xxbxx'])
    })

    it('replaces with empty string', async () => {
      expect((await run('show "hello".replace("l", "")')).output).toEqual(['heo'])
    })

    it('handles no match', async () => {
      expect((await run('show "hello".replace("z", "x")')).output).toEqual(['hello'])
    })

    it('errors on non-text arguments', async () => {
      const r = await run('show "hello".replace(5, "x")')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('text')
    })
  })

  describe('slice', async () => {
    it('slices with start and end', async () => {
      expect((await run('show "hello".slice(0, 3)')).output).toEqual(['hel'])
    })

    it('slices with start only', async () => {
      expect((await run('show "hello".slice(2)')).output).toEqual(['llo'])
    })

    it('handles negative start', async () => {
      expect((await run('show "hello".slice(-3)')).output).toEqual(['llo'])
    })
  })

  describe('index_of', async () => {
    it('returns position of substring', async () => {
      expect((await run('show "hello world".index_of("world")')).output).toEqual(['6'])
    })

    it('returns -1 when not found', async () => {
      expect((await run('show "hello".index_of("xyz")')).output).toEqual(['-1'])
    })

    it('finds at start', async () => {
      expect((await run('show "hello".index_of("he")')).output).toEqual(['0'])
    })
  })

  describe('repeat', async () => {
    it('repeats text', async () => {
      expect((await run('show "ab".repeat(3)')).output).toEqual(['ababab'])
    })

    it('returns empty for zero repeats', async () => {
      expect((await run('show "ab".repeat(0)')).output).toEqual([''])
    })

    it('errors on negative count', async () => {
      const r = await run('show "ab".repeat(-1)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('non-negative')
    })
  })

  describe('chars', async () => {
    it('returns list of characters', async () => {
      expect((await run('show "abc".chars()')).output).toEqual(['["a", "b", "c"]'])
    })

    it('returns empty list for empty text', async () => {
      expect((await run('show "".chars()')).output).toEqual(['[]'])
    })
  })

  describe('code_at', async () => {
    it('returns character code', async () => {
      expect((await run('show "H".code_at(0)')).output).toEqual(['72'])
    })

    it('returns code for later position', async () => {
      expect((await run('show "Hello".code_at(1)')).output).toEqual(['101'])
    })

    it('handles negative index', async () => {
      expect((await run('show "Hello".code_at(-1)')).output).toEqual(['111'])
    })

    it('errors on out of bounds', async () => {
      const r = await run('show "Hi".code_at(5)')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain('out of bounds')
    })
  })

  describe('invalid method', async () => {
    it('errors on unknown text method', async () => {
      const r = await run('show "hello".foo()')
      expect(r.error).not.toBeNull()
      expect(r.error.message).toContain("no method 'foo'")
    })
  })

  describe('chaining', async () => {
    it('chains text methods', async () => {
      expect((await run('show "  Hello World  ".trim().upper()')).output).toEqual(['HELLO WORLD'])
    })

    it('chains split then access', async () => {
      expect((await run('show "a,b,c".split(",")[1]')).output).toEqual(['b'])
    })
  })
})

describe('Phase 8 — Interpolation', async () => {
  it('evaluates expressions in text', async () => {
    expect((await run('show "a{1+1}b{2+2}c"')).output).toEqual(['a2b4c'])
  })

  it('handles variable interpolation', async () => {
    const src = `
remember name as "Nova"
show "Hello, {name}!"
`
    expect((await run(src)).output).toEqual(['Hello, Nova!'])
  })

  it('keeps escaped brace literal', async () => {
    expect((await run('show "\\{not interpolated}"')).output).toEqual(['{not interpolated}'])
  })

  it('handles nested expressions', async () => {
    const src = `
remember x as 5
show "result: {x * 2 + 1}"
`
    expect((await run(src)).output).toEqual(['result: 11'])
  })

  it('handles multiple interpolations', async () => {
    const src = `
remember a as 10
remember b as 20
show "{a} + {b} = {a + b}"
`
    expect((await run(src)).output).toEqual(['10 + 20 = 30'])
  })

  it('displays list in interpolation', async () => {
    expect((await run('show "nums: {[1, 2, 3]}"')).output).toEqual(['nums: [1, 2, 3]'])
  })
})
