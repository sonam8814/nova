import { useState, useRef, useEffect } from 'react'

export default function InputPanel({ visible, onSubmit }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  if (!visible) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(value)
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 12px',
        borderTop: '1px solid var(--rule)',
        backgroundColor: 'var(--ink-800)',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer…"
        style={{
          flex: 1,
          padding: '6px 10px',
          backgroundColor: 'var(--ink-750)',
          color: 'var(--vellum)',
          border: '1px solid var(--rule)',
          borderRadius: '3px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '6px 16px',
          borderRadius: '3px',
          border: 'none',
          backgroundColor: 'var(--gold)',
          color: 'var(--ink-900)',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </form>
  )
}
