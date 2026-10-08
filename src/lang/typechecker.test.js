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
remember number count as 0
remember text name as "nova"
remember truth active as yes
remember list items as [1, 2, 3]
remember map data as {"key": "value"}

define add with number a, number b gives number
  give back a + b
done

remember number result as add(1, 2)
set count to result
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
})
