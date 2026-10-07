import { useState, useRef, useEffect, useCallback } from 'react'

export default function Console({ entries, busy, onEvaluate, onClear, onReset }) {
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const historyRef = useRef([])
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const code = input.trim()
    if (!code || busy) return

    historyRef.current = [code, ...historyRef.current.filter(h => h !== code)].slice(0, 100)
    setHistoryIndex(-1)
    setInput('')
    onEvaluate(code)
  }, [input, busy, onEvaluate])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const hist = historyRef.current
      if (hist.length === 0) return
      const next = Math.min(historyIndex + 1, hist.length - 1)
      setHistoryIndex(next)
      setInput(hist[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex <= 0) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        const next = historyIndex - 1
        setHistoryIndex(next)
        setInput(historyRef.current[next])
      }
    }
  }, [historyIndex])

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const isEmpty = entries.length === 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--ink-750)',
      }}
      onClick={handleContainerClick}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '8px 12px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '14px',
          lineHeight: '1.65',
        }}
      >
        {isEmpty && !busy && (
          <span style={{ color: 'var(--vellum-dim)', fontStyle: 'italic' }}>
            Type Nova expressions below. Variables persist across lines.
          </span>
        )}

        {entries.map((entry, i) => (
          <ConsoleEntry key={i} entry={entry} />
        ))}

        {busy && (
          <div style={{ color: 'var(--vellum-dim)', fontStyle: 'italic' }}>
            Evaluating...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          borderTop: '1px solid var(--rule-soft)',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '14px',
            color: 'var(--verdigris)',
            fontWeight: 500,
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setHistoryIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder="Type an expression..."
          autoComplete="off"
          spellCheck="false"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '14px',
            color: 'var(--vellum)',
            caretColor: 'var(--verdigris)',
          }}
        />
      </form>
    </div>
  )
}

function ConsoleEntry({ entry }) {
  switch (entry.type) {
    case 'input':
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: 'var(--verdigris)', fontWeight: 500, flexShrink: 0 }}>&gt;</span>
          <span style={{ color: 'var(--vellum)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {entry.text}
          </span>
        </div>
      )
    case 'result':
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: 'var(--lapis)', fontWeight: 500, flexShrink: 0 }}>&larr;</span>
          <span style={{ color: 'var(--lapis)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {entry.text}
          </span>
        </div>
      )
    case 'output':
      return (
        <div style={{ color: 'var(--vellum)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: '18px' }}>
          {entry.text}
        </div>
      )
    case 'error':
      return (
        <div style={{ color: 'var(--halt)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: '18px' }}>
          {entry.text}
        </div>
      )
    default:
      return null
  }
}
