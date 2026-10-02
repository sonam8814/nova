export default function TitleBar({ status, onRun, onStop }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        height: '48px',
        borderBottom: '1px solid var(--rule)',
        backgroundColor: 'var(--ink-900)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: '20px',
          fontWeight: 500,
          color: 'var(--vellum)',
        }}
      >
        nova
      </span>

      <div style={{ flex: 1 }} />

      <button
        onClick={onRun}
        disabled={status === 'running'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 16px',
          borderRadius: '3px',
          border: 'none',
          backgroundColor: 'var(--run)',
          color: 'var(--ink-900)',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          cursor: status === 'running' ? 'default' : 'pointer',
          opacity: status === 'running' ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '11px' }}>&#9654;</span>
        Run
      </button>

      <button
        onClick={onStop}
        disabled={status !== 'running' && status !== 'waiting'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 16px',
          borderRadius: '3px',
          border: 'none',
          backgroundColor: 'var(--halt)',
          color: 'var(--vellum)',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          cursor: (status !== 'running' && status !== 'waiting') ? 'default' : 'pointer',
          opacity: (status !== 'running' && status !== 'waiting') ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '10px' }}>&#9632;</span>
        Stop
      </button>
    </div>
  )
}
