import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts({
  onRun, onStop, onNewFile, onCloseTab, onSave, status,
  onStepOver, onStepIn, onStepOut, onContinue, onToggleBreakpoint,
  onFileSwitcher, onCommandPalette,
}) {
  const handler = useCallback((e) => {
    const mod = e.metaKey || e.ctrlKey

    if (mod && e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'running') onRun?.()
      return
    }

    if (mod && e.key === 's') {
      e.preventDefault()
      onSave?.()
      return
    }

    if (mod && e.key === 'n') {
      e.preventDefault()
      onNewFile?.()
      return
    }

    if (mod && e.key === 'w') {
      e.preventDefault()
      onCloseTab?.()
      return
    }

    if (mod && e.key === '.') {
      e.preventDefault()
      if (status === 'running' || status === 'waiting' || status === 'paused') onStop?.()
      return
    }

    if (mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault()
      onCommandPalette?.()
      return
    }

    if (mod && !e.shiftKey && e.key === 'p') {
      e.preventDefault()
      onFileSwitcher?.()
      return
    }

    if (mod && e.key === 'b') {
      e.preventDefault()
      onToggleBreakpoint?.()
      return
    }

    if (e.key === 'F10' && !mod) {
      e.preventDefault()
      if (status === 'paused') onStepOver?.()
      return
    }

    if (e.key === 'F11' && !mod && !e.shiftKey) {
      e.preventDefault()
      if (status === 'paused') onStepIn?.()
      return
    }

    if (e.key === 'F11' && e.shiftKey && !mod) {
      e.preventDefault()
      if (status === 'paused') onStepOut?.()
      return
    }

    if (e.key === 'F5' && !mod) {
      e.preventDefault()
      if (status === 'paused') onContinue?.()
      return
    }
  }, [onRun, onStop, onNewFile, onCloseTab, onSave, status,
      onStepOver, onStepIn, onStepOut, onContinue, onToggleBreakpoint,
      onFileSwitcher, onCommandPalette])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
