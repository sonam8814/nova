import { LANG_NAME } from '../lang/config.js'

const BUILTIN_HOVER = {
  show:           { sig: 'show(value)',                     desc: 'Print a value to the terminal.' },
  ask:            { sig: 'ask(prompt) gives text',          desc: 'Read a line of input from the user. Pauses execution until the user types and presses Enter.' },
  files:          { sig: 'files() gives list',              desc: 'List all file names in the project data store.' },
  to_number:      { sig: 'to_number(value) gives number',  desc: 'Convert text, truth, or nothing to a number. Raises TypeError if conversion fails.' },
  to_text:        { sig: 'to_text(value) gives text',      desc: 'Convert any value to its text representation.' },
  to_truth:       { sig: 'to_truth(value) gives truth',    desc: 'Convert any value to a truth. Only no, nothing, 0, and "" are falsy.' },
  type_of:        { sig: 'type_of(value) gives text',      desc: 'Return the type name of a value as text (e.g. "number", "list", "Dog").' },
  same:           { sig: 'same(a, b) gives truth',         desc: 'Deep equality comparison. Compares lists and maps by value, not identity.' },
  abs:            { sig: 'abs(n) gives number',             desc: 'Absolute value of a number.' },
  min:            { sig: 'min(a, b, ...) gives number',    desc: 'Return the smallest of the given numbers.' },
  max:            { sig: 'max(a, b, ...) gives number',    desc: 'Return the largest of the given numbers.' },
  floor:          { sig: 'floor(n) gives number',           desc: 'Round down to the nearest integer.' },
  ceil:           { sig: 'ceil(n) gives number',            desc: 'Round up to the nearest integer.' },
  round:          { sig: 'round(n, places?) gives number', desc: 'Round to the nearest integer, or to a number of decimal places.' },
  sqrt:           { sig: 'sqrt(n) gives number',            desc: 'Square root. Raises MathError for negative numbers.' },
  power:          { sig: 'power(base, exp) gives number',  desc: 'Raise base to exponent.' },
  random:         { sig: 'random() gives number',           desc: 'Random number between 0 (inclusive) and 1 (exclusive).' },
  random_between: { sig: 'random_between(lo, hi) gives number', desc: 'Random integer between lo and hi (both inclusive).' },
  range:          { sig: 'range(start, end, step?) gives list', desc: 'Generate a list of numbers from start (inclusive) to end (exclusive).' },
  sleep:          { sig: 'sleep(ms)',                        desc: 'Pause execution for the given number of milliseconds.' },
  time_now:       { sig: 'time_now() gives number',          desc: 'Current time as milliseconds since epoch.' },
}

const KEYWORD_HOVER = {
  remember:  'Declare a new variable.\n\n`remember name as value`\n`remember number x as 5`',
  constant:  'Declare an immutable variable.\n\n`constant MAX as 100`',
  set:       'Reassign an existing variable.\n\n`set name to value`',
  show:      null,
  ask:       null,
  define:    'Declare a function.\n\n`define name with params ... done`',
  describe:  'Declare a class.\n\n`describe Name ... done`\n`describe Child from Parent ... done`',
  attempt:   'Error handling block.\n\n`attempt ... rescue e ... done`',
  raise:     'Throw an error.\n\n`raise "message"`',
  use:       'Import a module.\n\n`use "file"` or `use "file" as name`',
  my:        'Reference to the current instance inside a class method.',
  parent:    'Reference to the superclass, for calling overridden methods.\n\n`parent.setup(args)`',
  yes:       'Truth literal (truthy).',
  no:        'Truth literal (falsy).',
  nothing:   'The absence of a value. Falsy.',
}

function extractFuncInfo(source) {
  const funcs = new Map()

  const regex = /^\s*define\s+([A-Za-z_]\w*)(?:\s+with\s+([^]*?))?\s*(?:gives\s+(\w+))?\s*$/
  const lines = source.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('define ')) continue

    const m = line.match(/^define\s+([A-Za-z_]\w*)(.*)$/)
    if (!m) continue

    const name = m[1]
    const rest = m[2].trim()

    let params = ''
    let gives = ''

    const givesMatch = rest.match(/\bgives\s+(\w+)/)
    if (givesMatch) gives = givesMatch[1]

    const withMatch = rest.match(/^with\s+(.+?)(?:\s+gives\b|$)/)
    if (withMatch) params = withMatch[1].trim()

    funcs.set(name, { params, gives, line: i + 1 })
  }

  return funcs
}

function extractVarInfo(source) {
  const vars = new Map()

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    const m = line.match(/^(remember|constant)\s+(?:(number|text|truth|list|map|action|nothing|anything)\s+)?([A-Za-z_]\w*)\s+as\b/)
    if (m) {
      const kind = m[1]
      const typeHint = m[2] || null
      const name = m[3]
      vars.set(name, { kind, typeHint, line: i + 1 })
    }
  }

  return vars
}

function extractClassInfo(source) {
  const classes = new Map()

  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    const m = line.match(/^describe\s+([A-Za-z_]\w*)(?:\s+from\s+([A-Za-z_]\w*))?/)
    if (m) {
      classes.set(m[1], { superclass: m[2] || null, line: i + 1 })
    }
  }

  return classes
}

export function registerHoverProvider(monaco) {
  return monaco.languages.registerHoverProvider(LANG_NAME, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const name = word.word
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      }

      if (BUILTIN_HOVER[name]) {
        const info = BUILTIN_HOVER[name]
        return {
          range,
          contents: [
            { value: `**${info.sig}**` },
            { value: info.desc },
          ],
        }
      }

      if (name in KEYWORD_HOVER && KEYWORD_HOVER[name] !== null) {
        return {
          range,
          contents: [
            { value: KEYWORD_HOVER[name] },
          ],
        }
      }

      const source = model.getValue()

      const funcs = extractFuncInfo(source)
      if (funcs.has(name)) {
        const info = funcs.get(name)
        let sig = `define ${name}`
        if (info.params) sig += ` with ${info.params}`
        if (info.gives) sig += ` gives ${info.gives}`
        return {
          range,
          contents: [
            { value: `**${sig}**` },
            { value: `Function declared at line ${info.line}` },
          ],
        }
      }

      const vars = extractVarInfo(source)
      if (vars.has(name)) {
        const info = vars.get(name)
        let desc = info.kind === 'constant' ? 'constant' : 'variable'
        if (info.typeHint) desc += ` (${info.typeHint})`
        return {
          range,
          contents: [
            { value: `**${name}** — ${desc}` },
            { value: `Declared at line ${info.line}` },
          ],
        }
      }

      const classes = extractClassInfo(source)
      if (classes.has(name)) {
        const info = classes.get(name)
        let desc = `class ${name}`
        if (info.superclass) desc += ` from ${info.superclass}`
        return {
          range,
          contents: [
            { value: `**${desc}**` },
            { value: `Declared at line ${info.line}` },
          ],
        }
      }

      return null
    }
  })
}
