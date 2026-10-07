import { ModuleLoader } from '../lang/modules.js'
import { formatError } from '../lang/errors.js'
import { serializeScopes } from '../lang/values.js'

export async function runProgram({ files, entry, breakpoints }, post, waitForInput, waitForStep) {
  const fileStore = new Map()
  const start = performance.now()
  const bpSet = new Set((breakpoints || []).map(bp => `${bp.file}:${bp.line}`))

  let stepMode = null // null | 'in' | 'over' | 'out' | 'continue'
  let pauseDepth = 0

  const debugHook = breakpoints
    ? async (node, env, callStack, fileName) => {
        const line = node.loc.line
        const key = `${fileName}:${line}`
        const currentDepth = callStack.length

        let shouldPause = false

        if (stepMode === 'in') {
          shouldPause = true
        } else if (stepMode === 'over') {
          shouldPause = currentDepth <= pauseDepth
        } else if (stepMode === 'out') {
          shouldPause = currentDepth < pauseDepth
        } else if (bpSet.has(key)) {
          shouldPause = true
        }

        if (!shouldPause) return

        const scopes = serializeScopes(env)
        const serializedStack = callStack.map(f => ({ ...f }))

        post({
          type: 'paused',
          line,
          file: fileName,
          scopes,
          callStack: serializedStack,
        })

        const command = await waitForStep()
        stepMode = command.mode
        pauseDepth = currentDepth
      }
    : null

  const fileSystem = {
    read(path) {
      if (!fileStore.has(path)) return null
      return fileStore.get(path)
    },
    write(path, content) {
      fileStore.set(path, content)
    },
    remove(path) {
      fileStore.delete(path)
    },
    list() {
      return [...fileStore.keys()].sort()
    },
  }

  const onAsk = waitForInput
    ? async (prompt) => {
        post({ type: 'output', text: prompt, stream: 'out' })
        post({ type: 'needInput' })
        return await waitForInput()
      }
    : null

  try {
    const loader = new ModuleLoader(files, {
      output: (text) => {
        post({ type: 'output', text, stream: 'out', ms: Math.round(performance.now() - start) })
      },
      onAsk,
      fileSystem,
      debugHook,
    })

    await loader.load(entry)

    const ms = Math.round(performance.now() - start)
    post({ type: 'done', ms })
  } catch (e) {
    if (e.errorData) {
      const formatted = formatError(files, e.errorData)
      post({ type: 'output', text: formatted, stream: 'err', ms: Math.round(performance.now() - start) })
      post({ type: 'error', error: e.errorData })
    } else {
      post({
        type: 'output',
        text: `InternalError: ${e.message}`,
        stream: 'err',
        ms: Math.round(performance.now() - start),
      })
      post({
        type: 'error',
        error: { kind: 'InternalError', message: e.message },
      })
    }

    const ms = Math.round(performance.now() - start)
    post({ type: 'done', ms })
  }
}

export function updateBreakpoints(bpSet, breakpoints) {
  bpSet.clear()
  for (const bp of breakpoints) {
    bpSet.add(`${bp.file}:${bp.line}`)
  }
}

if (typeof self !== 'undefined') {
  let inputResolve = null
  let stepResolve = null
  let currentBreakpoints = null

  function waitForInput() {
    return new Promise((resolve) => {
      inputResolve = resolve
    })
  }

  function waitForStep() {
    return new Promise((resolve) => {
      stepResolve = resolve
    })
  }

  self.onmessage = function (e) {
    const { type, ...data } = e.data

    switch (type) {
      case 'run':
        currentBreakpoints = data.breakpoints || null
        runProgram(data, (msg) => self.postMessage(msg), waitForInput, waitForStep)
        break
      case 'input':
        if (inputResolve) {
          const resolve = inputResolve
          inputResolve = null
          resolve(data.text)
        }
        break
      case 'step':
        if (stepResolve) {
          const resolve = stepResolve
          stepResolve = null
          resolve({ mode: data.mode })
        }
        break
      case 'updateBreakpoints':
        currentBreakpoints = data.breakpoints
        break
    }
  }
}
