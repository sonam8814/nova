export class Environment {
  constructor(parent = null) {
    this.parent = parent
    this.values = new Map()
    this.constants = new Set()
    this.types = new Map()
  }

  declare(name, value, { constant = false, type = null } = {}) {
    if (this.values.has(name)) {
      throw this.makeError('NameError', `'${name}' is already declared in this scope.`)
    }
    this.values.set(name, value)
    if (constant) this.constants.add(name)
    if (type) this.types.set(name, type)
  }

  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name)
    }
    if (this.parent) {
      return this.parent.get(name)
    }
    const suggestion = this.suggest(name)
    const hint = suggestion
      ? `Did you mean '${suggestion}'?`
      : null
    throw this.makeError('NameError', `'${name}' is not defined.`, hint)
  }

  assign(name, value) {
    if (this.values.has(name)) {
      if (this.constants.has(name)) {
        throw this.makeError('NameError', `Cannot reassign constant '${name}'.`, `'${name}' was declared with 'constant' and cannot be changed.`)
      }
      this.values.set(name, value)
      return
    }
    if (this.parent) {
      this.parent.assign(name, value)
      return
    }
    const suggestion = this.suggest(name)
    const hint = suggestion
      ? `Did you mean '${suggestion}'? Use 'remember' to declare a new variable.`
      : `Use 'remember ${name} as <value>' to declare it first.`
    throw this.makeError('NameError', `'${name}' is not defined.`, hint)
  }

  has(name) {
    if (this.values.has(name)) return true
    if (this.parent) return this.parent.has(name)
    return false
  }

  getType(name) {
    if (this.types.has(name)) return this.types.get(name)
    if (this.parent) return this.parent.getType(name)
    return null
  }

  isConstant(name) {
    if (this.values.has(name)) return this.constants.has(name)
    if (this.parent) return this.parent.isConstant(name)
    return false
  }

  allNames() {
    const names = new Set(this.values.keys())
    if (this.parent) {
      for (const n of this.parent.allNames()) {
        names.add(n)
      }
    }
    return names
  }

  suggest(name) {
    let best = null
    let bestDist = Infinity
    const threshold = Math.max(2, Math.floor(name.length / 2))

    for (const candidate of this.allNames()) {
      const dist = levenshtein(name, candidate)
      if (dist < bestDist && dist <= threshold) {
        best = candidate
        bestDist = dist
      }
    }
    return best
  }

  makeError(kind, message, hint) {
    const err = new Error(message)
    err.kind = kind
    err.hint = hint || null
    return err
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
