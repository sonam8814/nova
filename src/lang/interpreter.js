import { Environment } from './environment.js'
import { typeName, toDisplay, isTruthy } from './values.js'

export class RuntimeError extends Error {
  constructor(kind, message, hint, loc) {
    super(message)
    this.name = 'RuntimeError'
    this.kind = kind
    this.hint = hint || null
    this.line = loc ? loc.line : null
    this.column = loc ? loc.column : null
  }
}

export class Interpreter {
  constructor({ output, fileName = 'main.nova' } = {}) {
    this.output = output || (() => {})
    this.fileName = fileName
    this.globals = new Environment()
    this.env = this.globals
  }

  run(program) {
    for (const stmt of program.body) {
      this.execute(stmt)
    }
  }

  execute(node) {
    switch (node.type) {
      case 'Program': return this.run(node)
      case 'Declare': return this.execDeclare(node)
      case 'Assign': return this.execAssign(node)
      case 'Show': return this.execShow(node)
      case 'ExprStmt': return this.evaluate(node.expression)
      default:
        throw this.error('RuntimeError', `Cannot execute '${node.type}' yet.`, null, node.loc)
    }
  }

  evaluate(node) {
    switch (node.type) {
      case 'Num': return node.value
      case 'Text': return node.value
      case 'Bool': return node.value
      case 'Nothing': return null
      case 'Ident': return this.evalIdent(node)
      case 'Binary': return this.evalBinary(node)
      case 'Unary': return this.evalUnary(node)
      case 'Grouping': return this.evaluate(node.expression)
      case 'ListLit': return this.evalListLit(node)
      case 'MapLit': return this.evalMapLit(node)
      case 'Index': return this.evalIndex(node)
      case 'Interpolation': return this.evalInterpolation(node)
      default:
        throw this.error('RuntimeError', `Cannot evaluate '${node.type}' yet.`, null, node.loc)
    }
  }

  // --- Statements ---

  execDeclare(node) {
    const value = this.evaluate(node.value)
    try {
      this.env.declare(node.name, value, {
        constant: node.isConstant,
        type: node.typeHint,
      })
    } catch (e) {
      if (e.kind) {
        throw this.error(e.kind, e.message, e.hint, node.loc)
      }
      throw e
    }
  }

  execAssign(node) {
    const value = this.evaluate(node.value)
    const target = node.target

    if (target.type === 'Ident') {
      try {
        this.env.assign(target.name, value)
      } catch (e) {
        if (e.kind) {
          throw this.error(e.kind, e.message, e.hint, target.loc)
        }
        throw e
      }
      return
    }

    if (target.type === 'Index') {
      const obj = this.evaluate(target.object)
      const idx = this.evaluate(target.index)

      if (obj && obj._type === 'list') {
        let index = idx
        if (typeof index !== 'number' || !Number.isInteger(index)) {
          throw this.error('TypeError', `List index must be an integer, got ${typeName(idx)}.`, null, target.loc)
        }
        if (index < 0) index = obj.elements.length + index
        if (index < 0 || index >= obj.elements.length) {
          throw this.error('IndexError', `Index ${idx} out of bounds for list of size ${obj.elements.length}.`, null, target.loc)
        }
        obj.elements[index] = value
        return
      }

      if (obj && obj._type === 'map') {
        obj.entries.set(idx, value)
        return
      }

      throw this.error('TypeError', `Cannot index into ${typeName(obj)}.`, null, target.loc)
    }

    if (target.type === 'Property') {
      if (target.object.type === 'Ident' && target.object.name === 'my') {
        throw this.error('RuntimeError', "'my' is not available outside a method.", null, target.loc)
      }
      const obj = this.evaluate(target.object)
      if (obj && obj._type === 'instance') {
        obj.fields.set(target.name, value)
        return
      }
      throw this.error('TypeError', `Cannot set property '${target.name}' on ${typeName(obj)}.`, null, target.loc)
    }

    throw this.error('RuntimeError', 'Invalid assignment target.', null, target.loc)
  }

  execShow(node) {
    const values = node.expressions.map(e => this.evaluate(e))
    const text = values.map(v => toDisplay(v)).join(' ')
    this.output(text)
  }

  // --- Expressions ---

  evalIdent(node) {
    try {
      return this.env.get(node.name)
    } catch (e) {
      if (e.kind) {
        throw this.error(e.kind, e.message, e.hint, node.loc)
      }
      throw e
    }
  }

  evalBinary(node) {
    if (node.operator === 'and') {
      const left = this.evaluate(node.left)
      return isTruthy(left) ? this.evaluate(node.right) : left
    }
    if (node.operator === 'or') {
      const left = this.evaluate(node.left)
      return isTruthy(left) ? left : this.evaluate(node.right)
    }

    const left = this.evaluate(node.left)
    const right = this.evaluate(node.right)

    switch (node.operator) {
      case '+': return this.add(left, right, node)
      case '-': return this.numOp(left, right, (a, b) => a - b, '-', node)
      case '*': return this.numOp(left, right, (a, b) => a * b, '*', node)
      case '/': return this.divide(left, right, node)
      case '%': return this.numOp(left, right, (a, b) => ((a % b) + b) % b, '%', node)
      case '^': return this.numOp(left, right, (a, b) => Math.pow(a, b), '^', node)

      case '<': return this.compare(left, right, (a, b) => a < b, '<', node)
      case '>': return this.compare(left, right, (a, b) => a > b, '>', node)
      case '<=': return this.compare(left, right, (a, b) => a <= b, '<=', node)
      case '>=': return this.compare(left, right, (a, b) => a >= b, '>=', node)

      case '==':
      case 'is':
        return left === right || (left === null && right === null)
      case '!=':
      case 'is not':
        return !(left === right || (left === null && right === null))

      default:
        throw this.error('RuntimeError', `Unknown operator '${node.operator}'.`, null, node.loc)
    }
  }

