import { useState, useRef, useEffect } from 'react'
import { FILE_EXT } from '../lang/config.js'
import { EXAMPLES } from '../state/examples.js'

export default function FileTree({
  files,
  activeFile,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onLoadExample,
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const menuRef = useRef(null)

  const fileNames = Object.keys(files).sort()

  useEffect(() => {
    if (!showExamples) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowExamples(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [showExamples])

  const handleCreate = (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    const ok = onCreate(trimmed)
    if (ok !== false) {
      setNewName('')
      setCreating(false)
    }
  }

  const handleRename = (e) => {
    e.preventDefault()
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === renamingFile) {
      setRenamingFile(null)
      return
    }
    const ok = onRename(renamingFile, trimmed)
    if (ok !== false) {
      setRenamingFile(null)
    }
  }

  const startRename = (fileName) => {
    setRenamingFile(fileName)
    setRenameValue(fileName.replace(FILE_EXT, ''))
  }

  const handleExampleClick = (example) => {
    setShowExamples(false)
    onLoadExample?.(example.files)
  }

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--rule-soft)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--vellum-mid)',
          }}
        >
          Files
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowExamples(prev => !prev)}
              title="Load example"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--vellum-mid)',
                cursor: 'pointer',
                fontSize: '11px',
                lineHeight: 1,
                padding: '0 2px',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Examples
            </button>
            {showExamples && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--ink-700)',
                  border: '1px solid var(--rule)',
                  borderRadius: '4px',
                  minWidth: '180px',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                }}
              >
                {EXAMPLES.map((ex, i) => (
                  <div
                    key={i}
                    onClick={() => handleExampleClick(ex)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '12px',
                      color: 'var(--vellum)',
                      borderBottom: i < EXAMPLES.length - 1 ? '1px solid var(--rule-soft)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ink-800)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                  >
                    <div style={{ fontWeight: 500 }}>{ex.name}</div>
                    <div style={{ color: 'var(--vellum-dim)', fontSize: '11px', marginTop: '1px' }}>
                      {ex.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setCreating(true); setNewName('') }}
            title="New file"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--vellum-mid)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {fileNames.map((name) => (
          <div key={name}>
            {renamingFile === name ? (
              <form
                onSubmit={handleRename}
                style={{ padding: '2px 12px' }}
              >
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFile(null) }}
                  style={{
                    width: '100%',
                    padding: '2px 6px',
                    backgroundColor: 'var(--ink-700)',
                    color: 'var(--vellum)',
                    border: '1px solid var(--rule)',
                    borderRadius: '3px',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </form>
            ) : (
              <div
                onClick={() => onSelect(name)}
                onDoubleClick={() => startRename(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  backgroundColor: name === activeFile ? 'var(--ink-700)' : 'transparent',
                  color: name === activeFile ? 'var(--vellum)' : 'var(--vellum-mid)',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '13px',
                }}
              >
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {name}
                </span>
                {fileNames.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(name)
                    }}
                    title="Delete file"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--vellum-dim)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '0 2px',
                      opacity: 0.6,
                      flexShrink: 0,
                    }}
                  >
                    &#x2715;
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {creating && (
          <form
            onSubmit={handleCreate}
            style={{ padding: '2px 12px' }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if (!newName.trim()) setCreating(false) }}
              onKeyDown={(e) => { if (e.key === 'Escape') setCreating(false) }}
              placeholder={`filename${FILE_EXT}`}
              style={{
                width: '100%',
                padding: '2px 6px',
                backgroundColor: 'var(--ink-700)',
                color: 'var(--vellum)',
                border: '1px solid var(--rule)',
                borderRadius: '3px',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </form>
        )}
      </div>
    </div>
  )
}
