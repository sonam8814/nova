import { describe, it, expect } from 'vitest'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Resolver } from './resolver.js'

function resolve(src) {
  const tokens = new Lexer(src, 'test.nova').tokenize()
  const parser = new Parser(tokens, 'test.nova')
  const program = parser.parse()
  if (parser.errors && parser.errors.length > 0) {
    throw new Error(`Test source failed to parse: ${parser.errors[0].message}`)
  }
  const resolver = new Resolver('test.nova')
  return resolver.resolve(program)
}

function typeErrors(src) {
  return resolve(src).filter(e => e.kind === 'TypeError')
}

describe('Static type checker', () => {

  describe('declaration type checking', () => {
    it('reports type mismatch on number declaration', () => {
      const errs = typeErrors('remember number x as "hello"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('reports type mismatch on text declaration', () => {
      const errs = typeErrors('remember text name as 42')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('reports type mismatch on truth declaration', () => {
      const errs = typeErrors('remember truth flag as "yes"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('truth')
      expect(errs[0].message).toContain('text')
    })

    it('reports type mismatch on list declaration', () => {
      const errs = typeErrors('remember list items as 5')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('list')
      expect(errs[0].message).toContain('number')
    })

    it('reports type mismatch on map declaration', () => {
      const errs = typeErrors('remember map data as [1, 2]')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('map')
      expect(errs[0].message).toContain('list')
    })

    it('accepts correct number declaration', () => {
      const errs = typeErrors('remember number x as 42')
      expect(errs.length).toBe(0)
    })

    it('accepts correct text declaration', () => {
      const errs = typeErrors('remember text name as "hello"')
      expect(errs.length).toBe(0)
    })

    it('accepts correct truth declaration', () => {
      const errs = typeErrors('remember truth flag as yes')
      expect(errs.length).toBe(0)
    })

    it('accepts correct list declaration', () => {
      const errs = typeErrors('remember list items as [1, 2, 3]')
      expect(errs.length).toBe(0)
    })

    it('accepts correct map declaration', () => {
      const errs = typeErrors('remember map data as {"a": 1}')
      expect(errs.length).toBe(0)
    })

    it('accepts correct nothing declaration', () => {
      const errs = typeErrors('remember nothing x as nothing')
      expect(errs.length).toBe(0)
    })

    it('accepts untyped declarations without errors', () => {
      const errs = typeErrors('remember x as 42\nremember y as "hello"')
      expect(errs.length).toBe(0)
    })
  })

  describe('anything type', () => {
    it('anything accepts any value', () => {
      const errs = typeErrors(`
remember anything x as 42
remember anything y as "hello"
remember anything z as [1, 2]
remember anything w as yes
remember anything v as nothing
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('assignment type checking', () => {
    it('reports type mismatch on assignment', () => {
      const errs = typeErrors('remember number x as 5\nset x to "hello"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('accepts correct assignment', () => {
      const errs = typeErrors('remember number x as 5\nset x to 10')
      expect(errs.length).toBe(0)
    })

    it('does not check untyped assignments', () => {
      const errs = typeErrors('remember x as 5\nset x to "hello"')
      expect(errs.length).toBe(0)
    })
  })

  describe('return type checking', () => {
    it('reports return type mismatch', () => {
      const errs = typeErrors(`
define foo gives number
  give back "hello"
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('accepts correct return type', () => {
      const errs = typeErrors(`
define foo gives number
  give back 42
done
`)
      expect(errs.length).toBe(0)
    })

    it('reports empty give back when return type expected', () => {
      const errs = typeErrors(`
define foo gives number
  give back
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
    })

    it('accepts give back without value for nothing return type', () => {
      const errs = typeErrors(`
define foo gives nothing
  give back
done
`)
      expect(errs.length).toBe(0)
    })

    it('does not check when no return type declared', () => {
      const errs = typeErrors(`
define foo
  give back "hello"
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('parameter type checking', () => {
    it('reports default value type mismatch', () => {
      const errs = typeErrors(`
define foo with number x as "hello"
  show x
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('accepts correct default value type', () => {
      const errs = typeErrors(`
define foo with number x as 5
  show x
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('field type checking in classes', () => {
    it('reports field default type mismatch', () => {
      const errs = typeErrors(`
describe Box
  has number size as "big"
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('accepts correct field default type', () => {
      const errs = typeErrors(`
describe Box
  has number size as 10
done
`)
      expect(errs.length).toBe(0)
    })

    it('accepts field without default', () => {
      const errs = typeErrors(`
describe Box
  has number size
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('type inference from expressions', () => {
    it('infers type from arithmetic', () => {
      const errs = typeErrors('remember text x as 1 + 2')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('infers type from comparison', () => {
      const errs = typeErrors('remember number x as 1 > 2')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('truth')
    })

    it('infers type from string concatenation', () => {
      const errs = typeErrors('remember number x as "a" + "b"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('infers type from negation', () => {
      const errs = typeErrors('remember text x as -5')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('infers type from not', () => {
      const errs = typeErrors('remember number x as not yes')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('truth')
    })

    it('infers type from size of', () => {
      const errs = typeErrors('remember text x as size of [1, 2]')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('infers type from interpolation', () => {
      const errs = typeErrors('remember number x as "hello {42}"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('number')
      expect(errs[0].message).toContain('text')
    })

    it('infers type through variables', () => {
      const errs = typeErrors(`
remember number x as 5
remember text y as x
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('infers type from global builtins', () => {
      const errs = typeErrors('remember text x as abs(-5)')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })

    it('infers type from user function return type', () => {
      const errs = typeErrors(`
define double with n gives number
  give back n * 2
done
remember text x as double(5)
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
      expect(errs[0].message).toContain('number')
    })
  })

  describe('class-typed hints are deferred to runtime', () => {
    it('does not statically check user-defined class types', () => {
      const errs = typeErrors(`
describe Dog
  has name
done
remember Dog pet as new Dog()
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('no false positives', () => {
    it('no errors on clean code with types', () => {
      const errs = typeErrors(`
remember number total as 0
remember text name as "nova"
remember truth active as yes
remember list items as [1, 2, 3]
remember map data as {"key": "value"}

define add with number a, number b gives number
  give back a + b
done

remember number result as add(1, 2)
set total to result
show name
show active
show items
show data
`)
      expect(errs.length).toBe(0)
    })

    it('no errors on code without type hints', () => {
      const errs = typeErrors(`
remember x as 42
remember y as "hello"
set x to "world"
define foo with a
  give back a
done
show foo(x)
`)
      expect(errs.length).toBe(0)
    })

    it('no errors when type is not inferable', () => {
      const errs = typeErrors(`
remember number x as floor(3.5)
define get_value
  give back 42
done
remember number y as get_value()
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('diagnostic shape', () => {
    it('reports kind, file, line, and column', () => {
      const errs = typeErrors('remember x as 1\nremember number y as "oops"')
      expect(errs.length).toBe(1)
      expect(errs[0].kind).toBe('TypeError')
      expect(errs[0].file).toBe('test.nova')
      expect(errs[0].line).toBe(2)
      expect(errs[0].column).toBe(1)
    })

    it('uses the exact declaration message format', () => {
      const errs = typeErrors('remember number age as "ten"')
      expect(errs[0].message).toBe("Expected number for 'age', got text.")
    })

    it('uses the exact assignment message format', () => {
      const errs = typeErrors('remember text name as "a"\nset name to 5')
      expect(errs[0].message).toBe("Expected text for 'name', got number.")
      expect(errs[0].line).toBe(2)
    })

    it('uses the exact return message formats', () => {
      const wrong = typeErrors('define f gives number\n  give back "x"\ndone')
      expect(wrong[0].message).toBe('Expected return type number, got text.')
      const empty = typeErrors('define f gives number\n  give back\ndone')
      expect(empty[0].message).toBe("Expected return type number, but 'give back' has no value.")
    })

    it('reports several mismatches in one pass', () => {
      const errs = typeErrors(`
remember number a as "x"
remember text b as 1
remember truth c as []
`)
      expect(errs.map(e => e.line)).toEqual([2, 3, 4])
    })

    it('reports type errors alongside undefined-name errors', () => {
      const all = resolve('remember number a as "x"\nshow missing')
      expect(all.filter(e => e.kind === 'TypeError').length).toBe(1)
      expect(all.length).toBe(2)
    })
  })

  describe('constants and typed parameters', () => {
    it('checks constant declarations', () => {
      const errs = typeErrors('constant number LIMIT as "high"')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain("'LIMIT'")
    })

    it('uses a typed parameter type inside the body', () => {
      const errs = typeErrors(`
define f with number n
  remember text t as n
  show t
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toBe("Expected text for 't', got number.")
    })

    it('checks assignment to a typed parameter', () => {
      const errs = typeErrors(`
define f with number n
  set n to "oops"
done
`)
      expect(errs.length).toBe(1)
    })

    it('checks default values on action parameters', () => {
      const errs = typeErrors(`
remember f as action with number x as "bad"
  show x
done
`)
      expect(errs.length).toBe(1)
    })

    it('does not report anything-typed parameters', () => {
      const errs = typeErrors(`
define f with anything x
  remember number n as 1
  set n to 2
  show x
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('return types in more places', () => {
    it('checks methods in classes', () => {
      const errs = typeErrors(`
describe Box
  define size_label gives number
    give back "big"
  done
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toBe('Expected return type number, got text.')
    })

    it('accepts anything as a return type', () => {
      const errs = typeErrors('define f gives anything\n  give back "x"\ndone')
      expect(errs.length).toBe(0)
    })

    it('flags a value returned from a nothing function', () => {
      const errs = typeErrors('define f gives nothing\n  give back 5\ndone')
      expect(errs.length).toBe(1)
    })

    it('restores the outer return type after a nested function', () => {
      const errs = typeErrors(`
define outer gives number
  define inner gives text
    give back "a"
  done
  give back inner()
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toBe('Expected return type number, got text.')
    })

    it('checks an action literal return type', () => {
      const errs = typeErrors(`
remember number n as 1
define f gives number
  give back action
    show n
  done
done
`)
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('action')
    })
  })

  describe('inference edge cases', () => {
    it('infers action from an action literal', () => {
      expect(typeErrors('remember number f as action\n  show 1\ndone').length).toBe(1)
      expect(typeErrors('remember action f as action\n  show 1\ndone').length).toBe(0)
    })

    it('infers text from ask', () => {
      const errs = typeErrors('remember number n as ask "How many? "')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toContain('text')
    })

    it('infers number from unary minus and truth from not', () => {
      expect(typeErrors('remember text t as -5').length).toBe(1)
      expect(typeErrors('remember number n as not yes').length).toBe(1)
      expect(typeErrors('remember number n as -5').length).toBe(0)
      expect(typeErrors('remember truth b as not yes').length).toBe(0)
    })

    it('infers through grouping', () => {
      expect(typeErrors('remember text t as (1 + 2)').length).toBe(1)
      expect(typeErrors('remember number n as (1 + 2)').length).toBe(0)
    })

    it('infers text when + mixes text and number', () => {
      expect(typeErrors('remember number n as "a" + 1').length).toBe(1)
      expect(typeErrors('remember text t as "a" + 1').length).toBe(0)
    })

    it('treats + on unknown operands as not inferable', () => {
      const errs = typeErrors(`
define f with a, b
  remember number n as a + b
  give back n
done
`)
      expect(errs.length).toBe(0)
    })

    it('infers number from every arithmetic operator', () => {
      for (const op of ['-', '*', '/', '%']) {
        expect(typeErrors(`remember text t as 6 ${op} 3`).length).toBe(1)
      }
    })

    it('infers truth from every comparison operator', () => {
      for (const op of ['<', '>', '<=', '>=', '==', '!=']) {
        expect(typeErrors(`remember number n as 1 ${op} 2`).length).toBe(1)
      }
    })

    it('does not infer a type for and/or', () => {
      expect(typeErrors('remember number n as yes and no').length).toBe(0)
    })

    it('flags nothing assigned to a typed variable', () => {
      expect(typeErrors('remember number n as nothing').length).toBe(1)
    })

    it('infers from a typed variable used in an expression', () => {
      const errs = typeErrors('remember number a as 1\nremember text b as a')
      expect(errs.length).toBe(1)
      expect(errs[0].message).toBe("Expected text for 'b', got number.")
    })

    it('does not infer through an untyped variable', () => {
      expect(typeErrors('remember a as 1\nremember text b as a').length).toBe(0)
    })

    it('does not infer a type for a method call', () => {
      const errs = typeErrors('remember items as [1]\nremember text t as items.pop()')
      expect(errs.length).toBe(0)
    })
  })

  describe('scoping of type information', () => {
    it('finds mismatches inside every kind of block', () => {
      const bodies = [
        'check if yes\n  remember number a as "x"\ndone',
        'while no\n  remember number a as "x"\ndone',
        'repeat 2 times\n  remember number a as "x"\ndone',
        'count i from 1 to 2\n  remember number a as "x"\ndone',
        'for each i in [1]\n  remember number a as "x"\ndone',
        'attempt\n  remember number a as "x"\nrescue err\n  show err\ndone',
        'attempt\n  show 1\nrescue err\n  remember number a as "x"\ndone',
        'attempt\n  show 1\nrescue err\n  show err\nalways\n  remember number a as "x"\ndone',
        'define f\n  remember number a as "x"\ndone',
        'describe C\n  define m\n    remember number a as "x"\n  done\ndone',
      ]
      for (const body of bodies) {
        expect(typeErrors(body).length, body).toBe(1)
      }
    })

    it('does not leak a typed inner variable to a sibling function', () => {
      const errs = typeErrors(`
define a
  remember number n as 1
  show n
done
define b
  remember text n as "x"
  set n to "y"
done
`)
      expect(errs.length).toBe(0)
    })

    it('lets an inner declaration shadow an outer type', () => {
      const errs = typeErrors(`
remember number n as 1
define f
  remember text n as "x"
  set n to "y"
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('action and nothing type names', () => {
    it('parses gives nothing and gives action', () => {
      expect(typeErrors('define f gives nothing\n  give back\ndone').length).toBe(0)
      expect(typeErrors('define f gives action\n  give back action\n    show 1\n  done\ndone').length).toBe(0)
    })

    it('accepts action-typed parameters', () => {
      const errs = typeErrors('define run_it with action fn\n  fn()\ndone')
      expect(errs.length).toBe(0)
    })

    it('does not apply an outer return type inside an action body', () => {
      const errs = typeErrors(`
define f gives number
  remember g as action
    give back "text"
  done
  give back 1
done
`)
      expect(errs.length).toBe(0)
    })
  })

  describe('checking continues after a failure', () => {
    it('still checks later statements after a mismatch', () => {
      const errs = typeErrors(`
remember number a as "x"
set a to 5
define f gives text
  give back 1
done
`)
      expect(errs.map(e => e.line)).toEqual([2, 5])
    })
  })
})
