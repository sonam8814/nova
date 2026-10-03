import { LANG_NAME } from '../lang/config.js'

const BUILTIN_DOCS = {
  show:           { sig: 'show(value)',                     desc: 'Print a value to the terminal' },
  ask:            { sig: 'ask(prompt)',                     desc: 'Read a line of input from the user' },
  files:          { sig: 'files()',                         desc: 'List all file names in the project data store' },
  to_number:      { sig: 'to_number(value)',                desc: 'Convert a value to a number' },
  to_text:        { sig: 'to_text(value)',                  desc: 'Convert a value to text' },
  to_truth:       { sig: 'to_truth(value)',                 desc: 'Convert a value to a truth (yes/no)' },
  type_of:        { sig: 'type_of(value)',                  desc: 'Get the type name of a value' },
  same:           { sig: 'same(a, b)',                      desc: 'Deep equality comparison' },
  abs:            { sig: 'abs(n)',                           desc: 'Absolute value' },
  min:            { sig: 'min(a, b, ...)',                  desc: 'Smallest of the given numbers' },
  max:            { sig: 'max(a, b, ...)',                  desc: 'Largest of the given numbers' },
  floor:          { sig: 'floor(n)',                         desc: 'Round down to nearest integer' },
  ceil:           { sig: 'ceil(n)',                          desc: 'Round up to nearest integer' },
  round:          { sig: 'round(n, places?)',               desc: 'Round to nearest integer or decimal places' },
  sqrt:           { sig: 'sqrt(n)',                          desc: 'Square root' },
  power:          { sig: 'power(base, exp)',                desc: 'Raise base to exponent' },
  random:         { sig: 'random()',                         desc: 'Random number between 0 and 1' },
  random_between: { sig: 'random_between(lo, hi)',          desc: 'Random integer between lo and hi (inclusive)' },
  range:          { sig: 'range(start, end, step?)',        desc: 'Generate a list of numbers' },
  sleep:          { sig: 'sleep(ms)',                        desc: 'Pause execution for milliseconds' },
  time_now:       { sig: 'time_now()',                       desc: 'Milliseconds since epoch' },
}

const BUILTIN_NAMES = new Set(Object.keys(BUILTIN_DOCS))

const KEYWORD_COMPLETIONS = [
  'remember', 'constant', 'set', 'show', 'ask', 'note',
  'check if', 'or if', 'otherwise', 'while', 'repeat', 'count',
  'for each', 'keep going', 'skip', 'stop', 'define', 'describe',
  'attempt', 'raise', 'use', 'save', 'read', 'delete file',
  'give back', 'done', 'new', 'action', 'size of', 'is a',
  'yes', 'no', 'nothing', 'and', 'or', 'not', 'my', 'parent',
]

const KEYWORD_SET = new Set([
  'remember', 'constant', 'set', 'to', 'as', 'show', 'ask', 'note',
  'check', 'if', 'or', 'otherwise', 'while', 'repeat', 'times',
  'count', 'from', 'down', 'by', 'for', 'each', 'in', 'keep', 'going',
  'skip', 'stop', 'define', 'with', 'gives', 'give', 'back', 'action',
  'describe', 'has', 'my', 'parent', 'new', 'is', 'not', 'and',
  'yes', 'no', 'nothing', 'attempt', 'rescue', 'always', 'raise',
  'use', 'save', 'read', 'delete', 'file', 'done', 'size', 'of',
  'number', 'text', 'truth', 'list', 'map', 'anything',
])

