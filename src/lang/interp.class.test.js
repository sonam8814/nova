import { describe, it, expect } from 'vitest'
import { run } from './testUtils.js'

describe('Phase 9 — Classes and inheritance', () => {

  describe('basic class declaration and instantiation', () => {
    it('declares a class and creates an instance with new', () => {
      const { output } = run(`
        describe Point
          has x
          has y
        done
        remember p as new Point()
        show p
      `)
      expect(output).toEqual(['<Point>'])
    })

    it('setup constructor sets fields via my', () => {
      const { output } = run(`
        describe Dog
          has name
          has age
          define setup with name, age
            set my.name to name
            set my.age to age
          done
        done
        remember d as new Dog("Rex", 3)
        show d.name
        show d.age
      `)
      expect(output).toEqual(['Rex', '3'])
    })

    it('fields with defaults initialize correctly', () => {
      const { output } = run(`
        describe Animal
          has legs as 4
          has sound as "unknown"
        done
        remember a as new Animal()
        show a.legs
        show a.sound
      `)
      expect(output).toEqual(['4', 'unknown'])
    })

    it('fields without defaults initialize to nothing', () => {
      const { output } = run(`
        describe Box
          has content
        done
        remember b as new Box()
        show b.content
      `)
      expect(output).toEqual(['nothing'])
    })

    it('setup overrides field defaults', () => {
      const { output } = run(`
        describe Animal
          has legs as 4
          define setup with legs
            set my.legs to legs
          done
        done
        remember a as new Animal(8)
        show a.legs
      `)
      expect(output).toEqual(['8'])
    })

    it('errors when passing args to class without setup', () => {
      const { error } = run(`
        describe Empty
        done
        remember e as new Empty(1, 2)
      `)
      expect(error).toBeTruthy()
      expect(error.message).toContain('no \'setup\' method')
    })

    it('errors when new is called on a non-class', () => {
      const { error } = run(`
        remember x as 5
        remember y as new x()
      `)
      expect(error).toBeTruthy()
      expect(error.message).toContain('not a class')
    })
  })

  describe('method calls', () => {
    it('calls a method on an instance', () => {
      const { output } = run(`
        describe Dog
          has name
          define setup with name
            set my.name to name
          done
          define speak
            show "{my.name} barks"
          done
        done
        remember d as new Dog("Rex")
        d.speak()
      `)
      expect(output).toEqual(['Rex barks'])
    })

    it('method returns a value', () => {
      const { output } = run(`
        describe Calculator
          has value as 0
          define setup with v
            set my.value to v
          done
          define doubled
            give back my.value * 2
          done
        done
        remember c as new Calculator(21)
        show c.doubled()
      `)
      expect(output).toEqual(['42'])
    })

    it('method with parameters', () => {
      const { output } = run(`
        describe Greeter
          has prefix
          define setup with prefix
            set my.prefix to prefix
          done
          define greet with name
            show "{my.prefix}, {name}!"
          done
        done
        remember g as new Greeter("Hello")
        g.greet("Aditya")
      `)
      expect(output).toEqual(['Hello, Aditya!'])
    })

    it('set my.field works inside a method', () => {
      const { output } = run(`
        describe Counter
          has count as 0
          define increment
            set my.count to my.count + 1
          done
        done
        remember c as new Counter()
        c.increment()
        c.increment()
        c.increment()
        show c.count
      `)
      expect(output).toEqual(['3'])
    })

    it('class is displayed correctly', () => {
      const { output } = run(`
        describe Dog
        done
        show Dog
      `)
      expect(output).toEqual(['<class Dog>'])
    })
  })
})
