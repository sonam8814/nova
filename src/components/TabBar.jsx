export default function TabBar({ openFiles, activeFile, onSelect, onClose }) {
  if (openFiles.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--ink-750)',
        borderBottom: '1px solid var(--rule)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        height: '36px',
      }}
    >
      {openFiles.map((name) => {
        const isActive = name === activeFile
        return (
          <div
            key={name}
            onClick={() => onSelect(name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              cursor: 'pointer',
              backgroundColor: isActive ? 'var(--ink-800)' : 'transparent',
              borderTop: isActive ? '2px solid var(--vermilion)' : '2px solid transparent',
              borderRight: '1px solid var(--rule-soft)',
              color: isActive ? 'var(--vellum)' : 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>{name}</span>
            {openFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose(name)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--vellum-mid)' : 'var(--vellum-dim)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '0',
                  lineHeight: 1,
                }}
              >
                &#x2715;
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
