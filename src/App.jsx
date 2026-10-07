import { useCallback } from 'react'
import { useRunner } from './state/useRunner.js'
import { useProject } from './state/useProject.js'
import { useSettings } from './state/useSettings.js'
import { useConsole } from './state/useConsole.js'
import Shell from './components/Shell.jsx'

export default function App() {
  const project = useProject()
  const runner = useRunner()
  const { settings, update: updateSetting } = useSettings()
  const consoleState = useConsole()

  const handleRun = useCallback(() => {
    runner.run(project.files, project.activeFile)
  }, [runner, project.files, project.activeFile])

  return (
    <Shell
      project={project}
      runner={runner}
      onRun={handleRun}
      settings={settings}
      onUpdateSetting={updateSetting}
      consoleState={consoleState}
    />
  )
}
