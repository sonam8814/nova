function node(type, fields, loc) {
  return { type, ...fields, loc }
}

export function Num(value, loc) {
  return node('Num', { value }, loc)
}

export function Text(value, loc) {
  return node('Text', { value }, loc)
}

export function Bool(value, loc) {
  return node('Bool', { value }, loc)
}

export function Nothing(loc) {
  return node('Nothing', {}, loc)
}

export function Ident(name, loc) {
  return node('Ident', { name }, loc)
}

export function Binary(left, operator, right, loc) {
  return node('Binary', { left, operator, right }, loc)
}

export function Unary(operator, operand, loc) {
  return node('Unary', { operator, operand }, loc)
}

export function Grouping(expression, loc) {
  return node('Grouping', { expression }, loc)
}

export function ListLit(elements, loc) {
  return node('ListLit', { elements }, loc)
}

export function MapLit(pairs, loc) {
  return node('MapLit', { pairs }, loc)
}

export function Index(object, index, loc) {
  return node('Index', { object, index }, loc)
}

export function Property(object, name, loc) {
  return node('Property', { object, name }, loc)
}

export function Call(callee, args, loc) {
  return node('Call', { callee, args }, loc)
}

export function Interpolation(parts, loc) {
  return node('Interpolation', { parts }, loc)
}
