import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('Phase 6 — Functions and closures', () => {

  // --- Basic function declaration and calling ---

  describe('named functions', () => {
    it('defines and calls a simple function', () => {
      const { output } = run(`
        define greet
          show "hello"
        done
        greet()
      `)
      expect(output).toEqual(['hello'])
    })

    it('function with parameters', () => {
      const { output } = run(`
        define add with a, b
          give back a + b
        done
        show add(2, 3)
      `)
      expect(output).toEqual(['5'])
    })

    it('give back returns a value', () => {
      const { output } = run(`
        define double with x
          give back x * 2
        done
        show double(7)
      `)
      expect(output).toEqual(['14'])
    })

    it('function with no give back returns nothing', () => {
      const { output } = run(`
        define do_stuff
          remember x as 1
        done
        show do_stuff()
      `)
      expect(output).toEqual(['nothing'])
    })
  })

  // --- Default parameters ---

  describe('default parameters', () => {
    it('uses default when argument not provided', () => {
      const { output } = run(`
        define greet with name, greeting as "Hello"
          show "{greeting}, {name}"
        done
        greet("Aditya")
      `)
      expect(output).toEqual(['Hello, Aditya'])
    })

    it('overrides default when argument provided', () => {
      const { output } = run(`
        define greet with name, greeting as "Hello"
          show "{greeting}, {name}"
        done
        greet("Aditya", "Hey")
      `)
      expect(output).toEqual(['Hey, Aditya'])
    })

    it('multiple defaults', () => {
      const { output } = run(`
        define f with a, b as 10, c as 20
          give back a + b + c
        done
        show f(1)
        show f(1, 2)
        show f(1, 2, 3)
      `)
      expect(output).toEqual(['31', '23', '6'])
    })
  })

  // --- Hoisting ---

  describe('hoisting', () => {
    it('function can be called before it is defined', () => {
      const { output } = run(`
        show double(5)
        define double with x
          give back x * 2
        done
      `)
      expect(output).toEqual(['10'])
    })

    it('mutual recursion works via hoisting', () => {
      const { output } = run(`
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

        show is_even(4)
        show is_odd(5)
      `)
      expect(output).toEqual(['yes', 'yes'])
    })
  })

  // --- Closures ---

  describe('closures', () => {
    it('closure captures enclosing scope', () => {
      const { output } = run(`
        define make_counter
          remember cnt as 0
          define increment
            set cnt to cnt + 1
            give back cnt
          done
          give back increment
        done

        remember c as make_counter()
        show c()
        show c()
        show c()
      `)
      expect(output).toEqual(['1', '2', '3'])
    })

    it('functions are first-class values', () => {
      const { output } = run(`
        define add with a, b
          give back a + b
        done
        remember f as add
        show f(10, 20)
      `)
      expect(output).toEqual(['30'])
    })
  })

  // --- Anonymous functions (actions) ---

  describe('actions (anonymous functions)', () => {
    it('basic action', () => {
      const { output } = run(`
        remember double as action with x
          give back x * 2
        done
        show double(5)
      `)
      expect(output).toEqual(['10'])
    })

    it('action captures closure', () => {
      const { output } = run(`
        remember base as 100
        remember add_base as action with x
          give back x + base
        done
        show add_base(5)
      `)
      expect(output).toEqual(['105'])
    })

    it('action as argument', () => {
      const { output } = run(`
        define apply with f, x
          give back f(x)
        done
        show apply(action with x
          give back x * x
        done, 6)
      `)
      expect(output).toEqual(['36'])
    })
  })

  // --- Recursion ---

  describe('recursion', () => {
    it('fib(20) equals 6765', () => {
      const { output } = run(`
        define fib with n
          check if n <= 1
            give back n
          done
          give back fib(n - 1) + fib(n - 2)
        done
        show fib(20)
      `)
      expect(output).toEqual(['6765'])
    })

    it('factorial', () => {
      const { output } = run(`
        define fact with n
          check if n <= 1
            give back 1
          done
          give back n * fact(n - 1)
        done
        show fact(10)
      `)
      expect(output).toEqual(['3628800'])
    })
  })

  // --- Error cases ---

  describe('error cases', () => {
    it('arity mismatch — too few arguments', () => {
      const { error } = run(`
        define add with a, b
          give back a + b
        done
        add(1)
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('TypeError')
      expect(error.message).toMatch(/expects 2/)
      expect(error.message).toMatch(/got 1/)
    })

    it('arity mismatch — too many arguments', () => {
      const { error } = run(`
        define add with a, b
          give back a + b
        done
        add(1, 2, 3)
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('TypeError')
      expect(error.message).toMatch(/expects 2/)
      expect(error.message).toMatch(/got 3/)
    })

    it('calling a non-function raises TypeError', () => {
      const { error } = run(`
        remember x as 5
        x()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('TypeError')
      expect(error.message).toMatch(/not callable/)
    })

    it('infinite recursion raises DepthError without overflowing JS stack', () => {
      const { error } = run(`
        define boom
          boom()
        done
        boom()
      `)
      expect(error).not.toBeNull()
      expect(error.kind).toBe('DepthError')
      expect(error.message).toMatch(/depth/)
    })

    it('arity message for functions with defaults shows range', () => {
      const { error } = run(`
        define f with a, b as 10
          give back a + b
        done
        f()
      `)
      expect(error).not.toBeNull()
      expect(error.message).toMatch(/1 to 2/)
      expect(error.message).toMatch(/got 0/)
    })
  })

  // --- Nested functions and scoping ---

  describe('nested functions and scoping', () => {
    it('inner function sees outer variables', () => {
      const { output } = run(`
        define outer
          remember x as 42
          define inner
            show x
          done
          inner()
        done
        outer()
      `)
      expect(output).toEqual(['42'])
    })

    it('give back inside nested conditionals', () => {
      const { output } = run(`
        define classify with n
          check if n > 0
            give back "positive"
          or if n < 0
            give back "negative"
          otherwise
            give back "zero"
          done
        done
        show classify(5)
        show classify(-3)
        show classify(0)
      `)
      expect(output).toEqual(['positive', 'negative', 'zero'])
    })

    it('give back inside a loop exits the function', () => {
      const { output } = run(`
        define find with nums, target
          count i from 0 to size of nums - 1
            check if nums[i] == target
              give back i
            done
          done
          give back -1
        done
        show find([10, 20, 30, 40], 30)
        show find([10, 20, 30], 99)
      `)
      expect(output).toEqual(['2', '-1'])
    })
  })
})
