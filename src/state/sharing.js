import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export function encodeProject(files) {
  const json = JSON.stringify(files)
  return compressToEncodedURIComponent(json)
}

export function decodeProject(hash) {
  try {
    const json = decompressFromEncodedURIComponent(hash)
    if (!json) return null
    const files = JSON.parse(json)
    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) return null
    return files
  } catch {
    return null
  }
}

export function getShareUrl(files) {
  const encoded = encodeProject(files)
  return `${window.location.origin}${window.location.pathname}#code/${encoded}`
}

export function readHashProject() {
  const hash = window.location.hash
  if (!hash.startsWith('#code/')) return null
  const encoded = hash.slice(6)
  return decodeProject(encoded)
}

export function exportProjectJSON(files) {
  const json = JSON.stringify(files, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nova-project.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importProjectJSON() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const files = JSON.parse(reader.result)
          if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
            resolve(null)
            return
          }
          resolve(files)
        } catch {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}
