import { describe, it, expect } from 'vitest'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'

function parse(src) {
  const tokens = new Lexer(src, 'test.nova').tokenize()
  const parser = new Parser(tokens, 'test.nova')
  return parser.parse()
}

function stmt(src) {
  return parse(src).body[0]
}

function expectError(src, messageMatch, hintMatch) {
  expect(() => parse(src)).toThrow(messageMatch)
  if (hintMatch) {
    try { parse(src) } catch (e) {
      expect(e.hint).toMatch(hintMatch)
    }
  }
}

// --- Declarations ---

describe('declarations', () => {
  it('parses remember with value', () => {
    const node = stmt('remember x as 5')
    expect(node.type).toBe('Declare')
    expect(node.name).toBe('x')
    expect(node.isConstant).toBe(false)
    expect(node.typeHint).toBeNull()
    expect(node.value.type).toBe('Num')
    expect(node.value.value).toBe(5)
  })

  it('parses remember with type hint', () => {
    const node = stmt('remember number total as 0')
    expect(node.type).toBe('Declare')
    expect(node.name).toBe('total')
    expect(node.typeHint).toBe('number')
    expect(node.value.value).toBe(0)
  })

  it('parses constant', () => {
    const node = stmt('constant MAX as 100')
    expect(node.type).toBe('Declare')
    expect(node.isConstant).toBe(true)
    expect(node.name).toBe('MAX')
    expect(node.value.value).toBe(100)
  })

  it('errors on remember 5 as x (wrong order)', () => {
    expectError('remember 5 as x', /Expected a variable name/, /remember myVar as 5/)
  })

  it('errors on missing as keyword', () => {
    expectError('remember x 5', /Expected 'as'/)
  })
})

// --- Assignments ---

describe('assignments', () => {
  it('parses simple set', () => {
    const node = stmt('set x to 10')
    expect(node.type).toBe('Assign')
    expect(node.target.type).toBe('Ident')
    expect(node.target.name).toBe('x')
    expect(node.value.value).toBe(10)
  })

  it('parses set with index', () => {
    const node = stmt('set nums[0] to 9')
    expect(node.type).toBe('Assign')
    expect(node.target.type).toBe('Index')
    expect(node.target.object.name).toBe('nums')
    expect(node.target.index.value).toBe(0)
  })

  it('parses set with property', () => {
    const node = stmt('set my.name to "Rex"')
    expect(node.type).toBe('Assign')
    expect(node.target.type).toBe('Property')
    expect(node.target.object.name).toBe('my')
    expect(node.target.name).toBe('name')
  })

  it('parses set with chained access', () => {
    const node = stmt('set obj.items[0] to 1')
    expect(node.type).toBe('Assign')
    expect(node.target.type).toBe('Index')
    expect(node.target.object.type).toBe('Property')
  })
})

// --- Show ---

describe('show', () => {
  it('parses single show', () => {
    const node = stmt('show 42')
    expect(node.type).toBe('Show')
    expect(node.expressions).toHaveLength(1)
    expect(node.expressions[0].value).toBe(42)
  })

  it('parses show with multiple expressions', () => {
    const node = stmt('show 1, 2, 3')
    expect(node.type).toBe('Show')
    expect(node.expressions).toHaveLength(3)
  })
})

// --- Conditionals ---

describe('check if', () => {
  it('parses simple check if / done', () => {
    const node = stmt('check if x > 0 show "positive" done')
    expect(node.type).toBe('If')
    expect(node.branches).toHaveLength(1)
    expect(node.otherwise).toBeNull()
  })

  it('parses three-branch check if', () => {
    const src = `
      check if score >= 90
        show "A"
      or if score >= 80
        show "B"
      or if score >= 70
        show "C"
      otherwise
        show "F"
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('If')
    expect(node.branches).toHaveLength(3)
    expect(node.branches[0].condition.operator).toBe('>=')
    expect(node.branches[1].body[0].type).toBe('Show')
    expect(node.otherwise).toHaveLength(1)
    expect(node.otherwise[0].type).toBe('Show')
  })

  it('parses check if without otherwise', () => {
    const src = `
      check if x > 0
        show "yes"
      or if x == 0
        show "zero"
      done
    `
    const node = stmt(src)
    expect(node.branches).toHaveLength(2)
    expect(node.otherwise).toBeNull()
  })
})

// --- While loop ---

describe('while', () => {
  it('parses while loop', () => {
    const src = `
      while x > 0
        set x to x - 1
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('While')
    expect(node.condition.operator).toBe('>')
    expect(node.body).toHaveLength(1)
  })
})

// --- Repeat loop ---

describe('repeat', () => {
  it('parses repeat N times', () => {
    const src = `
      repeat 5 times
        show "hi"
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('Repeat')
    expect(node.count.value).toBe(5)
    expect(node.name).toBeNull()
  })

  it('parses repeat with as variable', () => {
    const src = `
      repeat 5 times as i
        show i
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('Repeat')
    expect(node.name).toBe('i')
  })
})

// --- Count loop ---

