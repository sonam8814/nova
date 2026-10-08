import { useCallback, useState, useEffect } from 'react'
import { useRunner } from './state/useRunner.js'
import { useProject } from './state/useProject.js'
import { useSettings } from './state/useSettings.js'
import { useConsole } from './state/useConsole.js'
import Shell from './components/Shell.jsx'
import EmbedShell from './components/EmbedShell.jsx'

const IS_EMBED = (() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('embed') === '1' || params.get('embed') === 'true'
})()

function useResolvedTheme(themeSetting) {
  const [resolved, setResolved] = useState(() =>
    themeSetting === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeSetting
  )

  useEffect(() => {
    if (themeSetting !== 'system') {
      setResolved(themeSetting)
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setResolved(mq.matches ? 'dark' : 'light')
    const handler = (e) => setResolved(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeSetting])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  return resolved
}

export default function App() {
  const project = useProject()
  const runner = useRunner()
  const { settings, update: updateSetting } = useSettings()
  const consoleState = useConsole()
  const resolvedTheme = useResolvedTheme(settings.theme)

  const handleRun = useCallback(() => {
    runner.run(project.files, project.activeFile)
  }, [runner, project.files, project.activeFile])

  if (IS_EMBED) {
    return (
      <EmbedShell
        project={project}
        runner={runner}
        onRun={handleRun}
        settings={settings}
        resolvedTheme={resolvedTheme}
      />
    )
  }

  return (
    <Shell
      project={project}
      runner={runner}
      onRun={handleRun}
      settings={settings}
      onUpdateSetting={updateSetting}
      consoleState={consoleState}
      resolvedTheme={resolvedTheme}
    />
  )
}
