import { useRef, useEffect, useCallback } from 'react'

export default function Terminal({ output, status, elapsedMs }) {
  const containerRef = useRef(null)
  const userScrolledRef = useRef(false)

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

  const isEmpty = output.length === 0 && status === 'idle'

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
          padding: '6px 12px',
          borderBottom: '1px solid var(--rule-soft)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--vellum-mid)',
          }}
        >
          Output
        </span>
        <StatusLine status={status} elapsedMs={elapsedMs} />
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
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
          output.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.stream === 'err' ? 'var(--halt)' : 'var(--vellum)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
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
