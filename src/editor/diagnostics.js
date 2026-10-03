import { LANG_NAME } from '../lang/config.js'

export function createDiagnosticsProvider(monaco) {
  let worker = null
  let timer = null
  let version = 0
  let currentModel = null

  function getWorker() {
    if (!worker) {
      worker = new Worker(
        new URL('../worker/lint.worker.js', import.meta.url),
        { type: 'module' }
      )
      worker.onmessage = (e) => {
        const { markers, version: responseVersion } = e.data
        if (responseVersion !== version) return
        if (!currentModel || currentModel.isDisposed()) return
        monaco.editor.setModelMarkers(currentModel, 'nova', markers)
      }
    }
    return worker
  }

  function lint(model) {
    currentModel = model
    version++
    const v = version
    const source = model.getValue()
    const uri = model.uri.toString()
    const fileName = uri.split('/').pop() || 'main.nova'

    getWorker().postMessage({ source, fileName, version: v })
  }

  function scheduleCheck(model) {
    if (timer != null) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      lint(model)
    }, 400)
  }

  let disposable = null

  function attach(editor) {
    const model = editor.getModel()
    if (!model) return

    currentModel = model
    lint(model)

    disposable = model.onDidChangeContent(() => {
      scheduleCheck(model)
    })
  }

  function updateModel(editor) {
    if (disposable) {
      disposable.dispose()
      disposable = null
    }

    const model = editor.getModel()
    if (!model) return

    currentModel = model
    lint(model)

    disposable = model.onDidChangeContent(() => {
      scheduleCheck(model)
    })
  }

  function dispose() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    if (disposable) {
      disposable.dispose()
      disposable = null
    }
    if (worker) {
      worker.terminate()
      worker = null
    }
    if (currentModel && !currentModel.isDisposed()) {
      monaco.editor.setModelMarkers(currentModel, 'nova', [])
    }
    currentModel = null
  }

  return { attach, updateModel, dispose }
}
