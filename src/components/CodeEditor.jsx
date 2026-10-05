import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import Editor from '@monaco-editor/react'
import { LANG_NAME } from '../lang/config.js'
import { registerNovaLanguage } from '../editor/monarch.js'
import { defineNightleafTheme, NIGHTLEAF_THEME } from '../editor/theme.js'
import { createDiagnosticsProvider } from '../editor/diagnostics.js'
import { registerCompletionProvider } from '../editor/completion.js'
import { registerHoverProvider } from '../editor/hover.js'

let languageRegistered = false

function handleBeforeMount(monaco) {
  if (!languageRegistered) {
    registerNovaLanguage(monaco)
    defineNightleafTheme(monaco)
    languageRegistered = true
  }
}

export default forwardRef(function CodeEditor({
  value, onChange, activeFile, onCursorChange, editorSettings, readOnly = false,
  breakpoints = [], onBreakpointToggle, pausedLine,
}, ref) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const diagnosticsRef = useRef(null)
  const disposablesRef = useRef([])
  const onCursorChangeRef = useRef(onCursorChange)
  const breakpointDecorationsRef = useRef([])
  const pausedDecorationsRef = useRef([])
  onCursorChangeRef.current = onCursorChange

  useImperativeHandle(ref, () => ({
    jumpToLine(line, column = 1) {
      const editor = editorRef.current
      if (!editor) return
      editor.revealLineInCenter(line)
      editor.setPosition({ lineNumber: line, column })
      editor.focus()
    },
  }), [])

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.focus()

    const diag = createDiagnosticsProvider(monaco)
    diag.attach(editor)
    diagnosticsRef.current = diag

    disposablesRef.current.push(registerCompletionProvider(monaco))
    disposablesRef.current.push(registerHoverProvider(monaco))

    const emitCursor = () => {
      const pos = editor.getPosition()
      const sel = editor.getSelection()
      let selected = 0
      if (sel && !sel.isEmpty()) {
        const model = editor.getModel()
        if (model) selected = model.getValueInRange(sel).length
      }
      onCursorChangeRef.current?.({
        line: pos?.lineNumber ?? 1,
        column: pos?.column ?? 1,
        selected,
      })
    }

    disposablesRef.current.push(editor.onDidChangeCursorPosition(emitCursor))
    disposablesRef.current.push(editor.onDidChangeCursorSelection(emitCursor))
    emitCursor()

    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position.lineNumber
        onBreakpointToggle?.(line)
      }
    })
  }, [onBreakpointToggle])

  useEffect(() => {
    return () => {
      if (diagnosticsRef.current) {
        diagnosticsRef.current.dispose()
        diagnosticsRef.current = null
      }
      for (const d of disposablesRef.current) {
        d.dispose()
      }
      disposablesRef.current = []
    }
  }, [])

  useEffect(() => {
    if (diagnosticsRef.current && editorRef.current) {
      diagnosticsRef.current.updateModel(editorRef.current)
    }
  }, [activeFile])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    const decorations = breakpoints.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: 'nova-breakpoint-glyph',
        glyphMarginHoverMessage: { value: 'Breakpoint' },
      },
    }))

    breakpointDecorationsRef.current = editor.deltaDecorations(
      breakpointDecorationsRef.current,
      decorations,
    )
  }, [breakpoints])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    const decorations = pausedLine
      ? [{
          range: new monaco.Range(pausedLine, 1, pausedLine, 1),
          options: {
            isWholeLine: true,
            className: 'nova-paused-line',
            glyphMarginClassName: 'nova-paused-glyph',
          },
        }]
      : []

    pausedDecorationsRef.current = editor.deltaDecorations(
      pausedDecorationsRef.current,
      decorations,
    )

    if (pausedLine) {
      editor.revealLineInCenter(pausedLine)
    }
  }, [pausedLine])

  const handleChange = useCallback((newValue) => {
    if (onChange) onChange(newValue)
  }, [onChange])

  return (
    <Editor
      defaultLanguage={LANG_NAME}
      theme={NIGHTLEAF_THEME}
      value={value}
      onChange={handleChange}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: editorSettings?.fontSize ?? 14,
        lineHeight: Math.round((editorSettings?.fontSize ?? 14) * 1.65),
        minimap: { enabled: editorSettings?.minimap ?? false },
        renderWhitespace: 'none',
        bracketPairColorization: { enabled: false },
        cursorBlinking: 'solid',
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        glyphMargin: true,
        folding: false,
        lineNumbersMinChars: 3,
        automaticLayout: true,
        tabSize: editorSettings?.tabSize ?? 2,
        insertSpaces: true,
        wordWrap: editorSettings?.wordWrap ? 'on' : 'off',
        readOnly,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          useShadows: false,
        },
        suggest: {
          showKeywords: false,
        },
      }}
    />
  )
})
