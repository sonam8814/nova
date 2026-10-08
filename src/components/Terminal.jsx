import { useRef, useEffect, useCallback, useState } from 'react'

const ERROR_LOC_RE = /^(\w+) at (.+?) line (\d+), column (\d+)/
const STACK_FRAME_RE = /^\s+at (\w+) \((.+?) line (\d+)\)/

const FOLD_THRESHOLD = 50
const FOLD_HEAD = 10
const FOLD_TAIL = 5

function parseErrorLoc(text) {
  const match = text.match(ERROR_LOC_RE)
  if (!match) return null
  return { file: match[2], line: parseInt(match[3], 10), column: parseInt(match[4], 10) }
}

function parseStackFrame(text) {
  const match = text.match(STACK_FRAME_RE)
  if (!match) return null
  return { name: match[1], file: match[2], line: parseInt(match[3], 10), column: 1 }
}

function parseClickableLoc(text, stream) {
  if (stream !== 'err') return null
  return parseErrorLoc(text) || parseStackFrame(text)
}

function getLineColor(text, stream) {
  if (stream === 'err') return 'var(--halt)'
  if (/^\[warn\]/i.test(text) || /^Warning/i.test(text)) return 'var(--gold)'
  if (/^\[info\]/i.test(text)) return 'var(--lapis)'
  if (/^\[ok\]/i.test(text) || /^\[success\]/i.test(text)) return 'var(--sage)'
  return 'var(--vellum)'
}

function formatMs(ms) {
  if (ms == null) return ''
  if (ms < 1000) return `+${ms}ms`
  return `+${(ms / 1000).toFixed(1)}s`
}

function splitOutputLines(output) {
  const result = []
  for (const entry of output) {
    const subLines = entry.text.split('\n')
    for (const sub of subLines) {
      result.push({ text: sub, stream: entry.stream, ms: entry.ms })
    }
  }
  return result
}

export default function Terminal({
  output, status, elapsedMs, onClear, onErrorClick,
  activeTab, onTabChange, consoleSlot,
  onConsoleClear, onConsoleReset, consoleHasEntries,
  showTimestamps, onToggleTimestamps,
  wrapOutput, onToggleWrap,
}) {
  const containerRef = useRef(null)
  const userScrolledRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [folded, setFolded] = useState(true)
  const prevOutputLenRef = useRef(0)

  useEffect(() => {
    if (output.length < prevOutputLenRef.current) {
      setFolded(true)
    }
    prevOutputLenRef.current = output.length
  }, [output])

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
    const loc = parseClickableLoc(line.text, line.stream)
    if (loc) onErrorClick?.(loc)
  }, [onErrorClick])

  const isEmpty = output.length === 0 && status === 'idle'
  const hasOutput = output.length > 0

  const lines = hasOutput ? splitOutputLines(output) : []

  const shouldFold = folded && lines.length > FOLD_THRESHOLD
  const foldStart = FOLD_HEAD
  const foldEnd = lines.length - FOLD_TAIL
  const hiddenCount = shouldFold ? foldEnd - foldStart : 0

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
                  <ToggleButton
                    label="Timestamps"
                    active={showTimestamps}
                    onClick={onToggleTimestamps}
                    title="Toggle timestamps"
                  />
                  <ToggleButton
                    label="Wrap"
                    active={wrapOutput}
                    onClick={onToggleWrap}
                    title="Toggle word wrap"
                  />
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
            padding: '8px 0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '14px',
            lineHeight: '1.65',
          }}
        >
          {isEmpty ? (
            <span style={{ color: 'var(--vellum-dim)', fontStyle: 'italic', padding: '0 12px' }}>
              Output appears here when you run.
            </span>
          ) : (
            <>
              {lines.map((line, i) => {
                if (shouldFold && i >= foldStart && i < foldEnd) {
                  if (i === foldStart) {
                    return (
                      <div
                        key={`fold-${i}`}
                        onClick={() => setFolded(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px 12px 2px 44px',
                          cursor: 'pointer',
                          color: 'var(--vellum-dim)',
                          fontStyle: 'italic',
                          fontSize: '12px',
                          borderTop: '1px dashed var(--rule-soft)',
                          borderBottom: '1px dashed var(--rule-soft)',
                          margin: '2px 0',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ink-700)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                      >
                        {`... ${hiddenCount} lines hidden (click to show)`}
                      </div>
                    )
                  }
                  return null
                }

                const loc = parseClickableLoc(line.text, line.stream)
                const isStackFrame = line.stream === 'err' && STACK_FRAME_RE.test(line.text)
                const lineNum = i + 1

                return (
                  <div
                    key={i}
                    onClick={() => handleLineClick(line)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      cursor: loc ? 'pointer' : 'default',
                      borderRadius: loc ? '2px' : undefined,
                      padding: '0 12px 0 0',
                    }}
                    onMouseEnter={loc ? (e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ink-700)'
                      if (isStackFrame) {
                        const span = e.currentTarget.querySelector('[data-content]')
                        if (span) span.style.textDecoration = 'underline'
                      }
                    } : undefined}
                    onMouseLeave={loc ? (e) => {
                      e.currentTarget.style.backgroundColor = ''
                      if (isStackFrame) {
                        const span = e.currentTarget.querySelector('[data-content]')
                        if (span) span.style.textDecoration = 'none'
                      }
                    } : undefined}
                  >
                    {/* Line number gutter */}
                    <span
                      style={{
                        width: '36px',
                        flexShrink: 0,
                        textAlign: 'right',
                        paddingRight: '8px',
                        color: 'var(--vellum-dim)',
                        fontSize: '11px',
                        userSelect: 'none',
                        opacity: 0.5,
                      }}
                    >
                      {lineNum}
                    </span>

                    {/* Content */}
                    <span
                      data-content
                      style={{
                        flex: 1,
                        color: getLineColor(line.text, line.stream),
                        whiteSpace: wrapOutput ? 'pre-wrap' : 'pre',
                        wordBreak: wrapOutput ? 'break-word' : 'normal',
                        minWidth: 0,
                        textDecoration: 'none',
                      }}
                    >
                      {line.text}
                    </span>

                    {/* Timestamp */}
                    {showTimestamps && line.ms != null && (
                      <span
                        style={{
                          flexShrink: 0,
                          marginLeft: '12px',
                          fontSize: '11px',
                          color: 'var(--vellum-dim)',
                          opacity: 0.5,
                          userSelect: 'none',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatMs(line.ms)}
                      </span>
                    )}
                  </div>
                )
              })}
            </>
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

function ToggleButton({ label, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--ink-700)' : 'none',
        border: '1px solid',
        borderColor: active ? 'var(--vellum-dim)' : 'var(--rule)',
        borderRadius: '3px',
        padding: '1px 8px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '11px',
        color: active ? 'var(--vellum)' : 'var(--vellum-dim)',
        cursor: 'pointer',
        lineHeight: '18px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--vellum)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--vellum-dim)' }}
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
