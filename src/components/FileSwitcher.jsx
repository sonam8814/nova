import { useState, useRef, useEffect, useCallback } from 'react'

export default function FileSwitcher({ files, activeFile, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const fileNames = Object.keys(files).sort()
  const filtered = query.trim()
    ? fileNames.filter(name => name.toLowerCase().includes(query.toLowerCase()))
    : fileNames

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const select = useCallback((name) => {
    onSelect(name)
    onClose()
  }, [onSelect, onClose])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        select(filtered[selectedIndex])
      }
      return
    }
  }, [filtered, selectedIndex, select, onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-label="File switcher"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--ink-700)',
          border: '1px solid var(--rule)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '8px', borderBottom: '1px solid var(--rule-soft)' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go to file…"
            aria-label="Search files"
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--ink-800)',
              color: 'var(--vellum)',
              border: '1px solid var(--rule)',
              borderRadius: '3px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div
          role="listbox"
          style={{ overflowY: 'auto', maxHeight: '40vh' }}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: '12px 16px',
              color: 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontStyle: 'italic',
            }}>
              No matching files.
            </div>
          ) : (
            filtered.map((name, i) => (
              <div
                key={name}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => select(name)}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  backgroundColor: i === selectedIndex ? 'var(--ink-800)' : 'transparent',
                  color: name === activeFile ? 'var(--vellum)' : 'var(--vellum-mid)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  borderLeft: i === selectedIndex ? '2px solid var(--focus)' : '2px solid transparent',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
