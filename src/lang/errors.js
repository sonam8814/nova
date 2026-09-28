export function novaError(kind, message, { hint = null, file = null, line = null, column = null, stack = [] } = {}) {
  return {
    kind,
    message,
    hint,
    file,
    line,
    column,
    stack: [...stack],
  }
}

export function formatError(sourcesByFile, error) {
  const lines = []

  const file = error.file || 'unknown'
  const loc = (error.line != null && error.column != null)
    ? ` line ${error.line}, column ${error.column}`
    : ''
  lines.push(`${error.kind} at ${file}${loc}`)
  lines.push('')

  if (error.line != null && sourcesByFile) {
    const source = sourcesByFile[file]
    if (source) {
      const sourceLines = source.split('\n')
      const lineIdx = error.line - 1
      if (lineIdx >= 0 && lineIdx < sourceLines.length) {
        lines.push(`    ${sourceLines[lineIdx]}`)
        if (error.column != null && error.column > 0) {
          lines.push(`    ${' '.repeat(error.column - 1)}^`)
        }
      }
    }
  }

  lines.push(error.message)

  if (error.hint) {
    lines.push(`Hint: ${error.hint}`)
  }

  return lines.join('\n')
}
