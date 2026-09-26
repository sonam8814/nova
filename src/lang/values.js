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
  return 'nothing'
}

export function toDisplay(v) {
  if (v === null || v === undefined) return 'nothing'
  if (typeof v === 'number') return numberToDisplay(v)
  if (typeof v === 'string') return v
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (v._type === 'list') return listToDisplay(v)
  if (v._type === 'map') return mapToDisplay(v)
  if (v._type === 'function') return `<action ${v.name || 'anonymous'}>`
  if (v._type === 'instance') {
    if (v.methods && v.methods.has('to_text')) {
      return v.methods.get('to_text')()
    }
    return `<${v.className}>`
  }
  if (v._type === 'class') return `<class ${v.name}>`
  return String(v)
}

function numberToDisplay(n) {
  if (Object.is(n, -0)) return '0'
  return String(n)
}

function listToDisplay(list) {
  const items = list.elements.map(el => displayElement(el))
  return `[${items.join(', ')}]`
}

function mapToDisplay(map) {
  const entries = []
  for (const [k, v] of map.entries) {
    const key = typeof k === 'string' ? `"${k}"` : toDisplay(k)
    entries.push(`${key}: ${displayElement(v)}`)
  }
  return `{${entries.join(', ')}}`
}

function displayElement(v) {
  if (typeof v === 'string') return `"${v}"`
  return toDisplay(v)
}

export function isTruthy(v) {
  if (v === null || v === undefined) return false
  if (v === false) return false
  if (v === 0) return false
  if (v === '') return false
  return true
}

export function novaFunction(name, params, returnType, body, closure) {
  return {
    _type: 'function',
    name: name || null,
    params,
    returnType: returnType || null,
    body,
    closure,
    boundThis: null,
    declaringClass: null,
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
