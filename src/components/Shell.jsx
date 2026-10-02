import { useState, useRef, useCallback } from 'react'
import TitleBar from './TitleBar.jsx'
import FileTree from './FileTree.jsx'
import TabBar from './TabBar.jsx'
import CodeEditor from './CodeEditor.jsx'
import Terminal from './Terminal.jsx'
import InputPanel from './InputPanel.jsx'

const MIN_SIDEBAR = 140
const MAX_SIDEBAR = 400
const MIN_OUTPUT_FRAC = 0.15
const MAX_OUTPUT_FRAC = 0.7

export default function Shell({
  project,
  runner,
  onRun,
}) {
  const {
    files, activeFile, openFiles, loaded,
    updateFileContent, selectFile, closeFile,
    createFile, deleteFile, renameFile,
  } = project

  const {
    status, output, error, elapsedMs,
    stop, sendInput,
  } = runner

  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [outputFrac, setOutputFrac] = useState(0.3)

  const shellRef = useRef(null)
  const centerRef = useRef(null)

  const handleSidebarDrag = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (ev) => {
      const delta = ev.clientX - startX
      const next = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, startWidth + delta))
      setSidebarWidth(next)
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [sidebarWidth])

  const handleOutputDrag = useCallback((e) => {
    e.preventDefault()
    const centerEl = centerRef.current
    if (!centerEl) return

    const onMove = (ev) => {
      const rect = centerEl.getBoundingClientRect()
      const totalH = rect.height
      if (totalH === 0) return
      const yInCenter = ev.clientY - rect.top
      const editorFrac = yInCenter / totalH
      const newOutputFrac = 1 - editorFrac
      setOutputFrac(Math.max(MIN_OUTPUT_FRAC, Math.min(MAX_OUTPUT_FRAC, newOutputFrac)))
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [])

  if (!loaded) return null

  const editorFrac = 1 - outputFrac

  return (
    <div
      ref={shellRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--ink-900)',
        overflow: 'hidden',
      }}
    >
      <TitleBar status={status} onRun={onRun} onStop={stop} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: sidebarWidth, flexShrink: 0, minHeight: 0 }}>
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelect={selectFile}
            onCreate={createFile}
            onDelete={deleteFile}
            onRename={renameFile}
          />
        </div>

        {/* Sidebar resize handle */}
        <div
          onPointerDown={handleSidebarDrag}
          style={{
            width: '1px',
            backgroundColor: 'var(--rule)',
            cursor: 'col-resize',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '-3px',
            width: '7px',
            cursor: 'col-resize',
          }} />
        </div>

        {/* Center: editor + output */}
        <div
          ref={centerRef}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}
        >
          <TabBar
            openFiles={openFiles}
            activeFile={activeFile}
            onSelect={selectFile}
            onClose={closeFile}
          />

          {/* Editor */}
          <div style={{ flex: editorFrac, minHeight: 0, position: 'relative' }}>
            <CodeEditor
              value={files[activeFile] || ''}
              onChange={(val) => updateFileContent(activeFile, val)}
            />
          </div>

          {/* Output resize handle */}
          <div
            onPointerDown={handleOutputDrag}
            style={{
              height: '1px',
              backgroundColor: 'var(--rule)',
              cursor: 'row-resize',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '-3px',
              height: '7px',
              cursor: 'row-resize',
            }} />
          </div>

          {/* Output panel */}
          <div style={{ flex: outputFrac, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Terminal output={output} status={status} elapsedMs={elapsedMs} />
            <InputPanel visible={status === 'waiting'} onSubmit={sendInput} />
          </div>
        </div>
      </div>
    </div>
  )
}
