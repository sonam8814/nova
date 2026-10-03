import { Lexer, LexerError } from '../lang/lexer.js'
import { Parser, ParseError } from '../lang/parser.js'
import { Resolver } from '../lang/resolver.js'

function wordEndColumn(source, line, col) {
  const lines = source.split('\n')
  const lineIdx = line - 1
  if (lineIdx < 0 || lineIdx >= lines.length) return col + 1
  const text = lines[lineIdx]
  const startIdx = col - 1
  if (startIdx < 0 || startIdx >= text.length) return col + 1
  let end = startIdx
  while (end < text.length && /\w/.test(text[end])) end++
  return Math.max(col + 1, end + 1)
}

self.onmessage = function (e) {
  const { source, fileName, version } = e.data
  const markers = []

  try {
    const lexer = new Lexer(source, fileName)
    const tokens = lexer.tokenize()

    const parser = new Parser(tokens, fileName)
    const ast = parser.parse()

    const resolver = new Resolver(fileName)
    const errors = resolver.resolve(ast)

    for (const err of errors) {
      const line = err.line || 1
      const col = err.column || 1
      markers.push({
        severity: 8,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: wordEndColumn(source, line, col),
        message: err.hint
          ? `${err.message}\nHint: ${err.hint}`
          : err.message,
        source: 'nova',
      })
    }
  } catch (err) {
    if (err instanceof LexerError || err instanceof ParseError) {
      const line = err.line || 1
      const col = err.column || 1
      markers.push({
        severity: 8,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: wordEndColumn(source, line, col),
        message: err.hint
          ? `${err.message}\nHint: ${err.hint}`
          : err.message,
        source: 'nova',
      })
    }
  }

  self.postMessage({ markers, version })
}