const SNIPPETS = [
  {
    label: 'check if',
    detail: 'conditional block',
    insertText: 'check if ${1:condition}\n  $0\ndone',
  },
  {
    label: 'check if ... otherwise',
    detail: 'conditional with else',
    insertText: 'check if ${1:condition}\n  $2\notherwise\n  $0\ndone',
  },
  {
    label: 'while',
    detail: 'while loop',
    insertText: 'while ${1:condition}\n  $0\ndone',
  },
  {
    label: 'repeat',
    detail: 'counted loop',
    insertText: 'repeat ${1:5} times\n  $0\ndone',
  },
  {
    label: 'repeat ... as',
    detail: 'counted loop with index variable',
    insertText: 'repeat ${1:5} times as ${2:i}\n  $0\ndone',
  },
  {
    label: 'count',
    detail: 'range loop',
    insertText: 'count ${1:i} from ${2:0} to ${3:10}\n  $0\ndone',
  },
  {
    label: 'for each',
    detail: 'iterate over a collection',
    insertText: 'for each ${1:item} in ${2:list}\n  $0\ndone',
  },
  {
    label: 'for each ... to',
    detail: 'iterate over map keys and values',
    insertText: 'for each ${1:key} to ${2:value} in ${3:map}\n  $0\ndone',
  },
  {
    label: 'keep going',
    detail: 'infinite loop (exit with stop)',
    insertText: 'keep going\n  $0\ndone',
  },
  {
    label: 'define',
    detail: 'function declaration',
    insertText: 'define ${1:name}\n  $0\ndone',
  },
  {
    label: 'define ... with',
    detail: 'function with parameters',
    insertText: 'define ${1:name} with ${2:params}\n  $0\ndone',
  },
  {
    label: 'describe',
    detail: 'class declaration',
    insertText: 'describe ${1:Name}\n  has ${2:field}\n\n  define setup with ${3:params}\n    $0\n  done\ndone',
  },
  {
    label: 'describe ... from',
    detail: 'class with inheritance',
    insertText: 'describe ${1:Child} from ${2:Parent}\n  define setup with ${3:params}\n    parent.setup($4)\n    $0\n  done\ndone',
  },
  {
    label: 'attempt',
    detail: 'error handling block',
    insertText: 'attempt\n  $0\nrescue ${1:e}\n  show ${1:e}.message\ndone',
  },
  {
    label: 'attempt ... always',
    detail: 'error handling with cleanup',
    insertText: 'attempt\n  $0\nrescue ${1:e}\n  show ${1:e}.message\nalways\n  $2\ndone',
  },
  {
    label: 'action',
    detail: 'anonymous function',
    insertText: 'action with ${1:x}\n  $0\ndone',
  },
  {
    label: 'remember',
    detail: 'declare a variable',
    insertText: 'remember ${1:name} as ${0:value}',
  },
  {
    label: 'constant',
    detail: 'declare an immutable variable',
    insertText: 'constant ${1:NAME} as ${0:value}',
  },
  {
    label: 'set',
    detail: 'reassign a variable',
    insertText: 'set ${1:name} to ${0:value}',
  },
  {
    label: 'use',
    detail: 'import a module',
    insertText: 'use "${1:module}"',
  },
  {
    label: 'use ... as',
    detail: 'import a module with namespace',
    insertText: 'use "${1:module}" as ${0:name}',
  },
  {
    label: 'save ... to',
    detail: 'save text to a file',
    insertText: 'save ${1:content} to "${0:filename}"',
  },
]

