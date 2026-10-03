import { useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { LANG_NAME } from '../lang/config.js'
import { registerNovaLanguage } from '../editor/monarch.js'
import { defineNightleafTheme, NIGHTLEAF_THEME } from '../editor/theme.js'
import { createDiagnosticsProvider } from '../editor/diagnostics.js'

let languageRegistered = false

function handleBeforeMount(monaco) {
  if (!languageRegistered) {
    registerNovaLanguage(monaco)
    defineNightleafTheme(monaco)
    languageRegistered = true
  }
}

export default function CodeEditor({ value, onChange, readOnly = false }) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const diagnosticsRef = useRef(null)

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.focus()

    const diag = createDiagnosticsProvider(monaco)
    diag.attach(editor)
    diagnosticsRef.current = diag
  }, [])

  useEffect(() => {
    return () => {
      if (diagnosticsRef.current) {
        diagnosticsRef.current.dispose()
        diagnosticsRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (diagnosticsRef.current && editorRef.current) {
      diagnosticsRef.current.updateModel(editorRef.current)
    }
  }, [value])

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
        fontSize: 14,
        lineHeight: 23,
        minimap: { enabled: false },
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
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'off',
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
}
