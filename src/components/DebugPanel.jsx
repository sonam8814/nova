import { useState } from 'react'

export default function DebugPanel({ debugState, onFrameClick }) {
  if (!debugState) return null

  const { scopes, callStack, file, line } = debugState

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--ink-750)',
        overflow: 'hidden',
      }}
    >
      <VariablesSection scopes={scopes} />
      <CallStackSection callStack={callStack} file={file} line={line} onFrameClick={onFrameClick} />
    </div>
  )
}

function VariablesSection({ scopes }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Variables" />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {scopes.length === 0 ? (
          <EmptyMessage text="No variables in scope." />
        ) : (
          scopes.map((scope, i) => (
            <ScopeGroup key={i} scope={scope} defaultOpen={i === 0} />
          ))
        )}
      </div>
    </div>
  )
}

function ScopeGroup({ scope, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const entries = Object.entries(scope.vars)

  if (entries.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          padding: '3px 10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--vellum-mid)',
          textAlign: 'left',
        }}
      >
        <span style={{
          display: 'inline-block',
          width: '10px',
          fontSize: '9px',
          color: 'var(--vellum-dim)',
        }}>
          {open ? '▾' : '▸'}
        </span>
        {scope.name}
      </button>
      {open && (
        <div style={{ padding: '0 10px 4px 24px' }}>
          {entries.map(([name, val]) => (
            <VariableRow key={name} name={name} value={val} />
          ))}
        </div>
      )}
    </div>
  )
}

function VariableRow({ name, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        padding: '1px 0',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '12px',
        lineHeight: '1.5',
      }}
    >
      <span style={{ color: 'var(--vellum)', flexShrink: 0 }}>{name}</span>
      <span
        style={{
          color: colorForType(value.type),
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={value.display}
      >
        {value.display}
      </span>
    </div>
  )
}

function colorForType(type) {
  switch (type) {
    case 'number': return 'var(--lapis)'
    case 'text': return 'var(--sage)'
    case 'truth': return 'var(--lapis)'
    case 'nothing': return 'var(--vellum-dim)'
    case 'list': return 'var(--vellum-mid)'
    case 'map': return 'var(--vellum-mid)'
    case 'action': return 'var(--plum)'
    case 'class': return 'var(--verdigris)'
    case 'namespace': return 'var(--gold)'
    default: return 'var(--verdigris)'
  }
}

function CallStackSection({ callStack, file, line, onFrameClick }) {
  const frames = [
    { name: '<current>', file, line },
    ...[...callStack].reverse(),
  ]

  return (
    <div style={{ flexShrink: 0, maxHeight: '40%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Call stack" />
      <div style={{ overflowY: 'auto', padding: '4px 0' }}>
        {frames.map((frame, i) => (
          <button
            key={i}
            onClick={() => onFrameClick?.({ file: frame.file, line: frame.line })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              width: '100%',
              padding: '3px 12px',
              background: i === 0 ? 'var(--ink-700)' : 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              color: 'var(--vellum)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (i !== 0) e.currentTarget.style.backgroundColor = 'var(--ink-700)'
            }}
            onMouseLeave={(e) => {
              if (i !== 0) e.currentTarget.style.backgroundColor = ''
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {frame.name}
            </span>
            <span style={{ color: 'var(--vellum-dim)', flexShrink: 0, fontSize: '11px' }}>
              {frame.line != null ? `line ${frame.line}` : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <div
      style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--rule-soft)',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--vellum-mid)',
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  )
}

function EmptyMessage({ text }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color: 'var(--vellum-dim)',
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  )
}
