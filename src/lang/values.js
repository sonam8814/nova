export function typeName(v) {
  if (v === null || v === undefined) return 'nothing'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'string') return 'text'
  if (typeof v === 'boolean') return 'truth'
  if (v._type === 'list') return 'list'
  if (v._type === 'map') return 'map'
  if (v._type === 'function') return 'action'
  if (v._type === 'instance') return v.className
  if (v._type === 'class') return 'class'
  if (v._type === 'namespace') return 'namespace'
  return 'nothing'
}

export function toDisplay(v, callToText) {
  if (v === null || v === undefined) return 'nothing'
  if (typeof v === 'number') return numberToDisplay(v)
  if (typeof v === 'string') return v
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (v._type === 'list') return listToDisplay(v, callToText)
  if (v._type === 'map') return mapToDisplay(v, callToText)
  if (v._type === 'function') return `<action ${v.name || 'anonymous'}>`
  if (v._type === 'instance') {
    if (callToText) {
      const result = callToText(v)
      if (result !== undefined) return result
    }
    return `<${v.className}>`
  }
  if (v._type === 'class') return `<class ${v.name}>`
  if (v._type === 'namespace') return `<module ${v.name}>`
  return String(v)
}

function numberToDisplay(n) {
  if (Object.is(n, -0)) return '0'
  return String(n)
}

function listToDisplay(list, callToText) {
  const items = list.elements.map(el => displayElement(el, callToText))
  return `[${items.join(', ')}]`
}

function mapToDisplay(map, callToText) {
  const entries = []
  for (const [k, v] of map.entries) {
    const key = typeof k === 'string' ? `"${k}"` : toDisplay(k, callToText)
    entries.push(`${key}: ${displayElement(v, callToText)}`)
  }
  return `{${entries.join(', ')}}`
}

function displayElement(v, callToText) {
  if (typeof v === 'string') return `"${v}"`
  return toDisplay(v, callToText)
}

export function isTruthy(v) {
  if (v === null || v === undefined) return false
  if (v === false) return false
  if (v === 0) return false
  if (v === '') return false
  return true
}

export function novaFunction(name, params, returnType, body, closure) {
  const required = params.filter(p => p.default === null).length
  return {
    _type: 'function',
    name: name || null,
    params,
    returnType: returnType || null,
    body,
    closure,
    boundThis: null,
    declaringClass: null,
    _arity: required,
    _maxArity: params.length,
  }
}

export function novaClass(name, superclass, fields, methods) {
  return {
    _type: 'class',
    name,
    superclass: superclass || null,
    fields,
    methods,
  }
}

export function novaInstance(klass) {
  return {
    _type: 'instance',
    className: klass.name,
    klass,
    fields: new Map(),
  }
}

export function serializeScopes(env, maxDepth = 3) {
  const scopes = []
  let current = env
  let depth = 0
  while (current && depth < 10) {
    const vars = {}
    for (const [name, value] of current.values) {
      if (name.startsWith('__')) continue
      vars[name] = serializeValue(value, maxDepth)
    }
    if (Object.keys(vars).length > 0) {
      scopes.push({ name: depth === 0 ? 'local' : `scope ${depth}`, vars })
    }
    current = current.parent
    depth++
  }
  return scopes
}

function serializeValue(v, depth) {
  if (depth <= 0) return { type: typeName(v), display: '...' }
  if (v === null || v === undefined) return { type: 'nothing', display: 'nothing' }
  if (typeof v === 'number') return { type: 'number', display: String(v) }
  if (typeof v === 'string') return { type: 'text', display: v.length > 100 ? `"${v.slice(0, 100)}..."` : `"${v}"` }
  if (typeof v === 'boolean') return { type: 'truth', display: v ? 'yes' : 'no' }
  if (v._type === 'list') {
    if (v.elements.length > 20) {
      return { type: 'list', display: `[${v.elements.length} items]` }
    }
    const items = v.elements.map(el => serializeValue(el, depth - 1).display)
    return { type: 'list', display: `[${items.join(', ')}]` }
  }
  if (v._type === 'map') {
    if (v.entries.size > 20) {
      return { type: 'map', display: `{${v.entries.size} entries}` }
    }
    const pairs = []
    for (const [k, val] of v.entries) {
      const key = typeof k === 'string' ? `"${k}"` : String(k)
      pairs.push(`${key}: ${serializeValue(val, depth - 1).display}`)
    }
    return { type: 'map', display: `{${pairs.join(', ')}}` }
  }
  if (v._type === 'function') return { type: 'action', display: `<action ${v.name || 'anonymous'}>` }
  if (v._type === 'instance') return { type: v.className, display: `<${v.className}>` }
  if (v._type === 'class') return { type: 'class', display: `<class ${v.name}>` }
  if (v._type === 'namespace') return { type: 'namespace', display: `<module ${v.name}>` }
  return { type: 'unknown', display: String(v) }
}
