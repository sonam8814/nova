import { useState, useRef, useEffect } from 'react'

const WARNING_THRESHOLD = 8000

export default function ShareDialog({ url, onClose }) {
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    inputRef.current?.select()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const charCount = url.length
  const isLong = charCount > WARNING_THRESHOLD

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-label="Share project"
        style={{
          backgroundColor: 'var(--ink-750)',
          border: '1px solid var(--rule)',
          borderRadius: '3px',
          padding: '24px',
          width: '520px',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <div style={{
          fontFamily: "'Newsreader', serif",
          fontSize: '18px',
          fontWeight: 500,
          color: 'var(--vellum)',
          marginBottom: '16px',
        }}>
          Share project
        </div>

        <div style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--vellum-mid)',
          marginBottom: '12px',
        }}>
          Anyone with this link can open a copy of your project.
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            style={{
              flex: 1,
              backgroundColor: 'var(--ink-800)',
              border: '1px solid var(--rule)',
              borderRadius: '3px',
              padding: '8px 10px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              color: 'var(--vellum)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: copied ? 'var(--sage)' : 'var(--lapis)',
              color: copied ? 'var(--ink-900)' : 'var(--ink-900)',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s',
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '12px',
            color: isLong ? 'var(--halt)' : 'var(--vellum-dim)',
          }}>
            {charCount.toLocaleString()} characters
            {isLong && ' — some browsers may truncate links this long'}
          </span>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--rule)',
              borderRadius: '3px',
              padding: '4px 12px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px',
              color: 'var(--vellum-dim)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
