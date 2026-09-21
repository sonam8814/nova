import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('arithmetic', () => {
  it('evaluates 2 + 3 * 4 as 14', () => {
    const { output } = run('show 2 + 3 * 4')
    expect(output).toEqual(['14'])
  })

  it('evaluates (2 + 3) * 4 as 20', () => {
    const { output } = run('show (2 + 3) * 4')
    expect(output).toEqual(['20'])
  })

  it('evaluates 2 ^ 3 ^ 2 as 512 (right associative)', () => {
    const { output } = run('show 2 ^ 3 ^ 2')
    expect(output).toEqual(['512'])
  })

  it('evaluates modulo', () => {
    const { output } = run('show 10 % 3')
    expect(output).toEqual(['1'])
  })

  it('evaluates unary minus', () => {
    const { output } = run('show -5 + 3')
    expect(output).toEqual(['-2'])
  })

  it('raises MathError on division by zero', () => {
    const { error } = run('show 10 / 0')
    expect(error).not.toBeNull()
    expect(error.kind).toBe('MathError')
    expect(error.message).toMatch(/divide by zero/)
  })
})

describe('text operations', () => {
  it('concatenates two texts', () => {
    const { output } = run('show "hello" + " world"')
    expect(output).toEqual(['hello world'])
  })

  it('coerces number to text when added to text', () => {
    const { output } = run('show "count: " + 5')
    expect(output).toEqual(['count: 5'])
  })

  it('coerces text + number (number first)', () => {
    const { output } = run('show 5 + " items"')
    expect(output).toEqual(['5 items'])
  })

  it('raises TypeError for text + list', () => {
    const { error } = run('show "total: " + [1, 2]')
    expect(error).not.toBeNull()
    expect(error.kind).toBe('TypeError')
    expect(error.message).toMatch(/Cannot add text and list/)
  })
})

describe('comparison and equality', () => {
  it('compares numbers', () => {
    const { output } = run('show 3 > 2')
    expect(output).toEqual(['yes'])
  })

  it('checks equality', () => {
    const { output } = run('show 5 == 5')
    expect(output).toEqual(['yes'])
  })

  it('checks inequality', () => {
    const { output } = run('show 5 != 3')
    expect(output).toEqual(['yes'])
  })

  it('checks nothing equality', () => {
    const { output } = run('show nothing == nothing')
    expect(output).toEqual(['yes'])
  })
})

describe('logic', () => {
  it('and short-circuits on falsy', () => {
    const { output } = run('show no and "unreachable"')
    expect(output).toEqual(['no'])
  })

  it('or short-circuits on truthy', () => {
    const { output } = run('show "found" or "fallback"')
    expect(output).toEqual(['found'])
  })

  it('or returns second when first is falsy', () => {
    const { output } = run('show nothing or 10')
    expect(output).toEqual(['10'])
  })

  it('not negates truthiness', () => {
    const { output } = run('show not yes')
    expect(output).toEqual(['no'])
  })
})

describe('declarations', () => {
  it('remember and show', () => {
    const { output } = run(`
      remember x as 42
      show x
    `)
    expect(output).toEqual(['42'])
  })

  it('remember then set', () => {
    const { output } = run(`
      remember x as 1
      set x to 2
      show x
    `)
    expect(output).toEqual(['2'])
  })

  it('raises on re-declaring same name in same scope', () => {
    const { error } = run(`
      remember x as 1
      remember x as 2
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/already declared/)
  })

  it('raises on set of undeclared name with suggestion', () => {
    const { error } = run(`
      remember total as 0
      set totl to 1
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/not defined/)
    expect(error.hint).toMatch(/total/)
  })

  it('raises on set of a constant', () => {
    const { error } = run(`
      constant MAX as 100
      set MAX to 200
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/Cannot reassign constant/)
  })
})

describe('show', () => {
  it('shows multiple values separated by space', () => {
    const { output } = run('show 1, 2, 3')
    expect(output).toEqual(['1 2 3'])
  })

  it('shows nothing as "nothing"', () => {
    const { output } = run('show nothing')
    expect(output).toEqual(['nothing'])
  })

  it('shows booleans as yes/no', () => {
    const { output } = run('show yes, no')
    expect(output).toEqual(['yes no'])
  })
})

describe('lists', () => {
  it('creates and indexes a list', () => {
    const { output } = run(`
      remember nums as [10, 20, 30]
      show nums[0]
      show nums[-1]
    `)
    expect(output).toEqual(['10', '30'])
  })

  it('shows list display format', () => {
    const { output } = run('show [1, "two", 3]')
    expect(output).toEqual(['[1, "two", 3]'])
  })

  it('raises IndexError on out of bounds', () => {
    const { error } = run(`
      remember nums as [1, 2, 3]
      show nums[10]
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('IndexError')
  })
})

describe('maps', () => {
  it('creates and indexes a map', () => {
    const { output } = run(`
      remember ages as {"alice": 25, "bob": 30}
      show ages["alice"]
    `)
    expect(output).toEqual(['25'])
  })

  it('returns nothing for missing key', () => {
    const { output } = run(`
      remember m as {"x": 1}
      show m["missing"]
    `)
    expect(output).toEqual(['nothing'])
  })
})

describe('size of', () => {
  it('gets size of text', () => {
    const { output } = run('show size of "hello"')
    expect(output).toEqual(['5'])
  })

  it('gets size of list', () => {
    const { output } = run('show size of [1, 2, 3]')
    expect(output).toEqual(['3'])
  })
})

describe('interpolation', () => {
  it('evaluates interpolated text', () => {
    const { output } = run(`
      remember name as "World"
      show "Hello, {name}!"
    `)
    expect(output).toEqual(['Hello, World!'])
  })

  it('evaluates expressions inside interpolation', () => {
    const { output } = run('show "result: {2 + 3}"')
    expect(output).toEqual(['result: 5'])
  })
})

describe('index assignment', () => {
  it('assigns to list index', () => {
    const { output } = run(`
      remember nums as [1, 2, 3]
      set nums[0] to 99
      show nums
    `)
    expect(output).toEqual(['[99, 2, 3]'])
  })

  it('assigns to map key', () => {
    const { output } = run(`
      remember m as {"x": 1}
      set m["y"] to 2
      show m["y"]
    `)
    expect(output).toEqual(['2'])
  })
})
