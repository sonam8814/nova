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

// --- Statement nodes ---

export function Program(body, loc) {
  return node('Program', { body }, loc)
}

export function Declare(name, value, isConstant, typeHint, loc) {
  return node('Declare', { name, value, isConstant, typeHint }, loc)
}

export function Assign(target, value, loc) {
  return node('Assign', { target, value }, loc)
}

export function Show(expressions, loc) {
  return node('Show', { expressions }, loc)
}

export function If(branches, otherwise, loc) {
  return node('If', { branches, otherwise }, loc)
}

export function While(condition, body, loc) {
  return node('While', { condition, body }, loc)
}

export function Repeat(count, name, body, loc) {
  return node('Repeat', { count, name, body }, loc)
}

export function Count(name, from, to, by, isDown, body, loc) {
  return node('Count', { name, from, to, by, isDown, body }, loc)
}

export function ForEach(keyName, valueName, iterable, body, loc) {
  return node('ForEach', { keyName, valueName, iterable, body }, loc)
}

export function Forever(body, loc) {
  return node('Forever', { body }, loc)
}

export function FuncDecl(name, params, returnType, body, loc) {
  return node('FuncDecl', { name, params, returnType, body }, loc)
}

export function Return(value, loc) {
  return node('Return', { value }, loc)
}

export function Skip(loc) {
  return node('Skip', {}, loc)
}

export function Stop(loc) {
  return node('Stop', {}, loc)
}

export function ExprStmt(expression, loc) {
  return node('ExprStmt', { expression }, loc)
}

export function ClassDecl(name, superclass, fields, methods, loc) {
  return node('ClassDecl', { name, superclass, fields, methods }, loc)
}

export function FieldDecl(name, typeHint, defaultValue, loc) {
  return node('FieldDecl', { name, typeHint, defaultValue }, loc)
}
