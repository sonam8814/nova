import { ModuleLoader } from '../lang/modules.js'
import { formatError } from '../lang/errors.js'

export function runProgram({ files, entry }, post) {
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

  try {
    const loader = new ModuleLoader(files, {
      output: (text) => {
        post({ type: 'output', text, stream: 'out' })
      },
      fileSystem,
    })

    loader.load(entry)

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
  self.onmessage = function (e) {
    const { type, ...data } = e.data

    switch (type) {
      case 'run':
        runProgram(data, (msg) => self.postMessage(msg))
        break
    }
  }
}
