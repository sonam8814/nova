import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

const IS_MAC = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
const MOD = IS_MAC ? '⌘' : 'Ctrl+'
const SHIFT = IS_MAC ? '⇧' : 'Shift+'

export default function CommandPalette({ onClose, commands }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commands
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      (cmd.category && cmd.category.toLowerCase().includes(q))
    )
  }, [query, commands])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const selected = el.children[selectedIndex]
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const execute = useCallback((cmd) => {
    onClose()
    cmd.action()
  }, [onClose])

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
        execute(filtered[selectedIndex])
      }
      return
    }
  }, [filtered, selectedIndex, execute, onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--ink-700)',
          border: '1px solid var(--rule)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '65vh',
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
            placeholder="Type a command…"
            aria-label="Search commands"
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
          ref={listRef}
          role="listbox"
          style={{ overflowY: 'auto', maxHeight: '52vh' }}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: '12px 16px',
              color: 'var(--vellum-dim)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontStyle: 'italic',
            }}>
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 16px',
                  cursor: 'pointer',
                  backgroundColor: i === selectedIndex ? 'var(--ink-800)' : 'transparent',
                  borderLeft: i === selectedIndex ? '2px solid var(--focus)' : '2px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {cmd.category && (
                    <span style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '11px',
                      color: 'var(--vellum-dim)',
                      backgroundColor: 'var(--ink-750)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}>
                      {cmd.category}
                    </span>
                  )}
                  <span style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px',
                    color: 'var(--vellum)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {cmd.label}
                  </span>
                </div>

                {cmd.shortcut && (
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    color: 'var(--vellum-dim)',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function useCommands({
  onRun, onStop, status,
  onNewFile, onCloseTab, onSave,
  onShare, onExport, onImport,
  onToggleSettings, onToggleBreakpoint,
  onFileSwitcher,
  onStepIn, onStepOver, onStepOut, onContinue,
  onClearOutput, onShowOutput, onShowConsole,
  onResetConsole,
}) {
  return useMemo(() => {
    const cmds = []

    cmds.push({
      id: 'run',
      label: 'Run Program',
      category: 'Run',
      shortcut: `${MOD}Enter`,
      action: () => { if (status !== 'running') onRun?.() },
    })

    if (status === 'running' || status === 'waiting' || status === 'paused') {
      cmds.push({
        id: 'stop',
        label: 'Stop Program',
        category: 'Run',
        shortcut: `${MOD}.`,
        action: () => onStop?.(),
      })
    }

    if (status === 'paused') {
      cmds.push(
        { id: 'continue', label: 'Continue', category: 'Debug', shortcut: 'F5', action: () => onContinue?.() },
        { id: 'step-over', label: 'Step Over', category: 'Debug', shortcut: 'F10', action: () => onStepOver?.() },
        { id: 'step-in', label: 'Step In', category: 'Debug', shortcut: 'F11', action: () => onStepIn?.() },
        { id: 'step-out', label: 'Step Out', category: 'Debug', shortcut: `${SHIFT}F11`, action: () => onStepOut?.() },
      )
    }

    cmds.push({
      id: 'toggle-breakpoint',
      label: 'Toggle Breakpoint',
      category: 'Debug',
      shortcut: `${MOD}B`,
      action: () => onToggleBreakpoint?.(),
    })

    cmds.push({
      id: 'new-file',
      label: 'New File',
      category: 'File',
      shortcut: `${MOD}N`,
      action: () => onNewFile?.(),
    })

    cmds.push({
      id: 'close-tab',
      label: 'Close Tab',
      category: 'File',
      shortcut: `${MOD}W`,
      action: () => onCloseTab?.(),
    })

    cmds.push({
      id: 'file-switcher',
      label: 'Go to File',
      category: 'File',
      shortcut: `${MOD}P`,
      action: () => onFileSwitcher?.(),
    })

    cmds.push({
      id: 'save',
      label: 'Save',
      category: 'File',
      shortcut: `${MOD}S`,
      action: () => onSave?.(),
    })

    cmds.push({
      id: 'share',
      label: 'Share Project Link',
      category: 'Project',
      action: () => onShare?.(),
    })

    cmds.push({
      id: 'export',
      label: 'Export as JSON',
      category: 'Project',
      action: () => onExport?.(),
    })

    cmds.push({
      id: 'import',
      label: 'Import from JSON',
      category: 'Project',
      action: () => onImport?.(),
    })

    cmds.push({
      id: 'settings',
      label: 'Toggle Settings',
      category: 'View',
      action: () => onToggleSettings?.(),
    })

    cmds.push({
      id: 'show-output',
      label: 'Show Output Panel',
      category: 'View',
      action: () => onShowOutput?.(),
    })

    cmds.push({
      id: 'show-console',
      label: 'Show Console',
      category: 'View',
      action: () => onShowConsole?.(),
    })

    cmds.push({
      id: 'clear-output',
      label: 'Clear Output',
      category: 'View',
      action: () => onClearOutput?.(),
    })

    cmds.push({
      id: 'reset-console',
      label: 'Reset Console',
      category: 'View',
      action: () => onResetConsole?.(),
    })

    return cmds
  }, [
    onRun, onStop, status,
    onNewFile, onCloseTab, onSave,
    onShare, onExport, onImport,
    onToggleSettings, onToggleBreakpoint,
    onFileSwitcher,
    onStepIn, onStepOver, onStepOut, onContinue,
    onClearOutput, onShowOutput, onShowConsole,
    onResetConsole,
  ])
}
