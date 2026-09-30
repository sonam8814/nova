import { novaError } from './errors.js'
import { TYPE_NAMES } from './tokens.js'

const GLOBAL_NAMES = new Set([
  'show', 'ask', 'files',
  'to_number', 'to_text', 'to_truth', 'type_of', 'same',
  'abs', 'min', 'max', 'floor', 'ceil', 'round',
  'sqrt', 'power', 'random', 'random_between',
  'range', 'sleep', 'time_now',
  '__save__', '__delete_file__',
])

export class Resolver {
  constructor(fileName = 'unknown') {
    this.fileName = fileName
    this.errors = []
    this.scopes = []
    this.functionDepth = 0
    this.classDepth = 0
    this.loopDepth = 0
    this.hasWildcardImport = false

    this.pushScope()
    for (const name of GLOBAL_NAMES) {
      this.currentScope().set(name, true)
    }
  }

  resolve(program) {
    this.resolveBlock(program.body)
    return this.errors
  }

  // --- Scope helpers ---

  pushScope() {
    this.scopes.push(new Map())
  }

  popScope() {
    this.scopes.pop()
  }

  currentScope() {
    return this.scopes[this.scopes.length - 1]
  }

  declare(name, loc) {
    const scope = this.currentScope()
    if (scope.has(name)) {
      this.report(loc, `'${name}' is already declared in this scope.`)
      return
    }
    scope.set(name, true)
  }

