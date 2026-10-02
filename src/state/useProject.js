import { useState, useRef, useCallback, useEffect } from 'react'
import { FILE_EXT } from '../lang/config.js'
import { loadProject, saveProject } from './storage.js'

const DEFAULT_ENTRY = `main${FILE_EXT}`

const DEFAULT_SOURCE = `note Welcome to nova!
remember name as "world"
show "Hello, {name}!"

count i from 1 to 15
  check if i % 15 == 0
    show "FizzBuzz"
  or if i % 3 == 0
    show "Fizz"
  or if i % 5 == 0
    show "Buzz"
  otherwise
    show i
  done
done

show "Done!"
`

function makeDefaultProject() {
  return {
    files: { [DEFAULT_ENTRY]: DEFAULT_SOURCE },
    activeFile: DEFAULT_ENTRY,
    openFiles: [DEFAULT_ENTRY],
  }
}

export function useProject() {
  const [files, setFiles] = useState({ [DEFAULT_ENTRY]: DEFAULT_SOURCE })
  const [activeFile, setActiveFile] = useState(DEFAULT_ENTRY)
  const [openFiles, setOpenFiles] = useState([DEFAULT_ENTRY])
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const saveTimerRef = useRef(null)

  useEffect(() => {
    loadProject().then((saved) => {
      if (saved && saved.files && Object.keys(saved.files).length > 0) {
        setFiles(saved.files)
        setActiveFile(saved.activeFile || Object.keys(saved.files)[0])
        setOpenFiles(saved.openFiles || Object.keys(saved.files))
      }
      setLoaded(true)
    })
  }, [])

  const persistNow = useCallback((snapshot) => {
    saveProject(snapshot)
  }, [])

  const scheduleSave = useCallback((nextFiles, nextActive, nextOpen) => {
    setDirty(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persistNow({ files: nextFiles, activeFile: nextActive, openFiles: nextOpen })
      setDirty(false)
    }, 500)
  }, [persistNow])

  const updateFileContent = useCallback((fileName, content) => {
    setFiles(prev => {
      const next = { ...prev, [fileName]: content }
      scheduleSave(next, activeFile, openFiles)
      return next
    })
  }, [activeFile, openFiles, scheduleSave])

  const selectFile = useCallback((fileName) => {
    if (!files[fileName]) return
    setActiveFile(fileName)
    setOpenFiles(prev => {
      const next = prev.includes(fileName) ? prev : [...prev, fileName]
      scheduleSave(files, fileName, next)
      return next
    })
  }, [files, scheduleSave])

  const closeFile = useCallback((fileName) => {
    setOpenFiles(prev => {
      const next = prev.filter(f => f !== fileName)
      if (next.length === 0) return prev

      let nextActive = activeFile
      if (activeFile === fileName) {
        const idx = prev.indexOf(fileName)
        nextActive = next[Math.min(idx, next.length - 1)]
        setActiveFile(nextActive)
      }

      scheduleSave(files, nextActive, next)
      return next
    })
  }, [activeFile, files, scheduleSave])

  const createFile = useCallback((fileName) => {
    if (!fileName.endsWith(FILE_EXT)) {
      fileName = fileName + FILE_EXT
    }
    if (files[fileName]) return false

    setFiles(prev => {
      const next = { ...prev, [fileName]: '' }
      setActiveFile(fileName)
      setOpenFiles(prevOpen => {
        const nextOpen = [...prevOpen, fileName]
        scheduleSave(next, fileName, nextOpen)
        return nextOpen
      })
      return next
    })
    return true
  }, [files, scheduleSave])

  const deleteFile = useCallback((fileName) => {
    if (Object.keys(files).length <= 1) return false

    setFiles(prev => {
      const next = { ...prev }
      delete next[fileName]

      setOpenFiles(prevOpen => {
        const nextOpen = prevOpen.filter(f => f !== fileName)
        let nextActive = activeFile
        if (activeFile === fileName) {
          nextActive = nextOpen[0] || Object.keys(next)[0]
          setActiveFile(nextActive)
        }
        if (!nextOpen.includes(nextActive)) {
          nextOpen.push(nextActive)
        }
        scheduleSave(next, nextActive, nextOpen)
        return nextOpen
      })
      return next
    })
    return true
  }, [activeFile, files, scheduleSave])

  const renameFile = useCallback((oldName, newName) => {
    if (!newName.endsWith(FILE_EXT)) {
      newName = newName + FILE_EXT
    }
    if (files[newName] || !files[oldName]) return false

    setFiles(prev => {
      const next = {}
      for (const [k, v] of Object.entries(prev)) {
        next[k === oldName ? newName : k] = v
      }

      const nextActive = activeFile === oldName ? newName : activeFile
      setActiveFile(nextActive)
      setOpenFiles(prevOpen => {
        const nextOpen = prevOpen.map(f => f === oldName ? newName : f)
        scheduleSave(next, nextActive, nextOpen)
        return nextOpen
      })
      return next
    })
    return true
  }, [activeFile, files, scheduleSave])

  const loadNewProject = useCallback((projectFiles, entry) => {
    const entryFile = entry || Object.keys(projectFiles)[0]
    const allFiles = Object.keys(projectFiles)
    setFiles(projectFiles)
    setActiveFile(entryFile)
    setOpenFiles(allFiles)
    setDirty(false)
    persistNow({ files: projectFiles, activeFile: entryFile, openFiles: allFiles })
  }, [persistNow])

  const isDirty = dirty || (saveTimerRef.current != null)

  return {
    files,
    activeFile,
    openFiles,
    dirty: isDirty,
    loaded,
    updateFileContent,
    selectFile,
    closeFile,
    createFile,
    deleteFile,
    renameFile,
    loadNewProject,
  }
}
