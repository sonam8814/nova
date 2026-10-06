import { useState, useEffect, useRef } from 'react'
import { exportProjectJSON, importProjectJSON } from '../state/sharing.js'

const IS_MAC = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
const MOD = IS_MAC ? '⌘' : 'Ctrl+'

export default function TitleBar({ status, onRun, onStop, saveFlash, files, onImport, onShare, onStepIn, onStepOver, onStepOut, onContinue }) {
  const handleExport = () => {
    exportProjectJSON(files)
  }

  const handleImport = async () => {
    const imported = await importProjectJSON()
    if (imported) onImport?.(imported)
  }

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

      <SaveIndicator visible={saveFlash} />

      <div style={{ flex: 1 }} />

      <TitleButton label="Share" title="Share project link" onClick={onShare} />
      <TitleButton label="Export" title="Download project as JSON" onClick={handleExport} />
      <TitleButton label="Import" title="Load project from JSON" onClick={handleImport} />

      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--rule)', margin: '0 4px' }} />

      {status === 'paused' && (
        <>
          <DebugButton label="Continue" title="Continue (F5)" onClick={onContinue} accent />
          <DebugButton label="Step over" title="Step over (F10)" onClick={onStepOver} />
          <DebugButton label="Step in" title="Step in (F11)" onClick={onStepIn} />
          <DebugButton label="Step out" title="Step out (Shift+F11)" onClick={onStepOut} />
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--rule)', margin: '0 4px' }} />
        </>
      )}

      <button
        onClick={onRun}
        disabled={status === 'running'}
        aria-label="Run program"
        title={`Run (${MOD}Enter)`}
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
        disabled={status !== 'running' && status !== 'waiting' && status !== 'paused'}
        aria-label="Stop program"
        title={`Stop (${MOD}.)`}
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
          cursor: (status !== 'running' && status !== 'waiting' && status !== 'paused') ? 'default' : 'pointer',
          opacity: (status !== 'running' && status !== 'waiting' && status !== 'paused') ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '10px' }}>&#9632;</span>
        Stop
      </button>
    </div>
  )
}

function DebugButton({ label, title, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: accent ? 'var(--mark)' : 'none',
        border: accent ? 'none' : '1px solid var(--mark)',
        borderRadius: '3px',
        padding: '3px 10px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color: accent ? 'var(--ink-900)' : 'var(--mark)',
        cursor: 'pointer',
        lineHeight: '18px',
        fontWeight: accent ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!accent) {
          e.currentTarget.style.backgroundColor = 'rgba(210, 162, 76, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (!accent) {
          e.currentTarget.style.backgroundColor = ''
        }
      }}
    >
      {label}
    </button>
  )
}

function TitleButton({ label, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: '1px solid var(--rule)',
        borderRadius: '3px',
        padding: '3px 10px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color: 'var(--vellum-dim)',
        cursor: 'pointer',
        lineHeight: '18px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--vellum)'
        e.currentTarget.style.borderColor = 'var(--vellum-dim)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--vellum-dim)'
        e.currentTarget.style.borderColor = 'var(--rule)'
      }}
    >
      {label}
    </button>
  )
}

function SaveIndicator({ visible }) {
  const [show, setShow] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (visible) {
      setShow(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShow(false), 1200)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible])

  if (!show) return null

  return (
    <span
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '12px',
        color: 'var(--sage)',
        marginLeft: '8px',
        transition: 'opacity 0.3s',
        opacity: show ? 1 : 0,
      }}
    >
      Saved
    </span>
  )
}
