import { useState, useRef, useCallback, useEffect } from 'react'

export function useRunner() {
  const [status, setStatus] = useState('idle')
  const [output, setOutput] = useState([])
  const [error, setError] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(null)

  const workerRef = useRef(null)
  const bufferRef = useRef([])
  const rafRef = useRef(null)

  const flushBuffer = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (bufferRef.current.length === 0) return
    const batch = bufferRef.current
    bufferRef.current = []
    setOutput(prev => prev.concat(batch))
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      flushBuffer()
    })
  }, [flushBuffer])

  const createWorker = useCallback(() => {
    const worker = new Worker(
      new URL('../worker/runner.worker.js', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e) => {
      const msg = e.data

      switch (msg.type) {
        case 'output':
          bufferRef.current.push({ text: msg.text, stream: msg.stream })
          scheduleFlush()
          break
        case 'error':
          setError(msg.error)
          break
        case 'done':
          flushBuffer()
          setElapsedMs(msg.ms)
          setStatus('done')
          break
        case 'needInput':
          setStatus('waiting')
          break
      }
    }

    worker.onerror = (e) => {
      e.preventDefault()
      setError({ kind: 'InternalError', message: e.message || 'Worker crashed.' })
      setStatus('done')
    }

    return worker
  }, [scheduleFlush, flushBuffer])

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  const run = useCallback((files, entry) => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    bufferRef.current = []
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    setOutput([])
    setError(null)
    setElapsedMs(null)
    setStatus('running')

    const worker = createWorker()
    workerRef.current = worker
    worker.postMessage({ type: 'run', files, entry })
  }, [createWorker])

  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    bufferRef.current = []

    flushBuffer()
    setOutput(prev => prev.concat({ text: 'Program stopped.', stream: 'err' }))
    setStatus('idle')
    setElapsedMs(null)
  }, [flushBuffer])

  const sendInput = useCallback((text) => {
    if (workerRef.current && status === 'waiting') {
      workerRef.current.postMessage({ type: 'input', text })
      setStatus('running')
    }
  }, [status])

  const clearOutput = useCallback(() => {
    setOutput([])
    setError(null)
    setElapsedMs(null)
    bufferRef.current = []
  }, [])

  return {
    status,
    output,
    error,
    elapsedMs,
    run,
    stop,
    sendInput,
    clearOutput,
  }
}
