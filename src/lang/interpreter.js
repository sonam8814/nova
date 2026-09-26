import { Environment } from './environment.js'
import { typeName, toDisplay, isTruthy, novaFunction, novaClass } from './values.js'
import { MAX_STEPS, MAX_DEPTH } from './config.js'
import { getListMethod } from './stdlib/list.js'
import { getMapMethod } from './stdlib/map.js'
import { getTextMethod } from './stdlib/text.js'
import { registerGlobals } from './stdlib/globals.js'

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

export class BreakSignal {
  constructor() { this._signal = 'break' }
}

export class ContinueSignal {
  constructor() { this._signal = 'continue' }
}

export class ReturnSignal {
  constructor(value) {
    this._signal = 'return'
    this.value = value
  }
}

export class Interpreter {
  constructor({ output, fileName = 'main.nova' } = {}) {
    this.output = output || (() => {})
    this.fileName = fileName
    this.globals = new Environment()
    this.env = this.globals
    this.steps = 0
    this.callStack = []
    this.depth = 0
    registerGlobals(this.globals, (kind, msg, hint, loc) => this.error(kind, msg, hint, loc))
  }

  run(program) {
    this.hoistFunctions(program.body)
    for (const stmt of program.body) {
      this.execute(stmt)
    }
  }

  checkStepLimit(loc) {
    this.steps++
    if (this.steps > MAX_STEPS) {
      throw this.error(
        'RuntimeError',
        'This program ran too long — check for a loop that never ends.',
        null,
        loc
      )
    }
  }

