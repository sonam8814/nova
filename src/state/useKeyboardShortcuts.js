import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts({ onRun, onStop, onNewFile, onCloseTab, onSave, status }) {
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
      if (status === 'running' || status === 'waiting') onStop?.()
      return
    }
  }, [onRun, onStop, onNewFile, onCloseTab, onSave, status])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
