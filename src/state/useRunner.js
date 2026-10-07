import { useState, useRef, useCallback, useEffect } from 'react'

export function useRunner() {
  const [status, setStatus] = useState('idle')
  const [output, setOutput] = useState([])
  const [error, setError] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(null)
  const [debugState, setDebugState] = useState(null)
  const [runCount, setRunCount] = useState(0)

  const workerRef = useRef(null)
  const bufferRef = useRef([])
  const rafRef = useRef(null)
  const breakpointsRef = useRef([])

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
          bufferRef.current.push({ text: msg.text, stream: msg.stream, ms: msg.ms })
          scheduleFlush()
          break
        case 'error':
          setError(msg.error)
          break
        case 'done':
          flushBuffer()
          setElapsedMs(msg.ms)
          setDebugState(null)
          setStatus('done')
          break
        case 'needInput':
          setStatus('waiting')
          break
        case 'paused':
          flushBuffer()
          setDebugState({
            line: msg.line,
            file: msg.file,
            scopes: msg.scopes,
            callStack: msg.callStack,
          })
          setStatus('paused')
          break
      }
    }

    worker.onerror = (e) => {
      e.preventDefault()
      setError({ kind: 'InternalError', message: e.message || 'Worker crashed.' })
      setDebugState(null)
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
    setDebugState(null)
    setStatus('running')
    setRunCount(prev => prev + 1)

    const worker = createWorker()
    workerRef.current = worker

    const bps = breakpointsRef.current
    worker.postMessage({
      type: 'run',
      files,
      entry,
      breakpoints: bps.length > 0 ? bps : null,
    })
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
    setDebugState(null)
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

  const stepIn = useCallback(() => {
    if (workerRef.current && status === 'paused') {
      workerRef.current.postMessage({ type: 'step', mode: 'in' })
      setStatus('running')
    }
  }, [status])

  const stepOver = useCallback(() => {
    if (workerRef.current && status === 'paused') {
      workerRef.current.postMessage({ type: 'step', mode: 'over' })
      setStatus('running')
    }
  }, [status])

  const stepOut = useCallback(() => {
    if (workerRef.current && status === 'paused') {
      workerRef.current.postMessage({ type: 'step', mode: 'out' })
      setStatus('running')
    }
  }, [status])

  const continueExec = useCallback(() => {
    if (workerRef.current && status === 'paused') {
      workerRef.current.postMessage({ type: 'step', mode: 'continue' })
      setStatus('running')
    }
  }, [status])

  const setBreakpoints = useCallback((bps) => {
    breakpointsRef.current = bps
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'updateBreakpoints', breakpoints: bps })
    }
  }, [])

  return {
    status,
    output,
    error,
    elapsedMs,
    debugState,
    runCount,
    run,
    stop,
    sendInput,
    clearOutput,
    stepIn,
    stepOver,
    stepOut,
    continueExec,
    setBreakpoints,
  }
}
