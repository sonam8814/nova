import { useRef, useEffect, useCallback, useState } from 'react'

const ERROR_LOC_RE = /^(\w+) at (.+?) line (\d+), column (\d+)/

function parseErrorLoc(text) {
  const match = text.match(ERROR_LOC_RE)
  if (!match) return null
  return { file: match[2], line: parseInt(match[3], 10), column: parseInt(match[4], 10) }
}

export default function Terminal({ output, status, elapsedMs, onClear, onErrorClick, activeTab, onTabChange, consoleSlot, onConsoleClear, onConsoleReset, consoleHasEntries }) {
  const containerRef = useRef(null)
  const userScrolledRef = useRef(false)
  const [copied, setCopied] = useState(false)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    userScrolledRef.current = !atBottom
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || userScrolledRef.current) return
    el.scrollTop = el.scrollHeight
  }, [output])

  const handleCopy = useCallback(() => {
    const text = output.map(l => l.text).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }, [output])

  const handleLineClick = useCallback((line) => {
    if (line.stream !== 'err') return
    const loc = parseErrorLoc(line.text)
    if (loc) onErrorClick?.(loc)
  }, [onErrorClick])

  const isEmpty = output.length === 0 && status === 'idle'
  const hasOutput = output.length > 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--ink-750)',
        borderTop: '1px solid var(--rule)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--rule-soft)',
          flexShrink: 0,
          height: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <TabButton label="Output" active={activeTab === 'output'} onClick={() => onTabChange('output')} />
          <TabButton label="Console" active={activeTab === 'console'} onClick={() => onTabChange('console')} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'output' ? (
            <>
              <StatusLine status={status} elapsedMs={elapsedMs} />
              {hasOutput && (
                <>
                  <ToolButton
                    label={copied ? 'Copied' : 'Copy'}
                    onClick={handleCopy}
                    title="Copy all output"
                  />
                  <ToolButton
                    label="Clear"
                    onClick={onClear}
                    title="Clear output"
                  />
                </>
              )}
            </>
          ) : (
            <>
              {consoleHasEntries && (
                <ToolButton
                  label="Clear"
                  onClick={onConsoleClear}
                  title="Clear console history"
                />
              )}
              <ToolButton
                label="Reset"
                onClick={onConsoleReset}
                title="Reset console environment"
              />
            </>
          )}
        </div>
      </div>

      {activeTab === 'output' ? (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Program output"
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
          {isEmpty ? (
            <span style={{ color: 'var(--vellum-dim)', fontStyle: 'italic' }}>
              Output appears here when you run.
            </span>
          ) : (
            output.map((line, i) => {
              const isErr = line.stream === 'err'
              const loc = isErr ? parseErrorLoc(line.text) : null
              return (
                <div
                  key={i}
                  onClick={() => handleLineClick(line)}
                  style={{
                    color: isErr ? 'var(--halt)' : 'var(--vellum)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: loc ? 'pointer' : 'default',
                    borderRadius: loc ? '2px' : undefined,
                  }}
                  onMouseEnter={loc ? (e) => { e.currentTarget.style.backgroundColor = 'var(--ink-700)' } : undefined}
                  onMouseLeave={loc ? (e) => { e.currentTarget.style.backgroundColor = '' } : undefined}
                >
                  {line.text}
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          {consoleSlot}
        </div>
      )}
    </div>
  )
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid var(--verdigris)' : '2px solid transparent',
        padding: '6px 12px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: active ? 'var(--vellum)' : 'var(--vellum-dim)',
        cursor: 'pointer',
        lineHeight: '18px',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--vellum-mid)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--vellum-dim)'
      }}
    >
      {label}
    </button>
  )
}

function ToolButton({ label, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: '1px solid var(--rule)',
        borderRadius: '3px',
        padding: '1px 8px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '11px',
        color: 'var(--vellum-dim)',
        cursor: 'pointer',
        lineHeight: '18px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--vellum)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--vellum-dim)' }}
    >
      {label}
    </button>
  )
}

function StatusLine({ status, elapsedMs }) {
  let text = ''
  let color = 'var(--vellum-dim)'

  switch (status) {
    case 'running':
      text = 'Running…'
      color = 'var(--run)'
      break
    case 'done':
      text = elapsedMs != null ? `Finished in ${elapsedMs}ms` : 'Finished'
      color = 'var(--vellum-mid)'
      break
    case 'waiting':
      text = 'Waiting for input…'
      color = 'var(--gold)'
      break
    case 'paused':
      text = 'Paused'
      color = 'var(--mark)'
      break
    case 'idle':
    default:
      return null
  }

  return (
    <span
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color,
      }}
    >
      {text}
    </span>
  )
}