  execute(node) {
    switch (node.type) {
      case 'Program': return this.run(node)
      case 'Declare': return this.execDeclare(node)
      case 'Assign': return this.execAssign(node)
      case 'Show': return this.execShow(node)
      case 'If': return this.execIf(node)
      case 'While': return this.execWhile(node)
      case 'Repeat': return this.execRepeat(node)
      case 'Count': return this.execCount(node)
      case 'ForEach': return this.execForEach(node)
      case 'Forever': return this.execForever(node)
      case 'FuncDecl': return this.execFuncDecl(node)
      case 'ClassDecl': return this.execClassDecl(node)
      case 'Return': return this.execReturn(node)
      case 'Skip': throw new ContinueSignal()
      case 'Stop': throw new BreakSignal()
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
      case 'Property': return this.evalProperty(node)
      case 'Call': return this.evalCall(node)
      case 'Action': return this.evalAction(node)
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

  execIf(node) {
    for (const branch of node.branches) {
      const condition = this.evaluate(branch.condition)
      if (isTruthy(condition)) {
        this.executeBlock(branch.body)
        return
      }
    }
    if (node.otherwise) {
      this.executeBlock(node.otherwise)
    }
  }

  execWhile(node) {
    while (isTruthy(this.evaluate(node.condition))) {
      this.checkStepLimit(node.loc)
      try {
        this.executeBlock(node.body)
      } catch (e) {
        if (e instanceof BreakSignal) break
        if (e instanceof ContinueSignal) continue
        throw e
      }
    }
  }

  execRepeat(node) {
    const count = this.evaluate(node.count)
    if (typeof count !== 'number' || !Number.isInteger(count)) {
      throw this.error('TypeError', `Repeat count must be an integer, got ${typeName(count)}.`, null, node.loc)
    }
    const loopEnv = new Environment(this.env)
    const prevEnv = this.env
    this.env = loopEnv
    try {
      for (let i = 0; i < count; i++) {
        this.checkStepLimit(node.loc)
        if (node.name) {
          if (i === 0) {
            loopEnv.declare(node.name, i, {})
          } else {
            loopEnv.assign(node.name, i)
          }
        }
        try {
          this.executeBlock(node.body)
        } catch (e) {
          if (e instanceof BreakSignal) break
          if (e instanceof ContinueSignal) continue
          throw e
        }
      }
    } finally {
      this.env = prevEnv
    }
  }

  execCount(node) {
    const from = this.evaluate(node.from)
    const to = this.evaluate(node.to)
    const by = node.by ? this.evaluate(node.by) : 1

    if (typeof from !== 'number') throw this.error('TypeError', `Count 'from' must be a number, got ${typeName(from)}.`, null, node.loc)
    if (typeof to !== 'number') throw this.error('TypeError', `Count 'to' must be a number, got ${typeName(to)}.`, null, node.loc)
    if (typeof by !== 'number' || by <= 0) throw this.error('TypeError', `Count 'by' must be a positive number.`, null, node.loc)

    const loopEnv = new Environment(this.env)
    const prevEnv = this.env
    this.env = loopEnv
    loopEnv.declare(node.name, from, {})

    try {
      if (node.isDown) {
        for (let i = from; i >= to; i -= by) {
          this.checkStepLimit(node.loc)
          loopEnv.assign(node.name, i)
          try {
            this.executeBlock(node.body)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
      } else {
        for (let i = from; i <= to; i += by) {
          this.checkStepLimit(node.loc)
          loopEnv.assign(node.name, i)
          try {
            this.executeBlock(node.body)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
      }
    } finally {
      this.env = prevEnv
    }
  }

  execForEach(node) {
    const iterable = this.evaluate(node.iterable)
    const loopEnv = new Environment(this.env)
    const prevEnv = this.env
    this.env = loopEnv

    let items

    if (typeof iterable === 'string') {
      items = iterable.split('').map(ch => [ch])
    } else if (iterable && iterable._type === 'list') {
      items = iterable.elements.map(el => [el])
    } else if (iterable && iterable._type === 'map') {
      if (node.valueName) {
        items = []
        for (const [k, v] of iterable.entries) {
          items.push([k, v])
        }
      } else {
        items = []
        for (const k of iterable.entries.keys()) {
          items.push([k])
        }
      }
    } else {
      throw this.error('TypeError', `Cannot iterate over ${typeName(iterable)}.`, "'for each' works on text, list, and map.", node.loc)
    }

    let first = true
    try {
      for (const vals of items) {
        this.checkStepLimit(node.loc)
        if (first) {
          loopEnv.declare(node.keyName, vals[0], {})
          if (node.valueName) {
            loopEnv.declare(node.valueName, vals[1], {})
          }
          first = false
        } else {
          loopEnv.assign(node.keyName, vals[0])
          if (node.valueName) {
            loopEnv.assign(node.valueName, vals[1])
          }
        }
        try {
          this.executeBlock(node.body)
        } catch (e) {
          if (e instanceof BreakSignal) break
          if (e instanceof ContinueSignal) continue
          throw e
        }
      }
    } finally {
      this.env = prevEnv
    }
  }

  execForever(node) {
    while (true) {
      this.checkStepLimit(node.loc)
      try {
        this.executeBlock(node.body)
      } catch (e) {
        if (e instanceof BreakSignal) break
        if (e instanceof ContinueSignal) continue
        throw e
      }
    }
  }

  executeBlock(body) {
    this.hoistFunctions(body)
    for (const stmt of body) {
      this.execute(stmt)
    }
  }

  hoistFunctions(stmts) {
    for (const stmt of stmts) {
      if (stmt.type === 'FuncDecl') {
        const fn = novaFunction(stmt.name, stmt.params, stmt.returnType, stmt.body, this.env)
        this.env.declare(stmt.name, fn, {})
      }
      if (stmt.type === 'ClassDecl') {
        this.execClassDecl(stmt)
      }
    }
  }

  execFuncDecl(_node) {
    // Already hoisted — nothing to do at execution time
  }

  execClassDecl(node) {
    if (this.env.has(node.name) && this.env.values.has(node.name)) {
      return
    }

    let superclass = null
    if (node.superclass) {
      try {
        superclass = this.env.get(node.superclass)
      } catch (e) {
        if (e.kind) {
          throw this.error(e.kind, e.message, e.hint, node.loc)
        }
        throw e
      }
      if (!superclass || superclass._type !== 'class') {
        throw this.error('TypeError', `'${node.superclass}' is not a class.`, null, node.loc)
      }
    }

    const methods = new Map()
    const klass = novaClass(node.name, superclass, node.fields, methods)

    for (const method of node.methods) {
      const fn = novaFunction(method.name, method.params, method.returnType, method.body, this.env)
      fn.declaringClass = klass
      methods.set(method.name, fn)
    }

    this.env.declare(node.name, klass, {})
  }

  execReturn(node) {
    const value = node.value ? this.evaluate(node.value) : null
    throw new ReturnSignal(value)
  }

  evalCall(node) {
    const callee = this.evaluate(node.callee)
    const args = node.args.map(a => this.evaluate(a))

    if (!callee || callee._type !== 'function') {
      throw this.error('TypeError', `'${toDisplay(callee)}' is not callable.`, null, node.loc)
    }

    if (callee._native) {
      return callee._native(args)
    }

    return this.callFunction(callee, args, node.loc)
  }

  callFunction(fn, args, loc) {
    if (fn._native) {
      return fn._native(args)
    }

    const required = fn.params.filter(p => p.default === null).length
    const total = fn.params.length

    if (args.length < required || args.length > total) {
      const name = fn.name || 'anonymous action'
      if (required === total) {
        throw this.error('TypeError', `'${name}' expects ${total} argument(s), got ${args.length}.`, null, loc)
      } else {
        throw this.error('TypeError', `'${name}' expects ${required} to ${total} argument(s), got ${args.length}.`, null, loc)
      }
    }

    this.depth++
    if (this.depth > MAX_DEPTH) {
      throw this.error('DepthError', `Maximum call depth of ${MAX_DEPTH} exceeded.`, 'Check for infinite recursion.', loc)
    }

    const callEnv = new Environment(fn.closure)

    for (let i = 0; i < fn.params.length; i++) {
      const param = fn.params[i]
      const value = i < args.length ? args[i] : this.evaluate(param.default)
      callEnv.declare(param.name, value, {})
    }

    const frame = { name: fn.name || '<anonymous>', file: this.fileName, line: loc ? loc.line : null }
    this.callStack.push(frame)

    const prevEnv = this.env
    this.env = callEnv
    let result = null

    try {
      this.executeBlock(fn.body)
    } catch (e) {
      if (e instanceof ReturnSignal) {
        result = e.value
      } else {
        throw e
      }
    } finally {
      this.env = prevEnv
      this.depth--
      this.callStack.pop()
    }

    return result
  }

  evalAction(node) {
    return novaFunction(null, node.params, null, node.body, this.env)
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

  evalProperty(node) {
    const obj = this.evaluate(node.object)

    if (obj && obj._type === 'list') {
      const method = getListMethod(
        obj, node.name,
        (fn, args, loc) => this.callFunction(fn, args, loc),
        (kind, msg, hint, loc) => this.error(kind, msg, hint, loc),
        node.loc
      )
      if (method) return method
      throw this.error('NameError', `List has no method '${node.name}'.`, null, node.loc)
    }

    if (obj && obj._type === 'map') {
      const method = getMapMethod(
        obj, node.name,
        (kind, msg, hint, loc) => this.error(kind, msg, hint, loc),
        node.loc
      )
      if (method) return method
      throw this.error('NameError', `Map has no method '${node.name}'.`, null, node.loc)
    }

    if (typeof obj === 'string') {
      const method = getTextMethod(
        obj, node.name,
        (kind, msg, hint, loc) => this.error(kind, msg, hint, loc),
        node.loc
      )
      if (method) return method
      throw this.error('NameError', `Text has no method '${node.name}'.`, null, node.loc)
    }

    if (obj && obj._type === 'instance') {
      if (obj.fields.has(node.name)) return obj.fields.get(node.name)
      throw this.error('NameError', `'${obj.className}' has no field '${node.name}'.`, null, node.loc)
    }

    throw this.error('TypeError', `Cannot access property '${node.name}' on ${typeName(obj)}.`, null, node.loc)
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
