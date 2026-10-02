import { useCallback } from 'react'
import { useRunner } from './state/useRunner.js'
import { useProject } from './state/useProject.js'
import Shell from './components/Shell.jsx'

export default function App() {
  const project = useProject()
  const runner = useRunner()

  const handleRun = useCallback(() => {
    runner.run(project.files, project.activeFile)
  }, [runner, project.files, project.activeFile])

  return (
    <Shell
      project={project}
      runner={runner}
      onRun={handleRun}
    />
  )
}