const LIST_METHODS = [
  { name: 'add',       sig: 'add(value)',              desc: 'Append a value to the end' },
  { name: 'insert',    sig: 'insert(index, value)',     desc: 'Insert a value at index' },
  { name: 'remove',    sig: 'remove(index)',            desc: 'Remove and return item at index' },
  { name: 'pop',       sig: 'pop()',                    desc: 'Remove and return the last item' },
  { name: 'index_of',  sig: 'index_of(value)',          desc: 'Index of value, or -1 if absent' },
  { name: 'has',       sig: 'has(value)',               desc: 'Check if value is in the list' },
  { name: 'slice',     sig: 'slice(start, end?)',       desc: 'New list from start to end' },
  { name: 'join',      sig: 'join(separator)',          desc: 'Join elements into text' },
  { name: 'reverse',   sig: 'reverse()',                desc: 'New list in reverse order' },
  { name: 'sort',      sig: 'sort()',                   desc: 'New sorted list (numbers or text)' },
  { name: 'sort_by',   sig: 'sort_by(action)',          desc: 'New list sorted by a key function' },
  { name: 'copy',      sig: 'copy()',                   desc: 'Shallow copy of the list' },
  { name: 'map',       sig: 'map(action)',              desc: 'New list with action applied to each item' },
  { name: 'filter',    sig: 'filter(action)',           desc: 'New list with items where action returns yes' },
  { name: 'reduce',    sig: 'reduce(action, initial)',  desc: 'Reduce the list to a single value' },
  { name: 'sum',       sig: 'sum()',                    desc: 'Sum of all numbers' },
  { name: 'min',       sig: 'min()',                    desc: 'Smallest number in the list' },
  { name: 'max',       sig: 'max()',                    desc: 'Largest number in the list' },
  { name: 'all',       sig: 'all(action)',              desc: 'Yes if action returns yes for every item' },
  { name: 'any',       sig: 'any(action)',              desc: 'Yes if action returns yes for any item' },
]

const MAP_METHODS = [
  { name: 'has',       sig: 'has(key)',                 desc: 'Check if key exists' },
  { name: 'keys',      sig: 'keys()',                   desc: 'List of all keys' },
  { name: 'values',    sig: 'values()',                 desc: 'List of all values' },
  { name: 'entries',   sig: 'entries()',                desc: 'List of [key, value] pairs' },
  { name: 'remove',    sig: 'remove(key)',              desc: 'Remove a key and return its value' },
]

const TEXT_METHODS = [
  { name: 'upper',      sig: 'upper()',                  desc: 'Convert to uppercase' },
  { name: 'lower',      sig: 'lower()',                  desc: 'Convert to lowercase' },
  { name: 'trim',       sig: 'trim()',                   desc: 'Remove leading/trailing whitespace' },
  { name: 'split',      sig: 'split(separator)',         desc: 'Split into a list of texts' },
  { name: 'has',        sig: 'has(substring)',            desc: 'Check if text contains substring' },
  { name: 'starts_with', sig: 'starts_with(prefix)',     desc: 'Check if text starts with prefix' },
  { name: 'ends_with',  sig: 'ends_with(suffix)',        desc: 'Check if text ends with suffix' },
  { name: 'replace',    sig: 'replace(target, replacement)', desc: 'Replace all occurrences' },
  { name: 'slice',      sig: 'slice(start, end?)',       desc: 'Substring from start to end' },
  { name: 'index_of',   sig: 'index_of(substring)',      desc: 'Index of substring, or -1 if absent' },
  { name: 'repeat',     sig: 'repeat(count)',             desc: 'Repeat text count times' },
  { name: 'chars',      sig: 'chars()',                   desc: 'List of single characters' },
  { name: 'code_at',    sig: 'code_at(index)',            desc: 'Character code at index' },
]

const ALL_DOT_METHODS = buildDotMethodMap()

function buildDotMethodMap() {
  const map = new Map()
  for (const m of LIST_METHODS) {
    if (!map.has(m.name)) map.set(m.name, [])
    map.get(m.name).push({ ...m, type: 'list' })
  }
  for (const m of MAP_METHODS) {
    if (!map.has(m.name)) map.set(m.name, [])
    map.get(m.name).push({ ...m, type: 'map' })
  }
  for (const m of TEXT_METHODS) {
    if (!map.has(m.name)) map.set(m.name, [])
    map.get(m.name).push({ ...m, type: 'text' })
  }
  return map
}

