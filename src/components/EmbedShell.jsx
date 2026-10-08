import { useState, useRef, useCallback } from 'react'
import CodeEditor from './CodeEditor.jsx'
import Terminal from './Terminal.jsx'

export default function EmbedShell({ project, runner, onRun, settings, resolvedTheme }) {
  const { files, activeFile, updateFileContent } = project
  const { status, output, elapsedMs, stop } = runner
  const [outputFrac] = useState(0.3)
  const editorRef = useRef(null)

  const handleErrorClick = useCallback((loc) => {
    if (loc.line) editorRef.current?.jumpToLine(loc.line, loc.column)
  }, [])

  const editorFrac = 1 - outputFrac

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--ink-900)',
      overflow: 'hidden',
    }}>
      {/* Thin header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 10px',
        height: '28px',
        borderBottom: '1px solid var(--rule)',
        backgroundColor: 'var(--ink-900)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Newsreader', serif",
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--vellum)',
        }}>
          nova
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={onRun}
          disabled={status === 'running'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 10px',
            borderRadius: '3px',
            border: 'none',
            backgroundColor: 'var(--run)',
            color: 'var(--ink-900)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            cursor: status === 'running' ? 'default' : 'pointer',
            opacity: status === 'running' ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: '9px' }}>&#9654;</span>
          Run
        </button>

        <button
          onClick={stop}
          disabled={status !== 'running' && status !== 'waiting'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 10px',
            borderRadius: '3px',
            border: 'none',
            backgroundColor: 'var(--halt)',
            color: 'var(--vellum)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            cursor: (status !== 'running' && status !== 'waiting') ? 'default' : 'pointer',
            opacity: (status !== 'running' && status !== 'waiting') ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: '8px' }}>&#9632;</span>
          Stop
        </button>
      </div>

      {/* Editor */}
      <div style={{ flex: editorFrac, minHeight: 0 }}>
        <CodeEditor
          ref={editorRef}
          value={files[activeFile] || ''}
          onChange={(val) => updateFileContent(activeFile, val)}
          activeFile={activeFile}
          onCursorChange={() => {}}
          editorSettings={settings}
          theme={resolvedTheme}
        />
      </div>

      {/* Output resize divider */}
      <div style={{
        height: '1px',
        backgroundColor: 'var(--rule)',
        flexShrink: 0,
      }} />

      {/* Output */}
      <div style={{ flex: outputFrac, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Terminal
          output={output}
          status={status}
          elapsedMs={elapsedMs}
          onClear={runner.clearOutput}
          onErrorClick={handleErrorClick}
          activeTab="output"
          onTabChange={() => {}}
          showTimestamps={false}
          onToggleTimestamps={() => {}}
          wrapOutput={true}
          onToggleWrap={() => {}}
        />
      </div>
    </div>
  )
}
