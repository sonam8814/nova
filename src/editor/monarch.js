import { LANG_NAME } from '../lang/config.js'

const keywords = [
  'remember', 'constant', 'set', 'to', 'as', 'show', 'ask', 'note',
  'check', 'if', 'or', 'otherwise', 'while', 'repeat', 'times',
  'count', 'from', 'down', 'by', 'for', 'each', 'in', 'keep', 'going',
  'skip', 'stop', 'define', 'with', 'gives', 'give', 'back', 'action',
  'describe', 'has', 'new', 'attempt', 'rescue', 'always', 'raise',
  'use', 'save', 'read', 'delete', 'file', 'done', 'size', 'of',
  'is', 'not', 'and',
]

const builtins = [
  'to_number', 'to_text', 'to_truth', 'type_of', 'same',
  'abs', 'min', 'max', 'floor', 'ceil', 'round',
  'sqrt', 'power', 'random', 'random_between',
  'range', 'sleep', 'time_now', 'files',
]

const typeNames = [
  'number', 'text', 'truth', 'list', 'map', 'action', 'nothing', 'anything',
]

export const monarchLanguage = {
  defaultToken: 'invalid',
  ignoreCase: false,

  keywords,
  builtins,
  typeNames,

  literals: ['yes', 'no', 'nothing'],
  selfKeywords: ['my', 'parent'],

  operators: [
    '+', '-', '*', '/', '%', '^',
    '<', '>', '<=', '>=', '==', '!=',
  ],

  symbols: /[+\-*/%^<>=!]+/,

  tokenizer: {
    root: [
      // comments: note ... or # ...
      [/note\b.*$/, 'comment'],
      [/#.*$/, 'comment'],

      // define NAME — next identifier is a function name
      [/\b(define)\b/, { token: 'keyword', next: '@afterDefine' }],

      // describe NAME — next identifier is a class name
      [/\b(describe)\b/, { token: 'keyword', next: '@afterDescribe' }],

      // string literals with interpolation
      [/"/, { token: 'string', next: '@string' }],

      // numbers
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, 'number'],

      // identifiers, keywords, builtins, type names, literals
      [/[A-Za-z_]\w*/, {
        cases: {
          'yes|no|nothing': 'number.literal',
          'my|parent': 'keyword.self',
          '@typeNames': 'type',
          '@builtins': 'builtin',
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],

      // operators
      [/<=|>=|==|!=/, 'operator'],
      [/[+\-*/%^<>=]/, 'operator'],

      // delimiters
      [/[(){}[\]]/, '@brackets'],
      [/[,.:]+/, 'delimiter'],

      // whitespace
      [/\s+/, 'white'],
    ],

    afterDefine: [
      [/\s+/, 'white'],
      [/[A-Za-z_]\w*/, { token: 'function', next: '@pop' }],
      ['', '', '@pop'],
    ],

    afterDescribe: [
      [/\s+/, 'white'],
      [/[A-Za-z_]\w*/, { token: 'type.class', next: '@pop' }],
      ['', '', '@pop'],
    ],

    string: [
      [/\\[nt\\"\{]/, 'string.escape'],
      [/\{/, { token: 'string.interpolation.bracket', next: '@interpolation' }],
      [/"/, { token: 'string', next: '@pop' }],
      [/[^\\"{]+/, 'string'],
    ],

    interpolation: [
      // nested string inside interpolation
      [/"/, { token: 'string', next: '@nestedString' }],

      [/note\b.*$/, 'comment'],
      [/#.*$/, 'comment'],

      [/\b(define)\b/, { token: 'keyword', next: '@afterDefine' }],
      [/\b(describe)\b/, { token: 'keyword', next: '@afterDescribe' }],

      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, 'number'],

      [/[A-Za-z_]\w*/, {
        cases: {
          'yes|no|nothing': 'number.literal',
          'my|parent': 'keyword.self',
          '@typeNames': 'type',
          '@builtins': 'builtin',
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],

      [/<=|>=|==|!=/, 'operator'],
      [/[+\-*/%^<>=]/, 'operator'],

      [/[()[\]]/, '@brackets'],
      [/[,.:]+/, 'delimiter'],

      [/\}/, { token: 'string.interpolation.bracket', next: '@pop' }],
      [/\{/, { token: 'delimiter.bracket', bracket: '@open' }],

      [/\s+/, 'white'],
    ],

    nestedString: [
      [/\\[nt\\"\{]/, 'string.escape'],
      [/\{/, { token: 'string.interpolation.bracket', next: '@nestedInterpolation' }],
      [/"/, { token: 'string', next: '@pop' }],
      [/[^\\"{]+/, 'string'],
    ],

    nestedInterpolation: [
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, 'number'],

      [/[A-Za-z_]\w*/, {
        cases: {
          'yes|no|nothing': 'number.literal',
          'my|parent': 'keyword.self',
          '@typeNames': 'type',
          '@builtins': 'builtin',
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],

      [/<=|>=|==|!=/, 'operator'],
      [/[+\-*/%^<>=]/, 'operator'],

      [/[()[\]]/, '@brackets'],
      [/[,.:]+/, 'delimiter'],

      [/\}/, { token: 'string.interpolation.bracket', next: '@pop' }],

      [/\s+/, 'white'],
    ],
  },
}

export const monarchConfig = {
  comments: {
    lineComment: 'note',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  indentationRules: {
    increaseIndentPattern: /^\s*(check\s+if|or\s+if|otherwise|while|repeat|count|for\s+each|keep\s+going|define|describe|attempt|rescue|always|action)\b/,
    decreaseIndentPattern: /^\s*(done|otherwise|or\s+if|rescue|always)\b/,
  },
}

export function registerNovaLanguage(monaco) {
  monaco.languages.register({ id: LANG_NAME })
  monaco.languages.setMonarchTokensProvider(LANG_NAME, monarchLanguage)
  monaco.languages.setLanguageConfiguration(LANG_NAME, monarchConfig)
}
