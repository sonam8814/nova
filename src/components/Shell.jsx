import { useState, useRef, useCallback } from 'react'
import TitleBar from './TitleBar.jsx'
import FileTree from './FileTree.jsx'
import TabBar from './TabBar.jsx'
import CodeEditor from './CodeEditor.jsx'
import Terminal from './Terminal.jsx'
import Console from './Console.jsx'
import InputPanel from './InputPanel.jsx'
import StatusBar from './StatusBar.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import DebugPanel from './DebugPanel.jsx'
import FileSwitcher from './FileSwitcher.jsx'
import ShareDialog from './ShareDialog.jsx'
import CommandPalette, { useCommands } from './CommandPalette.jsx'
import { getShareUrl, exportProjectJSON, importProjectJSON } from '../state/sharing.js'
import { useKeyboardShortcuts } from '../state/useKeyboardShortcuts.js'

const MIN_SIDEBAR = 140
const MAX_SIDEBAR = 400
const MIN_DEBUG_RAIL = 180
const MAX_DEBUG_RAIL = 450
const MIN_OUTPUT_FRAC = 0.15
const MAX_OUTPUT_FRAC = 0.7

export default function Shell({
  project,
  runner,
  onRun,
  settings,
  onUpdateSetting,
  consoleState,
}) {
  const {
    files, activeFile, openFiles, loaded,
    updateFileContent, selectFile, closeFile,
    createFile, deleteFile, renameFile,
    loadNewProject,
  } = project

  const {
    status, output, error, elapsedMs,
    stop, sendInput, debugState,
    stepIn, stepOver, stepOut, continueExec,
    setBreakpoints,
  } = runner

  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [debugRailWidth, setDebugRailWidth] = useState(260)
  const [outputFrac, setOutputFrac] = useState(0.3)
  const [saveFlash, setSaveFlash] = useState(0)
  const [cursor, setCursor] = useState({ line: 1, column: 1, selected: 0 })
  const [showSettings, setShowSettings] = useState(false)
  const [breakpoints, setBreakpointsState] = useState([])
  const [showFileSwitcher, setShowFileSwitcher] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [outputTab, setOutputTab] = useState('output')

  const shellRef = useRef(null)
  const centerRef = useRef(null)
  const editorRef = useRef(null)

  const handleSave = useCallback(() => {
    setSaveFlash(prev => prev + 1)
  }, [])

  const handleNewFile = useCallback(() => {
    const base = 'untitled'
    let name = base
    let n = 1
    const ext = '.nova'
    while (files[name + ext]) {
      name = `${base}${n}`
      n++
    }
    createFile(name)
  }, [files, createFile])

  const handleCloseTab = useCallback(() => {
    if (openFiles.length > 1) {
      closeFile(activeFile)
    }
  }, [openFiles, activeFile, closeFile])

  const handleErrorClick = useCallback((loc) => {
    if (loc.file && files[loc.file] && loc.file !== activeFile) {
      selectFile(loc.file)
    }
    setTimeout(() => {
      editorRef.current?.jumpToLine(loc.line, loc.column)
    }, 50)
  }, [files, activeFile, selectFile])

  const handleToggleBreakpoint = useCallback(() => {
    const line = cursor.line
    const file = activeFile
    setBreakpointsState(prev => {
      const exists = prev.find(bp => bp.file === file && bp.line === line)
      const next = exists
        ? prev.filter(bp => !(bp.file === file && bp.line === line))
        : [...prev, { file, line }]
      setBreakpoints(next)
      return next
    })
  }, [cursor.line, activeFile, setBreakpoints])

  const handleBreakpointToggle = useCallback((line) => {
    const file = activeFile
    setBreakpointsState(prev => {
      const exists = prev.find(bp => bp.file === file && bp.line === line)
      const next = exists
        ? prev.filter(bp => !(bp.file === file && bp.line === line))
        : [...prev, { file, line }]
      setBreakpoints(next)
      return next
    })
  }, [activeFile, setBreakpoints])

  const handleFileSwitcher = useCallback(() => {
    setShowFileSwitcher(prev => !prev)
  }, [])

  const handleShare = useCallback(() => {
    setShareUrl(getShareUrl(files))
  }, [files])

  const handleExport = useCallback(() => {
    exportProjectJSON(files)
  }, [files])

  const handleImport = useCallback(async () => {
    const imported = await importProjectJSON()
    if (imported) loadNewProject(imported)
  }, [loadNewProject])

  const handleCommandPalette = useCallback(() => {
    setShowCommandPalette(prev => !prev)
  }, [])

  const commands = useCommands({
    onRun,
    onStop: stop,
    status,
    onNewFile: handleNewFile,
    onCloseTab: handleCloseTab,
    onSave: handleSave,
    onShare: handleShare,
    onExport: handleExport,
    onImport: handleImport,
    onToggleSettings: () => setShowSettings(prev => !prev),
    onToggleBreakpoint: handleToggleBreakpoint,
    onFileSwitcher: handleFileSwitcher,
    onStepIn: stepIn,
    onStepOver: stepOver,
    onStepOut: stepOut,
    onContinue: continueExec,
    onClearOutput: runner.clearOutput,
    onShowOutput: () => setOutputTab('output'),
    onShowConsole: () => setOutputTab('console'),
    onResetConsole: consoleState.reset,
  })

  useKeyboardShortcuts({
    onRun,
    onStop: stop,
    onNewFile: handleNewFile,
    onCloseTab: handleCloseTab,
    onSave: handleSave,
    status,
    onStepOver: stepOver,
    onStepIn: stepIn,
    onStepOut: stepOut,
    onContinue: continueExec,
    onToggleBreakpoint: handleToggleBreakpoint,
    onFileSwitcher: handleFileSwitcher,
    onCommandPalette: handleCommandPalette,
  })

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

  const handleDebugRailDrag = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = debugRailWidth

    const onMove = (ev) => {
      const delta = startX - ev.clientX
      const next = Math.max(MIN_DEBUG_RAIL, Math.min(MAX_DEBUG_RAIL, startWidth + delta))
      setDebugRailWidth(next)
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
  }, [debugRailWidth])

  const handleFrameClick = useCallback((loc) => {
    if (loc.file && files[loc.file] && loc.file !== activeFile) {
      selectFile(loc.file)
    }
    if (loc.line) {
      setTimeout(() => {
        editorRef.current?.jumpToLine(loc.line)
      }, 50)
    }
  }, [files, activeFile, selectFile])

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
      <TitleBar
        status={status}
        onRun={onRun}
        onStop={stop}
        saveFlash={saveFlash}
        files={files}
        onImport={loadNewProject}
        onShare={handleShare}
        onStepIn={stepIn}
        onStepOver={stepOver}
        onStepOut={stepOut}
        onContinue={continueExec}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div className="nova-fade-panel" style={{ width: sidebarWidth, flexShrink: 0, minHeight: 0 }}>
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelect={selectFile}
            onCreate={createFile}
            onDelete={deleteFile}
            onRename={renameFile}
            onLoadExample={loadNewProject}
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
          className="nova-fade-panel"
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
              ref={editorRef}
              value={files[activeFile] || ''}
              onChange={(val) => updateFileContent(activeFile, val)}
              activeFile={activeFile}
              onCursorChange={setCursor}
              editorSettings={settings}
              breakpoints={breakpoints.filter(bp => bp.file === activeFile).map(bp => bp.line)}
              onBreakpointToggle={handleBreakpointToggle}
              pausedLine={debugState && debugState.file === activeFile ? debugState.line : null}
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
            <Terminal
              output={output}
              status={status}
              elapsedMs={elapsedMs}
              onClear={runner.clearOutput}
              onErrorClick={handleErrorClick}
              activeTab={outputTab}
              onTabChange={setOutputTab}
              onConsoleClear={consoleState.clearEntries}
              onConsoleReset={consoleState.reset}
              consoleHasEntries={consoleState.entries.length > 0}
              consoleSlot={
                <Console
                  entries={consoleState.entries}
                  busy={consoleState.busy}
                  onEvaluate={consoleState.evaluate}
                  onClear={consoleState.clearEntries}
                  onReset={consoleState.reset}
                />
              }
            />
            <InputPanel visible={status === 'waiting'} onSubmit={sendInput} />
          </div>
        </div>

        {/* Debug rail — visible when paused */}
        {debugState && (
          <>
            <div
              onPointerDown={handleDebugRailDrag}
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
            <div style={{ width: debugRailWidth, flexShrink: 0, minHeight: 0 }}>
              <DebugPanel
                debugState={debugState}
                onFrameClick={handleFrameClick}
              />
            </div>
          </>
        )}
      </div>

      {showFileSwitcher && (
        <FileSwitcher
          files={files}
          activeFile={activeFile}
          onSelect={selectFile}
          onClose={() => setShowFileSwitcher(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          commands={commands}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {shareUrl && (
        <ShareDialog
          url={shareUrl}
          onClose={() => setShareUrl(null)}
        />
      )}

      <div style={{ position: 'relative' }}>
        <StatusBar
          cursor={cursor}
          activeFile={activeFile}
          content={files[activeFile] || ''}
          tabSize={settings.tabSize}
          onToggleSettings={() => setShowSettings(prev => !prev)}
        />
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onUpdate={onUpdateSetting}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}