function extractNames(source) {
  const variables = new Set()
  const functions = new Set()
  const classes = new Set()

  const lines = source.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('note ') || trimmed.startsWith('#')) continue

    let m
    m = trimmed.match(/^(?:remember|constant)\s+(?:number|text|truth|list|map|action|nothing|anything\s+)?([A-Za-z_]\w*)\s+as\b/)
    if (m) { variables.add(m[1]); continue }

    m = trimmed.match(/^define\s+([A-Za-z_]\w*)/)
    if (m) { functions.add(m[1]); continue }

    m = trimmed.match(/^describe\s+([A-Za-z_]\w*)/)
    if (m) { classes.add(m[1]); continue }

    m = trimmed.match(/^count\s+([A-Za-z_]\w*)\s+from\b/)
    if (m) { variables.add(m[1]); continue }

    m = trimmed.match(/^for\s+each\s+([A-Za-z_]\w*)/)
    if (m) { variables.add(m[1]); continue }

    m = trimmed.match(/\btimes\s+as\s+([A-Za-z_]\w*)/)
    if (m) { variables.add(m[1]); continue }

    m = trimmed.match(/^rescue\s+([A-Za-z_]\w*)/)
    if (m) { variables.add(m[1]); continue }
  }

  for (const name of KEYWORD_SET) {
    variables.delete(name)
    functions.delete(name)
    classes.delete(name)
  }
  for (const name of BUILTIN_NAMES) {
    variables.delete(name)
    functions.delete(name)
  }

  return { variables, functions, classes }
}

export function registerCompletionProvider(monaco) {
  return monaco.languages.registerCompletionItemProvider(LANG_NAME, {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      }

      const lineContent = model.getLineContent(position.lineNumber)
      const textBefore = lineContent.substring(0, position.column - 1)

      const isDot = textBefore.endsWith('.') || /\.\w*$/.test(textBefore)
      if (isDot) {
        return { suggestions: getDotCompletions(monaco, word, range) }
      }

      const isAfterNew = /\bnew\s+\w*$/.test(textBefore)

      const suggestions = []
      const source = model.getValue()
      const { variables, functions, classes } = extractNames(source)

      if (isAfterNew) {
        for (const name of classes) {
          if (!word.word || name.startsWith(word.word)) {
            suggestions.push({
              label: name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: 'class',
              insertText: name,
              range,
              sortText: '0_' + name,
            })
          }
        }
        return { suggestions }
      }

      for (const snippet of SNIPPETS) {
        const trigger = snippet.label.split(' ')[0]
        if (!word.word || trigger.startsWith(word.word)) {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: snippet.detail,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: '0_' + snippet.label,
          })
        }
      }

      for (const name of functions) {
        if (!word.word || name.startsWith(word.word)) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: 'function',
            insertText: name,
            range,
            sortText: '1a_' + name,
          })
        }
      }

      for (const name of variables) {
        if (!word.word || name.startsWith(word.word)) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: 'variable',
            insertText: name,
            range,
            sortText: '1b_' + name,
          })
        }
      }

      for (const name of classes) {
        if (!word.word || name.startsWith(word.word)) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: 'class',
            insertText: name,
            range,
            sortText: '1c_' + name,
          })
        }
      }

      for (const [name, info] of Object.entries(BUILTIN_DOCS)) {
        if (!word.word || name.startsWith(word.word)) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: info.sig,
            documentation: info.desc,
            insertText: name,
            range,
            sortText: '2_' + name,
          })
        }
      }

      for (const kw of KEYWORD_COMPLETIONS) {
        const first = kw.split(' ')[0]
        if (!word.word || first.startsWith(word.word)) {
          const alreadySnippet = suggestions.some(
            s => s.kind === monaco.languages.CompletionItemKind.Snippet && s.label === kw
          )
          if (!alreadySnippet) {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range,
              sortText: '3_' + kw,
            })
          }
        }
      }

      return { suggestions }
    }
  })
}

function getDotCompletions(monaco, word, range) {
  const suggestions = []
  const seen = new Set()

  for (const [name, entries] of ALL_DOT_METHODS) {
    if (!word.word || name.startsWith(word.word)) {
      if (seen.has(name)) continue
      seen.add(name)

      const types = entries.map(e => e.type).join('/')
      const firstEntry = entries[0]

      suggestions.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: `${firstEntry.sig}  (${types})`,
        documentation: firstEntry.desc,
        insertText: name,
        range,
        sortText: '0_' + name,
      })
    }
  }

  return suggestions
}
