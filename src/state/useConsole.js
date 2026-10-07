import { useState, useRef, useCallback, useEffect } from 'react'

export function useConsole() {
  const [entries, setEntries] = useState([])
  const [busy, setBusy] = useState(false)
  const workerRef = useRef(null)
  const pendingRef = useRef([])
  const idRef = useRef(0)

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const worker = new Worker(
        new URL('../worker/console.worker.js', import.meta.url),
        { type: 'module' }
      )

      worker.onmessage = (e) => {
        const msg = e.data

        switch (msg.type) {
          case 'output':
            setEntries(prev => {
              const last = prev[prev.length - 1]
              if (last && last.type === 'input') {
                return [...prev, { type: 'output', text: msg.text }]
              }
              return [...prev, { type: 'output', text: msg.text }]
            })
            break
          case 'result':
            if (msg.value !== null) {
              setEntries(prev => [...prev, { type: 'result', text: msg.value }])
            }
            break
          case 'error':
            setEntries(prev => [...prev, { type: 'error', text: msg.text }])
            break
          case 'done':
            setBusy(false)
            break
          case 'reset-done':
            setBusy(false)
            break
        }
      }

      worker.onerror = (e) => {
        e.preventDefault()
        setEntries(prev => [...prev, { type: 'error', text: 'Console worker crashed.' }])
        setBusy(false)
        workerRef.current = null
      }

      workerRef.current = worker
    }
    return workerRef.current
  }, [])

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const evaluate = useCallback((code) => {
    const trimmed = code.trim()
    if (!trimmed) return

    setEntries(prev => [...prev, { type: 'input', text: trimmed }])
    setBusy(true)

    const worker = getWorker()
    worker.postMessage({ type: 'eval', code: trimmed })
  }, [getWorker])

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setEntries([])
    setBusy(false)
  }, [])

  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])

  return {
    entries,
    busy,
    evaluate,
    reset,
    clearEntries,
  }
}
