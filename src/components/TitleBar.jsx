import { useState, useEffect, useRef } from 'react'

const IS_MAC = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
const MOD = IS_MAC ? '⌘' : 'Ctrl+'

export default function TitleBar({ status, onRun, onStop, saveFlash }) {
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

      <button
        onClick={onRun}
        disabled={status === 'running'}
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
        disabled={status !== 'running' && status !== 'waiting'}
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
