import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

const MAX_RESULTS = 100
const CONTEXT_CHARS = 60

function searchFiles(files, query, caseSensitive, useRegex) {
  const results = []
  let total = 0

  let matcher
  if (useRegex) {
    try {
      matcher = new RegExp(query, caseSensitive ? 'g' : 'gi')
    } catch {
      return { results: [], total: 0 }
    }
  }

  const fileNames = Object.keys(files).sort()
  for (const fileName of fileNames) {
    const content = files[fileName]
    if (!content) continue
    const lines = content.split('\n')
    const fileResults = []

    for (let i = 0; i < lines.length; i++) {
      if (total >= MAX_RESULTS) break
      const line = lines[i]
      let match = false

      if (useRegex) {
        matcher.lastIndex = 0
        match = matcher.test(line)
      } else if (caseSensitive) {
        match = line.includes(query)
      } else {
        match = line.toLowerCase().includes(query.toLowerCase())
      }

      if (match) {
        total++
        fileResults.push({
          line: i + 1,
          text: line.length > CONTEXT_CHARS ? line.slice(0, CONTEXT_CHARS) + '…' : line,
          fullLine: line,
        })
      }
    }

    if (fileResults.length > 0) {
      results.push({ fileName, matches: fileResults })
    }
    if (total >= MAX_RESULTS) break
  }

  return { results, total }
}

export default function FindInProject({ files, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const debounceRef = useRef(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      setSelectedIndex(0)
    }, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const { results, total } = useMemo(() => {
    if (!debouncedQuery.trim()) return { results: [], total: 0 }
    return searchFiles(files, debouncedQuery, caseSensitive, useRegex)
  }, [files, debouncedQuery, caseSensitive, useRegex])

  const flatResults = useMemo(() => {
    const flat = []
    for (const group of results) {
      for (const match of group.matches) {
        flat.push({ fileName: group.fileName, ...match })
      }
    }
    return flat
  }, [results])

  const select = useCallback((fileName, line) => {
    onSelect(fileName, line)
    onClose()
  }, [onSelect, onClose])

  useEffect(() => {
    const el = resultsRef.current
    if (!el) return
    const selected = el.querySelector('[data-selected="true"]')
    if (selected) selected.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatResults[selectedIndex]
      if (item) select(item.fileName, item.line)
      return
    }
  }, [flatResults, selectedIndex, select, onClose])

  const hasQuery = debouncedQuery.trim().length > 0
  let flatIdx = -1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-label="Find in project"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--ink-700)',
          border: '1px solid var(--rule)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '8px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search in all files…"
              aria-label="Search in project"
              style={{
                flex: 1,
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
            <OptionButton
              label="Aa"
              title="Case sensitive"
              active={caseSensitive}
              onClick={() => { setCaseSensitive(p => !p); setDebouncedQuery(query) }}
            />
            <OptionButton
              label=".*"
              title="Use regex"
              active={useRegex}
              onClick={() => { setUseRegex(p => !p); setDebouncedQuery(query) }}
            />
          </div>
          {hasQuery && (
            <div style={{
              padding: '4px 4px 0',
              fontSize: '11px',
              color: 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              {total === 0
                ? 'No results.'
                : total >= MAX_RESULTS
                  ? `${MAX_RESULTS}+ results (showing first ${MAX_RESULTS})`
                  : `${total} result${total === 1 ? '' : 's'}`
              }
            </div>
          )}
        </div>

        <div
          ref={resultsRef}
          role="listbox"
          style={{ overflowY: 'auto', maxHeight: '55vh' }}
        >
          {!hasQuery ? (
            <div style={{
              padding: '16px',
              color: 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Type to search across all project files.
            </div>
          ) : results.length === 0 ? (
            <div style={{
              padding: '16px',
              color: 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              No matches found.
            </div>
          ) : (
            results.map((group) => (
              <div key={group.fileName}>
                <div style={{
                  padding: '6px 12px 2px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--lapis)',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--ink-700)',
                  zIndex: 1,
                }}>
                  {group.fileName}
                  <span style={{ color: 'var(--vellum-dim)', fontWeight: 400, marginLeft: '6px' }}>
                    ({group.matches.length})
                  </span>
                </div>
                {group.matches.map((match) => {
                  flatIdx++
                  const idx = flatIdx
                  const isSelected = idx === selectedIndex
                  return (
                    <div
                      key={`${group.fileName}:${match.line}`}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected || undefined}
                      onClick={() => select(group.fileName, match.line)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        padding: '3px 12px 3px 20px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--ink-800)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--focus)' : '2px solid transparent',
                      }}
                    >
                      <span style={{
                        width: '36px',
                        flexShrink: 0,
                        textAlign: 'right',
                        paddingRight: '10px',
                        fontSize: '11px',
                        color: 'var(--vellum-dim)',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>
                        {match.line}
                      </span>
                      <span style={{
                        flex: 1,
                        fontSize: '13px',
                        color: 'var(--vellum-mid)',
                        fontFamily: "'IBM Plex Mono', monospace",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        <HighlightedText
                          text={match.text}
                          query={debouncedQuery}
                          caseSensitive={caseSensitive}
                          useRegex={useRegex}
                        />
                      </span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function HighlightedText({ text, query, caseSensitive, useRegex }) {
  if (!query) return text

  let regex
  try {
    const pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    regex = new RegExp(`(${pattern})`, caseSensitive ? 'g' : 'gi')
  } catch {
    return text
  }

  const parts = text.split(regex)
  if (parts.length <= 1) return text

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} style={{ color: 'var(--gold)', fontWeight: 500 }}>
          {part}
        </span>
      )
    }
    return part
  })
}

function OptionButton({ label, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '3px',
        border: active ? '1px solid var(--lapis)' : '1px solid var(--rule)',
        backgroundColor: active ? 'var(--ink-800)' : 'transparent',
        color: active ? 'var(--lapis)' : 'var(--vellum-dim)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = active ? 'var(--lapis)' : 'var(--vellum)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = active ? 'var(--lapis)' : 'var(--vellum-dim)' }}
    >
      {label}
    </button>
  )
}
