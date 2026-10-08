const GIST_API = 'https://api.github.com/gists'
const GIST_URL = 'https://gist.github.com/'

export async function exportToGist(files) {
  const parts = []
  for (const [name, content] of Object.entries(files)) {
    parts.push(`### ${name}\n\n\`\`\`nova\n${content}\n\`\`\``)
  }
  const markdown = `# Nova Project\n\n${parts.join('\n\n')}\n`

  let copied = false
  try {
    await navigator.clipboard.writeText(markdown)
    copied = true
  } catch {
    copied = false
  }

  window.open(GIST_URL, '_blank', 'noopener')
  return { copied }
}

export async function importFromGist(gistUrl) {
  try {
    const id = extractGistId(gistUrl)
    if (!id) return null

    const res = await fetch(`${GIST_API}/${id}`)
    if (!res.ok) return null

    const data = await res.json()
    if (!data.files) return null

    const result = {}
    const entries = Object.entries(data.files)

    const novaFiles = entries.filter(([name]) => name.endsWith('.nova'))
    const source = novaFiles.length > 0 ? novaFiles : entries

    for (const [name, file] of source) {
      const key = name.endsWith('.nova') ? name : name
      result[key] = file.content || ''
    }

    if (Object.keys(result).length === 0) return null
    return result
  } catch {
    return null
  }
}

function extractGistId(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (/^[a-f0-9]{20,}$/i.test(trimmed)) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (!parsed.hostname.includes('gist.github')) return null
    const segments = parsed.pathname.split('/').filter(Boolean)
    const id = segments[segments.length - 1]
    if (!id || !/^[a-f0-9]+$/i.test(id)) return null
    return id
  } catch {
    return null
  }
}
