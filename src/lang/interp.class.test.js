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

  describe('inheritance', () => {
    it('Animal/Dog example from the spec', () => {
      const { output } = run(`
        describe Animal
          has name
          has number age
          has legs as 4

          define setup with name, age
            set my.name to name
            set my.age to age
          done

          define speak
            show "{my.name} makes a sound"
          done

          define describe_self
            give back "{my.name}, age {my.age}"
          done
        done

        describe Dog from Animal
          define setup with name, age, breed
            parent.setup(name, age)
            set my.breed to breed
          done

          define speak
            show "{my.name} barks"
          done
        done

        remember d as new Dog("Rex", 3, "Lab")
        d.speak()
        show d.describe_self()
        show d.legs
      `)
      expect(output).toEqual(['Rex barks', 'Rex, age 3', '4'])
    })

    it('child inherits methods from parent class', () => {
      const { output } = run(`
        describe Base
          define greet
            show "hello from Base"
          done
        done
        describe Child from Base
        done
        remember c as new Child()
        c.greet()
      `)
      expect(output).toEqual(['hello from Base'])
    })

    it('child overrides parent method', () => {
      const { output } = run(`
        describe Base
          define speak
            show "base"
          done
        done
        describe Child from Base
          define speak
            show "child"
          done
        done
        remember c as new Child()
        c.speak()
      `)
      expect(output).toEqual(['child'])
    })

    it('parent.setup chains correctly', () => {
      const { output } = run(`
        describe A
          has x
          define setup with x
            set my.x to x
          done
        done
        describe B from A
          has y
          define setup with x, y
            parent.setup(x)
            set my.y to y
          done
        done
        remember b as new B(10, 20)
        show b.x
        show b.y
      `)
      expect(output).toEqual(['10', '20'])
    })

    it('three-level inheritance with parent at each level', () => {
      const { output } = run(`
        describe A
          define greet
            show "A"
          done
        done
        describe B from A
          define greet
            parent.greet()
            show "B"
          done
        done
        describe C from B
          define greet
            parent.greet()
            show "C"
          done
        done
        remember c as new C()
        c.greet()
      `)
      expect(output).toEqual(['A', 'B', 'C'])
    })

    it('field defaults inherited from superclass', () => {
      const { output } = run(`
        describe Vehicle
          has wheels as 4
          has engine as "gas"
        done
        describe Truck from Vehicle
          has payload as 1000
        done
        remember t as new Truck()
        show t.wheels
        show t.engine
        show t.payload
      `)
      expect(output).toEqual(['4', 'gas', '1000'])
    })

    it('overridden method called from inherited method dispatches to override', () => {
      const { output } = run(`
        describe Base
          define name
            give back "base"
          done
          define greet
            show "hello from {my.name()}"
          done
        done
        describe Child from Base
          define name
            give back "child"
          done
        done
        remember c as new Child()
        c.greet()
      `)
      expect(output).toEqual(['hello from child'])
    })

    it('errors when inheriting from a non-class', () => {
      const { error } = run(`
        describe Bad from abs
        done
      `)
      expect(error).toBeTruthy()
      expect(error.message).toContain('not a class')
    })

    it('parent errors when class has no superclass', () => {
      const { error } = run(`
        describe Solo
          define act
            parent.act()
          done
        done
        remember s as new Solo()
        s.act()
      `)
      expect(error).toBeTruthy()
      expect(error.message).toContain('no superclass')
    })
  })
})
