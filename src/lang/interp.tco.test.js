import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('tail-call optimization', async () => {
  it('optimizes direct tail recursion beyond normal depth limit', async () => {
    const { output, error } = await run(`
      define countdown with n
        check if n <= 0
          give back "done"
        done
        give back countdown(n - 1)
      done
      show countdown(5000)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['done'])
  })

  it('optimizes mutual tail recursion', async () => {
    const { output, error } = await run(`
      define is_even with n
        check if n == 0
          give back yes
        done
        give back is_odd(n - 1)
      done

      define is_odd with n
        check if n == 0
          give back no
        done
        give back is_even(n - 1)
      done

      show is_even(4000)
      show is_odd(4001)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['yes', 'yes'])
  })

  it('does not optimize non-tail calls', async () => {
    const { output, error } = await run(`
      define factorial with n
        check if n <= 1
          give back 1
        done
        give back n * factorial(n - 1)
      done
      show factorial(10)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['3628800'])
  })

  it('preserves return value through tail call chain', async () => {
    const { output, error } = await run(`
      define sum_helper with n, acc
        check if n <= 0
          give back acc
        done
        give back sum_helper(n - 1, acc + n)
      done
      show sum_helper(100, 0)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['5050'])
  })

  it('tail call to a different function works', async () => {
    const { output, error } = await run(`
      define finish with x
        give back x * 2
      done

      define start with x
        give back finish(x + 1)
      done

      show start(5)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['12'])
  })

  it('non-tail call in non-last position is not optimized', async () => {
    const { output, error } = await run(`
      define helper with n
        check if n <= 0
          give back 0
        done
        remember result as helper(n - 1)
        give back result + 1
      done
      show helper(10)
    `)
    expect(error).toBeNull()
    expect(output).toEqual(['10'])
  })
})
