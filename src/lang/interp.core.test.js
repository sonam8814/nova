import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('arithmetic', async () => {
  it('evaluates 2 + 3 * 4 as 14', async () => {
    const { output } = await run('show 2 + 3 * 4')
    expect(output).toEqual(['14'])
  })

  it('evaluates (2 + 3) * 4 as 20', async () => {
    const { output } = await run('show (2 + 3) * 4')
    expect(output).toEqual(['20'])
  })

  it('evaluates 2 ^ 3 ^ 2 as 512 (right associative)', async () => {
    const { output } = await run('show 2 ^ 3 ^ 2')
    expect(output).toEqual(['512'])
  })

  it('evaluates modulo', async () => {
    const { output } = await run('show 10 % 3')
    expect(output).toEqual(['1'])
  })

  it('evaluates unary minus', async () => {
    const { output } = await run('show -5 + 3')
    expect(output).toEqual(['-2'])
  })

  it('raises MathError on division by zero', async () => {
    const { error } = await run('show 10 / 0')
    expect(error).not.toBeNull()
    expect(error.kind).toBe('MathError')
    expect(error.message).toMatch(/divide by zero/)
  })
})

describe('text operations', async () => {
  it('concatenates two texts', async () => {
    const { output } = await run('show "hello" + " world"')
    expect(output).toEqual(['hello world'])
  })

  it('coerces number to text when added to text', async () => {
    const { output } = await run('show "count: " + 5')
    expect(output).toEqual(['count: 5'])
  })

  it('coerces text + number (number first)', async () => {
    const { output } = await run('show 5 + " items"')
    expect(output).toEqual(['5 items'])
  })

  it('raises TypeError for text + list', async () => {
    const { error } = await run('show "total: " + [1, 2]')
    expect(error).not.toBeNull()
    expect(error.kind).toBe('TypeError')
    expect(error.message).toMatch(/Cannot add text and list/)
  })
})

describe('comparison and equality', async () => {
  it('compares numbers', async () => {
    const { output } = await run('show 3 > 2')
    expect(output).toEqual(['yes'])
  })

  it('checks equality', async () => {
    const { output } = await run('show 5 == 5')
    expect(output).toEqual(['yes'])
  })

  it('checks inequality', async () => {
    const { output } = await run('show 5 != 3')
    expect(output).toEqual(['yes'])
  })

  it('checks nothing equality', async () => {
    const { output } = await run('show nothing == nothing')
    expect(output).toEqual(['yes'])
  })
})

describe('logic', async () => {
  it('and short-circuits on falsy', async () => {
    const { output } = await run('show no and "unreachable"')
    expect(output).toEqual(['no'])
  })

  it('or short-circuits on truthy', async () => {
    const { output } = await run('show "found" or "fallback"')
    expect(output).toEqual(['found'])
  })

  it('or returns second when first is falsy', async () => {
    const { output } = await run('show nothing or 10')
    expect(output).toEqual(['10'])
  })

  it('not negates truthiness', async () => {
    const { output } = await run('show not yes')
    expect(output).toEqual(['no'])
  })
})

describe('declarations', async () => {
  it('remember and show', async () => {
    const { output } = await run(`
      remember x as 42
      show x
    `)
    expect(output).toEqual(['42'])
  })

  it('remember then set', async () => {
    const { output } = await run(`
      remember x as 1
      set x to 2
      show x
    `)
    expect(output).toEqual(['2'])
  })

  it('raises on re-declaring same name in same scope', async () => {
    const { error } = await run(`
      remember x as 1
      remember x as 2
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/already declared/)
  })

  it('raises on set of undeclared name with suggestion', async () => {
    const { error } = await run(`
      remember total as 0
      set totl to 1
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/not defined/)
    expect(error.hint).toMatch(/total/)
  })

  it('raises on set of a constant', async () => {
    const { error } = await run(`
      constant MAX as 100
      set MAX to 200
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('NameError')
    expect(error.message).toMatch(/Cannot reassign constant/)
  })
})

describe('show', async () => {
  it('shows multiple values separated by space', async () => {
    const { output } = await run('show 1, 2, 3')
    expect(output).toEqual(['1 2 3'])
  })

  it('shows nothing as "nothing"', async () => {
    const { output } = await run('show nothing')
    expect(output).toEqual(['nothing'])
  })

  it('shows booleans as yes/no', async () => {
    const { output } = await run('show yes, no')
    expect(output).toEqual(['yes no'])
  })
})

describe('lists', async () => {
  it('creates and indexes a list', async () => {
    const { output } = await run(`
      remember nums as [10, 20, 30]
      show nums[0]
      show nums[-1]
    `)
    expect(output).toEqual(['10', '30'])
  })

  it('shows list display format', async () => {
    const { output } = await run('show [1, "two", 3]')
    expect(output).toEqual(['[1, "two", 3]'])
  })

  it('raises IndexError on out of bounds', async () => {
    const { error } = await run(`
      remember nums as [1, 2, 3]
      show nums[10]
    `)
    expect(error).not.toBeNull()
    expect(error.kind).toBe('IndexError')
  })
})

describe('maps', async () => {
  it('creates and indexes a map', async () => {
    const { output } = await run(`
      remember ages as {"alice": 25, "bob": 30}
      show ages["alice"]
    `)
    expect(output).toEqual(['25'])
  })

  it('returns nothing for missing key', async () => {
    const { output } = await run(`
      remember m as {"x": 1}
      show m["missing"]
    `)
    expect(output).toEqual(['nothing'])
  })
})

describe('size of', async () => {
  it('gets size of text', async () => {
    const { output } = await run('show size of "hello"')
    expect(output).toEqual(['5'])
  })

  it('gets size of list', async () => {
    const { output } = await run('show size of [1, 2, 3]')
    expect(output).toEqual(['3'])
  })
})

describe('interpolation', async () => {
  it('evaluates interpolated text', async () => {
    const { output } = await run(`
      remember name as "World"
      show "Hello, {name}!"
    `)
    expect(output).toEqual(['Hello, World!'])
  })

  it('evaluates expressions inside interpolation', async () => {
    const { output } = await run('show "result: {2 + 3}"')
    expect(output).toEqual(['result: 5'])
  })
})

describe('index assignment', async () => {
  it('assigns to list index', async () => {
    const { output } = await run(`
      remember nums as [1, 2, 3]
      set nums[0] to 99
      show nums
    `)
    expect(output).toEqual(['[99, 2, 3]'])
  })

  it('assigns to map key', async () => {
    const { output } = await run(`
      remember m as {"x": 1}
      set m["y"] to 2
      show m["y"]
    `)
    expect(output).toEqual(['2'])
  })
})
