const GIST_API = 'https://api.github.com/gists'

const EMPTY_MARKER = 'note (empty file)\n'

export class GistAuthError extends Error {}

export async function exportToGist(files, token) {
  const payload = {}
  for (const [name, content] of Object.entries(files)) {
    payload[name] = { content: content.trim() ? content : EMPTY_MARKER }
  }

  const res = await fetch(GIST_API, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Nova project',
      public: false,
      files: payload,
    }),
  })

  if (res.status === 401 || res.status === 403) {
    throw new GistAuthError('GitHub rejected the token. It needs the "gist" scope.')
  }
  if (!res.ok) {
    throw new Error(`GitHub returned ${res.status}.`)
  }

  const data = await res.json()
  return { url: data.html_url }
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
      result[name] = file.content === EMPTY_MARKER ? '' : (file.content || '')
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
