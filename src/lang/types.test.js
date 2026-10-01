import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('Phase 11 — Type hints', async () => {

  describe('remember/constant with type hint', async () => {
    it('accepts correct type', async () => {
      const { output, error } = await run('remember number x as 5\nshow x')
      expect(error).toBeNull()
      expect(output).toEqual(['5'])
    })

    it('rejects wrong type on remember', async () => {
      const { error } = await run('remember number x as "hello"')
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('number')
      expect(msg).toContain('text')
      expect(msg).toContain('x')
    })

    it('rejects wrong type on constant', async () => {
      const { error } = await run('constant text name as 42')
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('text')
      expect(msg).toContain('number')
    })

    it('accepts truth type', async () => {
      const { output, error } = await run('remember truth flag as yes\nshow flag')
      expect(error).toBeNull()
      expect(output).toEqual(['yes'])
    })

    it('accepts list type', async () => {
      const { output, error } = await run('remember list items as [1, 2, 3]\nshow size of items')
      expect(error).toBeNull()
      expect(output).toEqual(['3'])
    })

    it('accepts map type', async () => {
      const { output, error } = await run('remember map data as {"a": 1}\nshow data["a"]')
      expect(error).toBeNull()
      expect(output).toEqual(['1'])
    })

    it('accepts action type', async () => {
      const { output, error } = await run('remember action f as action with x\n  give back x * 2\ndone\nshow f(5)')
      expect(error).toBeNull()
      expect(output).toEqual(['10'])
    })

    it('accepts nothing type', async () => {
      const { output, error } = await run('remember nothing x as nothing\nshow x')
      expect(error).toBeNull()
      expect(output).toEqual(['nothing'])
    })
  })

  describe('anything accepts everything', async () => {
    it('accepts number', async () => {
      const { error } = await run('remember anything x as 5')
      expect(error).toBeNull()
    })

    it('accepts text', async () => {
      const { error } = await run('remember anything x as "hello"')
      expect(error).toBeNull()
    })

    it('accepts nothing', async () => {
      const { error } = await run('remember anything x as nothing')
      expect(error).toBeNull()
    })

    it('accepts list', async () => {
      const { error } = await run('remember anything x as [1, 2]')
      expect(error).toBeNull()
    })
  })

  describe('parameter type hints', async () => {
    it('accepts correct parameter type', async () => {
      const { output, error } = await run(`
define add with number a, number b
  give back a + b
done
show add(3, 4)
`)
      expect(error).toBeNull()
      expect(output).toEqual(['7'])
    })

    it('rejects wrong parameter type with details', async () => {
      const { error } = await run(`
define greet with text name
  show "Hello, {name}"
done
greet(42)
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('text')
      expect(msg).toContain('number')
      expect(msg).toContain('name')
    })

    it('reports location on parameter type error', async () => {
      const { error } = await run(`
define double with number x
  give back x * 2
done
double("bad")
`)
      expect(error).not.toBeNull()
      const data = error.errorData || error
      expect(data.line).toBeDefined()
      expect(data.column).toBeDefined()
    })
  })

  describe('gives return type', async () => {
    it('accepts correct return type', async () => {
      const { output, error } = await run(`
define double with x gives number
  give back x * 2
done
show double(5)
`)
      expect(error).toBeNull()
      expect(output).toEqual(['10'])
    })

    it('rejects wrong return type', async () => {
      const { error } = await run(`
define bad gives number
  give back "oops"
done
bad()
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('number')
      expect(msg).toContain('text')
    })

    it('rejects nothing return when gives is declared', async () => {
      const { error } = await run(`
define noop gives number
done
noop()
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('number')
      expect(msg).toContain('nothing')
    })
  })

  describe('field type hints', async () => {
    it('accepts correct field type via set my.field', async () => {
      const { output, error } = await run(`
describe Point
  has number x
  has number y
  define setup with a, b
    set my.x to a
    set my.y to b
  done
done
remember p as new Point(3, 4)
show p.x
show p.y
`)
      expect(error).toBeNull()
      expect(output).toEqual(['3', '4'])
    })

    it('rejects wrong field type via set my.field', async () => {
      const { error } = await run(`
describe Point
  has number x
  define setup with a
    set my.x to a
  done
done
remember p as new Point("bad")
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('number')
      expect(msg).toContain('text')
      expect(msg).toContain('x')
    })

    it('rejects wrong field type via instance property set', async () => {
      const { error } = await run(`
describe Box
  has number size
  define setup with s
    set my.size to s
  done
done
remember b as new Box(5)
set b.size to "big"
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('number')
    })
  })

  describe('class-typed hints', async () => {
    it('accepts exact class match', async () => {
      const { output, error } = await run(`
describe Dog
  has name
  define setup with n
    set my.name to n
  done
done
remember Dog pet as new Dog("Rex")
show pet.name
`)
      expect(error).toBeNull()
      expect(output).toEqual(['Rex'])
    })

    it('accepts subclass for superclass hint', async () => {
      const { output, error } = await run(`
describe Animal
  has name
  define setup with n
    set my.name to n
  done
done
describe Dog from Animal
  define setup with n
    parent.setup(n)
  done
done
remember Animal pet as new Dog("Rex")
show pet.name
`)
      expect(error).toBeNull()
      expect(output).toEqual(['Rex'])
    })

    it('rejects superclass for subclass hint', async () => {
      const { error } = await run(`
describe Animal
done
describe Dog from Animal
done
remember Dog pet as new Animal()
`)
      expect(error).not.toBeNull()
      const msg = error.errorData?.message || error.message
      expect(msg).toContain('Dog')
      expect(msg).toContain('Animal')
    })
  })
})
