export default function StatusBar({ cursor, activeFile, content }) {
  const lineCount = content ? content.split('\n').length : 0
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '24px',
        padding: '0 12px',
        backgroundColor: 'var(--ink-800)',
        borderTop: '1px solid var(--rule)',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '11px',
        color: 'var(--vellum-dim)',
        flexShrink: 0,
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        {cursor.selected > 0 && (
          <span style={{ color: 'var(--vellum-mid)' }}>
            {cursor.selected} selected
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span>{wordCount} words</span>
        <span>{lineCount} lines</span>
        <span>Spaces: 2</span>
        <span style={{ color: 'var(--vellum-mid)' }}>Nova</span>
      </div>
    </div>
  )
}
