import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('Modules — use statement', async () => {
  it('imports top-level bindings from another file with use', async () => {
    const files = {
      'helpers.nova': `
        define double with x
          give back x * 2
        done
        remember helper_name as "helpers"
      `,
    }

    const result = await run(`
      use "helpers"
      show double(21)
      show helper_name
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['42', 'helpers'])
  })

  it('imports with namespace alias using use ... as', async () => {
    const files = {
      'math_utils.nova': `
        define square with x
          give back x * x
        done
        define cube with x
          give back x * x * x
        done
      `,
    }

    const result = await run(`
      use "math_utils" as m
      show m.square(5)
      show m.cube(3)
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['25', '27'])
  })

  it('supports three-file project: main uses utils which uses math', async () => {
    const files = {
      'math.nova': `
        define add with a, b
          give back a + b
        done
        define multiply with a, b
          give back a * b
        done
      `,
      'utils.nova': `
        use "math"
        define double with x
          give back multiply(x, 2)
        done
        define sum_and_product with a, b
          give back add(a, b) + multiply(a, b)
        done
      `,
    }

    const result = await run(`
      use "utils" as u
      show u.double(7)
      show u.sum_and_product(3, 4)
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['14', '19'])
  })

  it('caches modules — only executes once', async () => {
    const files = {
      'counter.nova': `
        show "loading counter"
        remember total as 42
      `,
    }

    const result = await run(`
      use "counter"
      use "counter"
      show total
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['loading counter', '42'])
  })

  it('caching second use does not re-execute', async () => {
    const files = {
      'counter.nova': `
        show "loading counter"
        remember total as 42
      `,
    }

    const result = await run(`
      use "counter"
      show total
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['loading counter', '42'])
  })

  it('detects circular imports and reports the cycle', async () => {
    const files = {
      'a.nova': `
        use "b"
        remember a_val as 1
      `,
      'b.nova': `
        use "a"
        remember b_val as 2
      `,
    }

    const result = await run(`use "a"`, { files })

    expect(result.error).not.toBe(null)
    expect(result.error.kind || result.error.errorData?.kind).toBe('FileError')
    const msg = result.error.message || result.error.errorData?.message
    expect(msg).toContain('Circular')
    expect(msg).toContain('a.nova')
    expect(msg).toContain('b.nova')
  })

  it('raises FileError for missing module', async () => {
    const result = await run(`use "nonexistent"`, { files: {} })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
    const msg = result.error.message || result.error.errorData?.message
    expect(msg).toContain('nonexistent')
  })

  it('auto-appends .nova extension when not provided', async () => {
    const files = {
      'helpers.nova': `
        remember greeting as "hello"
      `,
    }

    const result = await run(`
      use "helpers"
      show greeting
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['hello'])
  })

  it('imports classes from modules', async () => {
    const files = {
      'shapes.nova': `
        describe Circle
          has radius as 0
          define setup with r
            set my.radius to r
          done
          define area
            give back 3.14 * my.radius * my.radius
          done
        done
      `,
    }

    const result = await run(`
      use "shapes"
      remember c as new Circle(5)
      show c.area()
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['78.5'])
  })

  it('namespace import prevents name collisions', async () => {
    const files = {
      'a.nova': `
        remember x as 10
      `,
      'b.nova': `
        remember x as 20
      `,
    }

    const result = await run(`
      use "a" as a
      use "b" as b
      show a.x
      show b.x
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['10', '20'])
  })

  it('imported functions have proper closures', async () => {
    const files = {
      'maker.nova': `
        define make_counter
          remember n as 0
          give back action
            set n to n + 1
            give back n
          done
        done
      `,
    }

    const result = await run(`
      use "maker"
      remember c as make_counter()
      show c()
      show c()
      show c()
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['1', '2', '3'])
  })

  it('accessing non-existent export from namespace raises NameError', async () => {
    const files = {
      'lib.nova': `
        remember x as 1
      `,
    }

    const result = await run(`
      use "lib" as lib
      show lib.y
    `, { files })

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('NameError')
  })

  it('module with constants exports them correctly', async () => {
    const files = {
      'config.nova': `
        constant PI as 3.14159
        constant E as 2.71828
      `,
    }

    const result = await run(`
      use "config" as cfg
      show cfg.PI
      show cfg.E
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['3.14159', '2.71828'])
  })

  it('three-level module chain works', async () => {
    const files = {
      'base.nova': `
        define base_fn
          give back "base"
        done
      `,
      'mid.nova': `
        use "base"
        define mid_fn
          give back base_fn() + "-mid"
        done
      `,
      'top.nova': `
        use "mid"
        define top_fn
          give back mid_fn() + "-top"
        done
      `,
    }

    const result = await run(`
      use "top"
      show top_fn()
    `, { files })

    expect(result.error).toBe(null)
    expect(result.output).toEqual(['base-mid-top'])
  })

  it('use without module loader raises FileError', async () => {
    const result = await run(`use "something"`)

    expect(result.error).not.toBe(null)
    const kind = result.error.kind || result.error.errorData?.kind
    expect(kind).toBe('FileError')
  })
})
