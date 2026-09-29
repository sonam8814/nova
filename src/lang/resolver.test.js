import { describe, it, expect } from 'vitest'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Resolver } from './resolver.js'

function resolve(src) {
  const tokens = new Lexer(src, 'test.nova').tokenize()
  const program = new Parser(tokens, 'test.nova').parse()
  const resolver = new Resolver('test.nova')
  return resolver.resolve(program)
}

describe('Phase 11 — Resolver', () => {

  describe('undeclared names', () => {
    it('reports use of an undeclared variable', () => {
      const errs = resolve('show x')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'x' is not defined")
    })

    it('reports two typos and gives both lines', () => {
      const errs = resolve('remember x as 1\nshow y\nshow z')
      expect(errs.length).toBe(2)
      expect(errs[0].message).toContain("'y' is not defined")
      expect(errs[0].line).toBe(2)
      expect(errs[1].message).toContain("'z' is not defined")
      expect(errs[1].line).toBe(3)
    })

    it('suggests a close match', () => {
      const errs = resolve('remember total as 5\nshow totall')
      expect(errs.length).toBe(1)
      expect(errs[0].hint).toContain("'total'")
    })

    it('recognizes global builtins', () => {
      const errs = resolve('show floor(3.7)\nshow abs(-5)\nshow to_text(42)')
      expect(errs.length).toBe(0)
    })
  })

  describe('duplicate declarations', () => {
    it('reports declaring the same name twice in one scope', () => {
      const errs = resolve('remember x as 1\nremember x as 2')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'x' is already declared")
    })

    it('allows same name in different scopes', () => {
      const errs = resolve(`
define foo
  remember x as 1
  show x
done
define bar
  remember x as 2
  show x
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('hoisting', () => {
    it('allows calling a function before its definition', () => {
      const errs = resolve('show greet()\ndefine greet\n  give back 42\ndone')
      expect(errs.length).toBe(0)
    })

    it('allows referencing a class before its definition', () => {
      const errs = resolve('remember d as new Dog()\ndescribe Dog\ndone')
      expect(errs.length).toBe(0)
    })
  })

  describe('loop variable scoping', () => {
    it('count variable is not visible outside loop', () => {
      const errs = resolve('count i from 1 to 5\n  show i\ndone\nshow i')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'i' is not defined")
    })

    it('for each variable is not visible outside loop', () => {
      const errs = resolve('remember items as [1,2,3]\nfor each item in items\n  show item\ndone\nshow item')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'item' is not defined")
    })

    it('repeat as variable is not visible outside loop', () => {
      const errs = resolve('repeat 3 times as i\n  show i\ndone\nshow i')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'i' is not defined")
    })
  })

  describe('give back outside function', () => {
    it('reports give back at top level', () => {
      const errs = resolve('give back 5')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'give back' can only be used inside a function")
    })

    it('allows give back inside a function', () => {
      const errs = resolve('define foo\n  give back 5\ndone')
      expect(errs.length).toBe(0)
    })

    it('allows give back inside an action', () => {
      const errs = resolve(`
remember f as action with x
  give back x * 2
done
`)
      expect(errs.length).toBe(0)
    })

    it('reports give back inside a loop but outside a function', () => {
      const errs = resolve('while yes\n  give back 1\ndone')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'give back' can only be used inside a function")
    })
  })

  describe('my/parent outside method', () => {
    it('reports my at top level', () => {
      const errs = resolve('show my.name')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'my' can only be used inside a class method")
    })

    it('reports parent at top level', () => {
      const errs = resolve('show parent.foo()')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'parent' can only be used inside a class method")
    })

    it('reports set my.field outside a class', () => {
      const errs = resolve('define foo\n  set my.name to 5\ndone')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'my' can only be used inside a class method")
    })

    it('allows my inside a class method', () => {
      const errs = resolve(`
describe Dog
  has name
  define setup with n
    set my.name to n
  done
  define speak
    show my.name
  done
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('unreachable code', () => {
    it('reports code after give back', () => {
      const errs = resolve(`
define foo
  give back 5
  show "never"
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('Unreachable code')
    })

    it('reports code after stop in a loop', () => {
      const errs = resolve(`
while yes
  stop
  show "never"
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('Unreachable code')
    })

    it('does not report when give back is inside a conditional', () => {
      const errs = resolve(`
define foo with x
  check if x > 0
    give back x
  done
  show "reachable"
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('attempt/rescue scoping', () => {
    it('rescue variable is not visible outside attempt block', () => {
      const errs = resolve('attempt\n  show 1\nrescue e\n  show e\ndone\nshow e')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'e' is not defined")
    })

    it('rescue variable is visible inside rescue block', () => {
      const errs = resolve('attempt\n  show 1\nrescue e\n  show e\ndone')
      expect(errs.length).toBe(0)
    })
  })

  describe('superclass references', () => {
    it('allows valid superclass reference', () => {
      const errs = resolve('describe Animal\ndone\ndescribe Dog from Animal\ndone')
      expect(errs.length).toBe(0)
    })

    it('reports undeclared superclass', () => {
      const errs = resolve('describe Dog from Ghost\ndone')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'Ghost' is not defined")
    })
  })

  describe('complex programs', () => {
    it('resolves a program with functions, classes, and loops without errors', () => {
      const errs = resolve(`
describe Animal
  has name
  define setup with n
    set my.name to n
  done
  define speak
    show my.name
  done
done

describe Dog from Animal
  has breed
  define setup with n, b
    parent.setup(n)
    set my.breed to b
  done
done

define process with items
  remember result as []
  for each item in items
    result.add(item * 2)
  done
  give back result
done

remember nums as [1, 2, 3]
remember doubled as process(nums)
show doubled
`)
      expect(errs.length).toBe(0)
    })
  })
})
