import { ModuleLoader } from '../lang/modules.js'
import { formatError } from '../lang/errors.js'

export async function runProgram({ files, entry }, post, waitForInput) {
  const fileStore = new Map()
  const start = performance.now()

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
        post({ type: 'output', text, stream: 'out' })
      },
      onAsk,
      fileSystem,
    })

    await loader.load(entry)

    const ms = Math.round(performance.now() - start)
    post({ type: 'done', ms })
  } catch (e) {
    if (e.errorData) {
      const formatted = formatError(files, e.errorData)
      post({ type: 'output', text: formatted, stream: 'err' })
      post({ type: 'error', error: e.errorData })
    } else {
      post({
        type: 'output',
        text: `InternalError: ${e.message}`,
        stream: 'err',
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

if (typeof self !== 'undefined') {
  let inputResolve = null

  function waitForInput() {
    return new Promise((resolve) => {
      inputResolve = resolve
    })
  }

  self.onmessage = function (e) {
    const { type, ...data } = e.data

    switch (type) {
      case 'run':
        runProgram(data, (msg) => self.postMessage(msg), waitForInput)
        break
      case 'input':
        if (inputResolve) {
          const resolve = inputResolve
          inputResolve = null
          resolve(data.text)
        }
        break
    }
  }
}