  add(left, right, node) {
    if (typeof left === 'number' && typeof right === 'number') {
      return left + right
    }
    if (typeof left === 'string' && typeof right === 'string') {
      return left + right
    }
    if (typeof left === 'string' && typeof right === 'number') {
      return left + toDisplay(right)
    }
    if (typeof left === 'number' && typeof right === 'string') {
      return toDisplay(left) + right
    }
    throw this.error(
      'TypeError',
      `Cannot add ${typeName(left)} and ${typeName(right)}.`,
      this.addHint(left, right),
      node.loc
    )
  }

  addHint(left, right) {
    if (typeof left === 'string' && right && right._type === 'list') {
      return 'Convert the list first with list.join(", ").'
    }
    if (left && left._type === 'list' && typeof right === 'string') {
      return 'Convert the list first with list.join(", ").'
    }
    return `Use to_text() to convert values before adding.`
  }

  divide(left, right, node) {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw this.error('TypeError', `Cannot divide ${typeName(left)} by ${typeName(right)}.`, null, node.loc)
    }
    if (right === 0) {
      throw this.error('MathError', 'Cannot divide by zero.', null, node.loc)
    }
    return left / right
  }

  numOp(left, right, fn, opName, node) {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw this.error('TypeError', `Cannot use '${opName}' with ${typeName(left)} and ${typeName(right)}.`, 'Both sides must be numbers.', node.loc)
    }
    return fn(left, right)
  }

  compare(left, right, fn, opName, node) {
    if (typeof left === 'number' && typeof right === 'number') return fn(left, right)
    if (typeof left === 'string' && typeof right === 'string') return fn(left, right)
    throw this.error('TypeError', `Cannot compare ${typeName(left)} and ${typeName(right)} with '${opName}'.`, null, node.loc)
  }

  evalUnary(node) {
    const operand = this.evaluate(node.operand)

    switch (node.operator) {
      case '-':
        if (typeof operand !== 'number') {
          throw this.error('TypeError', `Cannot negate ${typeName(operand)}.`, 'Only numbers can be negated.', node.loc)
        }
        return -operand

      case 'not':
        return !isTruthy(operand)

      case 'size of':
        if (typeof operand === 'string') return operand.length
        if (operand && operand._type === 'list') return operand.elements.length
        if (operand && operand._type === 'map') return operand.entries.size
        throw this.error('TypeError', `Cannot get size of ${typeName(operand)}.`, "'size of' works on text, list, and map.", node.loc)

      default:
        throw this.error('RuntimeError', `Unknown unary operator '${node.operator}'.`, null, node.loc)
    }
  }

  evalListLit(node) {
    const elements = node.elements.map(e => this.evaluate(e))
    return { _type: 'list', elements }
  }

  evalMapLit(node) {
    const entries = new Map()
    for (const pair of node.pairs) {
      const key = this.evaluate(pair.key)
      const value = this.evaluate(pair.value)
      entries.set(key, value)
    }
    return { _type: 'map', entries }
  }

  evalIndex(node) {
    const obj = this.evaluate(node.object)
    const idx = this.evaluate(node.index)

    if (typeof obj === 'string') {
      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw this.error('TypeError', `Text index must be an integer, got ${typeName(idx)}.`, null, node.loc)
      }
      let index = idx
      if (index < 0) index = obj.length + index
      if (index < 0 || index >= obj.length) {
        throw this.error('IndexError', `Index ${idx} out of bounds for text of length ${obj.length}.`, null, node.loc)
      }
      return obj[index]
    }

    if (obj && obj._type === 'list') {
      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw this.error('TypeError', `List index must be an integer, got ${typeName(idx)}.`, null, node.loc)
      }
      let index = idx
      if (index < 0) index = obj.elements.length + index
      if (index < 0 || index >= obj.elements.length) {
        throw this.error('IndexError', `Index ${idx} out of bounds for list of size ${obj.elements.length}.`, null, node.loc)
      }
      return obj.elements[index]
    }

    if (obj && obj._type === 'map') {
      if (obj.entries.has(idx)) return obj.entries.get(idx)
      return null
    }

    throw this.error('TypeError', `Cannot index into ${typeName(obj)}.`, null, node.loc)
  }

  evalInterpolation(node) {
    return node.parts.map(part => {
      const val = this.evaluate(part)
      return toDisplay(val)
    }).join('')
  }

  // --- Error helper ---

  error(kind, message, hint, loc) {
    return new RuntimeError(kind, message, hint, loc)
  }
}
