import { get, set, del, keys } from 'idb-keyval'

const PROJECT_KEY = 'nova:project'

export async function loadProject() {
  const data = await get(PROJECT_KEY)
  return data || null
}

export async function saveProject(project) {
  await set(PROJECT_KEY, {
    files: project.files,
    activeFile: project.activeFile,
    openFiles: project.openFiles,
  })
}

export async function clearProject() {
  await del(PROJECT_KEY)
}