  isDeclared(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) return true
    }
    return false
  }

  suggest(name) {
    let best = null
    let bestDist = Infinity
    const threshold = Math.max(2, Math.floor(name.length / 2))

    for (let i = this.scopes.length - 1; i >= 0; i--) {
      for (const candidate of this.scopes[i].keys()) {
        const dist = levenshtein(name, candidate)
        if (dist < bestDist && dist <= threshold) {
          best = candidate
          bestDist = dist
        }
      }
    }
    return best
  }

  report(loc, message, hint) {
    this.errors.push(novaError('NameError', message, {
      hint: hint || null,
      file: this.fileName,
      line: loc ? loc.line : null,
      column: loc ? loc.column : null,
    }))
  }

  // --- Block resolution with hoisting ---

  resolveBlock(stmts) {
    this.hoistDeclarations(stmts)
    let unreachable = false
    for (const stmt of stmts) {
      if (unreachable) {
        this.report(stmt.loc, 'Unreachable code after this point.', 'This code will never execute because of a previous give back or stop.')
        break
      }
      this.resolveStmt(stmt)
      if (stmt.type === 'Return' || stmt.type === 'Stop') {
        unreachable = true
      }
    }
  }

  hoistDeclarations(stmts) {
    for (const stmt of stmts) {
      if (stmt.type === 'FuncDecl') {
        this.declare(stmt.name, stmt.loc)
      }
      if (stmt.type === 'ClassDecl') {
        this.declare(stmt.name, stmt.loc)
      }
    }
  }

  // --- Statement resolution ---

  resolveStmt(stmt) {
    switch (stmt.type) {
      case 'Declare': return this.resolveDeclare(stmt)
      case 'Assign': return this.resolveAssign(stmt)
      case 'Show': return this.resolveShow(stmt)
      case 'If': return this.resolveIf(stmt)
      case 'While': return this.resolveWhile(stmt)
      case 'Repeat': return this.resolveRepeat(stmt)
      case 'Count': return this.resolveCount(stmt)
      case 'ForEach': return this.resolveForEach(stmt)
      case 'Forever': return this.resolveForever(stmt)
      case 'FuncDecl': return this.resolveFuncDecl(stmt)
      case 'ClassDecl': return this.resolveClassDecl(stmt)
      case 'Return': return this.resolveReturn(stmt)
      case 'Raise': return this.resolveRaise(stmt)
      case 'Attempt': return this.resolveAttempt(stmt)
      case 'Use': return this.resolveUse(stmt)
      case 'ExprStmt': return this.resolveExpr(stmt.expression)
      case 'Skip':
      case 'Stop':
        return
      default:
        return
    }
  }

  resolveDeclare(node) {
    this.resolveExpr(node.value)
    this.declare(node.name, node.loc)
  }

  resolveAssign(node) {
    this.resolveExpr(node.value)
    this.resolveAssignTarget(node.target)
  }

  resolveAssignTarget(target) {
    if (target.type === 'Ident') {
      if (target.name !== 'my') {
        this.resolveNameUse(target.name, target.loc)
      }
      return
    }
    if (target.type === 'Property') {
      if (target.object.type === 'Ident' && target.object.name === 'my') {
        if (this.classDepth === 0) {
          this.report(target.object.loc, "'my' can only be used inside a class method.", "Move this inside a 'describe' block's method.")
        }
        return
      }
      this.resolveExpr(target.object)
      return
    }
    if (target.type === 'Index') {
      this.resolveExpr(target.object)
      this.resolveExpr(target.index)
      return
    }
  }

  resolveShow(node) {
    for (const expr of node.expressions) {
      this.resolveExpr(expr)
    }
  }

  resolveIf(node) {
    for (const branch of node.branches) {
      this.resolveExpr(branch.condition)
      this.pushScope()
      this.resolveBlock(branch.body)
      this.popScope()
    }
    if (node.otherwise) {
      this.pushScope()
      this.resolveBlock(node.otherwise)
      this.popScope()
    }
  }

  resolveWhile(node) {
    this.resolveExpr(node.condition)
    this.loopDepth++
    this.pushScope()
    this.resolveBlock(node.body)
    this.popScope()
    this.loopDepth--
  }

  resolveRepeat(node) {
    this.resolveExpr(node.count)
    this.loopDepth++
    this.pushScope()
    if (node.name) {
      this.declare(node.name, node.loc)
    }
    this.resolveBlock(node.body)
    this.popScope()
    this.loopDepth--
  }

  resolveCount(node) {
    this.resolveExpr(node.from)
    this.resolveExpr(node.to)
    if (node.by) this.resolveExpr(node.by)
    this.loopDepth++
    this.pushScope()
    this.declare(node.name, node.loc)
    this.resolveBlock(node.body)
    this.popScope()
    this.loopDepth--
  }

  resolveForEach(node) {
    this.resolveExpr(node.iterable)
    this.loopDepth++
    this.pushScope()
    this.declare(node.keyName, node.loc)
    if (node.valueName) {
      this.declare(node.valueName, node.loc)
    }
    this.resolveBlock(node.body)
    this.popScope()
    this.loopDepth--
  }

  resolveForever(node) {
    this.loopDepth++
    this.pushScope()
    this.resolveBlock(node.body)
    this.popScope()
    this.loopDepth--
  }

  resolveFuncDecl(node) {
    this.functionDepth++
    this.pushScope()
    for (const param of node.params) {
      this.declare(param.name, param.loc)
      if (param.default) {
        this.resolveExpr(param.default)
      }
    }
    this.resolveBlock(node.body)
    this.popScope()
    this.functionDepth--
  }

  resolveClassDecl(node) {
    if (node.superclass) {
      this.resolveNameUse(node.superclass, node.loc)
    }

    this.classDepth++
    this.pushScope()
    this.currentScope().set('my', true)
    this.currentScope().set('parent', true)

    for (const field of node.fields) {
      if (field.defaultValue) {
        this.resolveExpr(field.defaultValue)
      }
    }

    for (const method of node.methods) {
      this.resolveFuncDecl(method)
    }

    this.popScope()
    this.classDepth--
  }

  resolveReturn(node) {
    if (this.functionDepth === 0) {
      this.report(node.loc, "'give back' can only be used inside a function.", "Move this inside a 'define' block or an 'action'.")
    }
    if (node.value) {
      this.resolveExpr(node.value)
    }
  }

  resolveRaise(node) {
    this.resolveExpr(node.expression)
  }

  resolveUse(node) {
    if (node.alias) {
      this.declare(node.alias, node.loc)
    } else {
      this.hasWildcardImport = true
    }
  }

  resolveAttempt(node) {
    this.pushScope()
    this.resolveBlock(node.body)
    this.popScope()

    this.pushScope()
    this.declare(node.rescueName, node.loc)
    this.resolveBlock(node.rescueBody)
    this.popScope()

    if (node.alwaysBody) {
      this.pushScope()
      this.resolveBlock(node.alwaysBody)
      this.popScope()
    }
  }

  // --- Expression resolution ---

  resolveExpr(node) {
    if (!node) return

    switch (node.type) {
      case 'Num':
      case 'Text':
      case 'Bool':
      case 'Nothing':
        return

      case 'Ident':
        this.resolveNameUse(node.name, node.loc)
        return

      case 'Binary':
        this.resolveExpr(node.left)
        if (node.operator === 'is a') {
          this.resolveExpr(node.right)
        } else {
          this.resolveExpr(node.right)
        }
        return

      case 'Unary':
        this.resolveExpr(node.operand)
        return

      case 'Grouping':
        this.resolveExpr(node.expression)
        return

      case 'ListLit':
        for (const el of node.elements) {
          this.resolveExpr(el)
        }
        return

      case 'MapLit':
        for (const pair of node.pairs) {
          this.resolveExpr(pair.key)
          this.resolveExpr(pair.value)
        }
        return

      case 'Index':
        this.resolveExpr(node.object)
        this.resolveExpr(node.index)
        return

      case 'Property':
        if (node.object.type === 'Ident' && node.object.name === 'parent') {
          if (this.classDepth === 0) {
            this.report(node.object.loc, "'parent' can only be used inside a class method.", "Move this inside a 'describe' block's method.")
          }
          return
        }
        this.resolveExpr(node.object)
        return

      case 'Call':
        this.resolveExpr(node.callee)
        for (const arg of node.args) {
          this.resolveExpr(arg)
        }
        return

      case 'Action':
        this.functionDepth++
        this.pushScope()
        for (const param of node.params) {
          this.declare(param.name, param.loc)
          if (param.default) {
            this.resolveExpr(param.default)
          }
        }
        this.resolveBlock(node.body)
        this.popScope()
        this.functionDepth--
        return

      case 'New':
        this.resolveNameUse(node.className, node.loc)
        for (const arg of node.args) {
          this.resolveExpr(arg)
        }
        return

      case 'Interpolation':
        for (const part of node.parts) {
          this.resolveExpr(part)
        }
        return

      default:
        return
    }
  }

  resolveNameUse(name, loc) {
    if (name === 'my') {
      if (this.classDepth === 0) {
        this.report(loc, "'my' can only be used inside a class method.", "Move this inside a 'describe' block's method.")
      }
      return
    }
    if (name === 'parent') {
      if (this.classDepth === 0) {
        this.report(loc, "'parent' can only be used inside a class method.", "Move this inside a 'describe' block's method.")
      }
      return
    }
    if (this.isDeclared(name)) return
    if (TYPE_NAMES.has(name)) return
    if (this.hasWildcardImport) return

    const suggestion = this.suggest(name)
    const hint = suggestion ? `Did you mean '${suggestion}'?` : null
    this.report(loc, `'${name}' is not defined.`, hint)
  }
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        )
      }
    }
  }
  return matrix[b.length][a.length]
}
