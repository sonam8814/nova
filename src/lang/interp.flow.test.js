import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('Phase 5 — Control flow', () => {

  // --- Conditionals ---

  describe('check if / or if / otherwise', () => {
    it('executes the matching branch', () => {
      const { output } = run(`
        remember x as 10
        check if x > 20
          show "big"
        or if x > 5
          show "medium"
        otherwise
          show "small"
        done
      `)
      expect(output).toEqual(['medium'])
    })

    it('executes otherwise when no branch matches', () => {
      const { output } = run(`
        remember x as 1
        check if x > 10
          show "a"
        or if x > 5
          show "b"
        otherwise
          show "c"
        done
      `)
      expect(output).toEqual(['c'])
    })

    it('executes only the first matching branch', () => {
      const { output } = run(`
        remember x as 15
        check if x > 5
          show "first"
        or if x > 10
          show "second"
        done
      `)
      expect(output).toEqual(['first'])
    })

    it('skips everything when no branch matches and no otherwise', () => {
      const { output } = run(`
        check if no
          show "nope"
        done
        show "after"
      `)
      expect(output).toEqual(['after'])
    })
  })

  // --- While ---

  describe('while', () => {
    it('loops while condition is truthy', () => {
      const { output } = run(`
        remember i as 0
        while i < 5
          show i
          set i to i + 1
        done
      `)
      expect(output).toEqual(['0', '1', '2', '3', '4'])
    })

    it('does not enter when condition is initially false', () => {
      const { output } = run(`
        while no
          show "never"
        done
        show "done"
      `)
      expect(output).toEqual(['done'])
    })
  })

  // --- Repeat ---

  describe('repeat', () => {
    it('repeats N times', () => {
      const { output } = run(`
        repeat 3 times
          show "hi"
        done
      `)
      expect(output).toEqual(['hi', 'hi', 'hi'])
    })

    it('repeat with counter variable', () => {
      const { output } = run(`
        repeat 5 times as i
          show i
        done
      `)
      expect(output).toEqual(['0', '1', '2', '3', '4'])
    })

    it('repeat 0 times does nothing', () => {
      const { output } = run(`
        repeat 0 times
          show "nope"
        done
        show "after"
      `)
      expect(output).toEqual(['after'])
    })
  })

  // --- Count ---

  describe('count', () => {
    it('counts up inclusive', () => {
      const { output } = run(`
        count i from 1 to 5
          show i
        done
      `)
      expect(output).toEqual(['1', '2', '3', '4', '5'])
    })

    it('counts down', () => {
      const { output } = run(`
        count i from 5 down to 1
          show i
        done
      `)
      expect(output).toEqual(['5', '4', '3', '2', '1'])
    })

    it('counts down with by', () => {
      const { output } = run(`
        count i from 10 down to 1 by 3
          show i
        done
      `)
      expect(output).toEqual(['10', '7', '4', '1'])
    })

    it('counts up with by', () => {
      const { output } = run(`
        count i from 0 to 10 by 3
          show i
        done
      `)
      expect(output).toEqual(['0', '3', '6', '9'])
    })

    it('does not iterate when from > to for ascending', () => {
      const { output } = run(`
        count i from 10 to 5
          show i
        done
        show "after"
      `)
      expect(output).toEqual(['after'])
    })
  })

  // --- ForEach ---

  describe('for each', () => {
    it('iterates over a list', () => {
      const { output } = run(`
        remember nums as [10, 20, 30]
        for each n in nums
          show n
        done
      `)
      expect(output).toEqual(['10', '20', '30'])
    })

    it('iterates over a text yields characters', () => {
      const { output } = run(`
        for each ch in "abc"
          show ch
        done
      `)
      expect(output).toEqual(['a', 'b', 'c'])
    })

    it('iterates over map keys', () => {
      const { output } = run(`
        remember m as {"a": 1, "b": 2}
        for each k in m
          show k
        done
      `)
      expect(output).toEqual(['a', 'b'])
    })

    it('iterates over map key-value pairs', () => {
      const { output } = run(`
        remember m as {"x": 10, "y": 20}
        for each k to v in m
          show k, v
        done
      `)
      expect(output).toEqual(['x 10', 'y 20'])
    })

    it('empty list does nothing', () => {
      const { output } = run(`
        for each x in []
          show "nope"
        done
        show "done"
      `)
      expect(output).toEqual(['done'])
    })

    it('errors on non-iterable', () => {
      const { error } = run(`
        for each x in 42
          show x
        done
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('TypeError')
    })
  })

  // --- Forever ---

  describe('keep going', () => {
    it('loops until stop', () => {
      const { output } = run(`
        remember n as 3
        keep going
          check if n == 0
            stop
          done
          show n
          set n to n - 1
        done
      `)
      expect(output).toEqual(['3', '2', '1'])
    })
  })

  // --- Skip and Stop ---

  describe('skip and stop', () => {
    it('skip continues to next iteration', () => {
      const { output } = run(`
        count i from 1 to 5
          check if i == 3
            skip
          done
          show i
        done
      `)
      expect(output).toEqual(['1', '2', '4', '5'])
    })

    it('stop exits the loop', () => {
      const { output } = run(`
        count i from 1 to 10
          check if i == 4
            stop
          done
          show i
        done
        show "after"
      `)
      expect(output).toEqual(['1', '2', '3', 'after'])
    })

    it('skip and stop in nested loops', () => {
      const { output } = run(`
        count i from 1 to 3
          count j from 1 to 3
            check if j == 2
              skip
            done
            show "{i},{j}"
          done
        done
      `)
      expect(output).toEqual(['1,1', '1,3', '2,1', '2,3', '3,1', '3,3'])
    })

    it('stop only exits innermost loop', () => {
      const { output } = run(`
        count i from 1 to 3
          count j from 1 to 5
            check if j == 2
              stop
            done
            show "{i},{j}"
          done
        done
      `)
      expect(output).toEqual(['1,1', '2,1', '3,1'])
    })
  })

  // --- Step limit ---

  describe('step limit', () => {
    it('infinite while loop raises step-limit error', () => {
      const { error } = run(`
        remember x as 0
        while yes
          set x to x + 1
        done
      `)
      expect(error).not.toBeNull()
      expect(error.message).toMatch(/ran too long/)
    })
  })

  // --- FizzBuzz ---

  describe('FizzBuzz', () => {
    it('produces correct output for 1 to 20', () => {
      const { output } = run(`
        count i from 1 to 20
          check if i % 15 == 0
            show "FizzBuzz"
          or if i % 3 == 0
            show "Fizz"
          or if i % 5 == 0
            show "Buzz"
          otherwise
            show i
          done
        done
      `)
      expect(output).toEqual([
        '1', '2', 'Fizz', '4', 'Buzz',
        'Fizz', '7', '8', 'Fizz', 'Buzz',
        '11', 'Fizz', '13', '14', 'FizzBuzz',
        '16', '17', 'Fizz', '19', 'Buzz',
      ])
    })
  })

  // --- Truthiness ---

  describe('truthiness', () => {
    it('no is falsy', () => {
      const { output } = run(`
        check if no
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['no'])
    })

    it('nothing is falsy', () => {
      const { output } = run(`
        check if nothing
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['no'])
    })

    it('0 is falsy', () => {
      const { output } = run(`
        check if 0
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['no'])
    })

    it('empty text is falsy', () => {
      const { output } = run(`
        check if ""
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['no'])
    })

    it('empty list is truthy', () => {
      const { output } = run(`
        check if []
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['yes'])
    })

    it('empty map is truthy', () => {
      const { output } = run(`
        check if {}
          show "yes"
        otherwise
          show "no"
        done
      `)
      expect(output).toEqual(['yes'])
    })
  })
})