describe('count', () => {
  it('parses count from to', () => {
    const src = `
      count i from 1 to 10
        show i
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('Count')
    expect(node.name).toBe('i')
    expect(node.from.value).toBe(1)
    expect(node.to.value).toBe(10)
    expect(node.isDown).toBe(false)
    expect(node.by).toBeNull()
  })

  it('parses count down to', () => {
    const src = `
      count i from 10 down to 1
        show i
      done
    `
    const node = stmt(src)
    expect(node.isDown).toBe(true)
  })

  it('parses count with by step', () => {
    const src = `
      count i from 0 to 100 by 5
        show i
      done
    `
    const node = stmt(src)
    expect(node.by.value).toBe(5)
  })
})

// --- For each loop ---

describe('for each', () => {
  it('parses for each item in list', () => {
    const src = `
      for each item in nums
        show item
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('ForEach')
    expect(node.keyName).toBe('item')
    expect(node.valueName).toBeNull()
    expect(node.iterable.name).toBe('nums')
  })

  it('parses for each key to value in map', () => {
    const src = `
      for each key to value in ages
        show key
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('ForEach')
    expect(node.keyName).toBe('key')
    expect(node.valueName).toBe('value')
    expect(node.iterable.name).toBe('ages')
  })
})

// --- Keep going (forever loop) ---

describe('keep going', () => {
  it('parses keep going loop', () => {
    const src = `
      keep going
        show "forever"
        stop
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('Forever')
    expect(node.body).toHaveLength(2)
    expect(node.body[1].type).toBe('Stop')
  })
})

// --- Function declarations ---

describe('define', () => {
  it('parses simple define', () => {
    const src = `
      define greet
        show "hello"
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('FuncDecl')
    expect(node.name).toBe('greet')
    expect(node.params).toHaveLength(0)
    expect(node.returnType).toBeNull()
    expect(node.body).toHaveLength(1)
  })

  it('parses define with params', () => {
    const src = `
      define add with x, y
        give back x + y
      done
    `
    const node = stmt(src)
    expect(node.name).toBe('add')
    expect(node.params).toHaveLength(2)
    expect(node.params[0].name).toBe('x')
    expect(node.params[1].name).toBe('y')
    expect(node.body[0].type).toBe('Return')
  })

  it('parses define with typed params and return type', () => {
    const src = `
      define add with number x, number y gives number
        give back x + y
      done
    `
    const node = stmt(src)
    expect(node.params[0].type).toBe('number')
    expect(node.params[1].type).toBe('number')
    expect(node.returnType).toBe('number')
  })

  it('parses define with default parameter', () => {
    const src = `
      define greet with name, greeting as "Hello"
        show greeting
      done
    `
    const node = stmt(src)
    expect(node.params[0].default).toBeNull()
    expect(node.params[1].default.type).toBe('Text')
    expect(node.params[1].default.value).toBe('Hello')
  })
})

// --- Give back (return) ---

describe('give back', () => {
  it('parses give back with value', () => {
    const src = `
      define f
        give back 42
      done
    `
    const node = stmt(src)
    const ret = node.body[0]
    expect(ret.type).toBe('Return')
    expect(ret.value.value).toBe(42)
  })

  it('parses give back without value', () => {
    const src = `
      define f
        give back
      done
    `
    const node = stmt(src)
    const ret = node.body[0]
    expect(ret.type).toBe('Return')
    expect(ret.value).toBeNull()
  })
})

// --- Skip and stop ---

describe('skip and stop', () => {
  it('allows skip inside a loop', () => {
    const src = `
      repeat 5 times
        skip
      done
    `
    const node = stmt(src)
    expect(node.body[0].type).toBe('Skip')
  })

  it('allows stop inside a loop', () => {
    const src = `
      while yes
        stop
      done
    `
    const node = stmt(src)
    expect(node.body[0].type).toBe('Stop')
  })

  it('errors on skip outside a loop', () => {
    expectError('skip', /can only be used inside a loop/)
  })

  it('errors on stop outside a loop', () => {
    expectError('stop', /can only be used inside a loop/)
  })
})

// --- Expression statements ---

describe('expression statements', () => {
  it('parses a bare function call', () => {
    const node = stmt('greet("Aditya")')
    expect(node.type).toBe('ExprStmt')
    expect(node.expression.type).toBe('Call')
  })
})

// --- Nested blocks ---

describe('nested blocks', () => {
  it('parses three levels of nesting', () => {
    const src = `
      check if x > 0
        while y > 0
          repeat 3 times
            show "deep"
          done
        done
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('If')
    const whileNode = node.branches[0].body[0]
    expect(whileNode.type).toBe('While')
    const repeatNode = whileNode.body[0]
    expect(repeatNode.type).toBe('Repeat')
    expect(repeatNode.body[0].type).toBe('Show')
  })
})

// --- Error cases ---

describe('error cases', () => {
  it('errors on missing done for check if', () => {
    expectError('check if x > 0 show "yes"', /Expected 'done'/)
  })

  it('errors on missing done for while', () => {
    expectError('while yes show "forever"', /Expected 'done'/)
  })

  it('errors on missing done for define', () => {
    expectError('define f show "hi"', /Expected 'done'/)
  })
})

// --- Program node ---

describe('Program', () => {
  it('parses multiple statements into a Program', () => {
    const src = `
      remember x as 1
      remember y as 2
      show x + y
    `
    const program = parse(src)
    expect(program.type).toBe('Program')
    expect(program.body).toHaveLength(3)
    expect(program.body[0].type).toBe('Declare')
    expect(program.body[1].type).toBe('Declare')
    expect(program.body[2].type).toBe('Show')
  })

  it('parses empty program', () => {
    const program = parse('')
    expect(program.type).toBe('Program')
    expect(program.body).toHaveLength(0)
  })
})

// --- Action with body ---

describe('action (anonymous function)', () => {
  it('parses action with body', () => {
    const src = `
      remember double as action with x
        give back x * 2
      done
    `
    const node = stmt(src)
    expect(node.type).toBe('Declare')
    expect(node.value.type).toBe('Action')
    expect(node.value.params).toHaveLength(1)
    expect(node.value.body).toHaveLength(1)
    expect(node.value.body[0].type).toBe('Return')
  })
})
