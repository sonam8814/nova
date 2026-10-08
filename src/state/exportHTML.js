import { compressToEncodedURIComponent } from 'lz-string'

const KEYWORDS = [
  'remember', 'show', 'define', 'check if', 'otherwise', 'done',
  'give back', 'while', 'count', 'describe', 'has', 'set', 'my',
  'ask', 'or if', 'and', 'or', 'not', 'yes', 'no', 'nothing',
  'new', 'try', 'rescue', 'always', 'import', 'from', 'repeat',
  'stop loop', 'skip ahead', 'each', 'in', 'note', 'with', 'to',
  'as', 'gives', 'needs',
]

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightLine(line) {
  const escaped = escapeHTML(line)
  if (/^\s*note\b/.test(line)) {
    return `<span style="color:#5F5C55;font-style:italic">${escaped}</span>`
  }
  let result = escaped
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, m => `<span style="color:#9DBA6E">${m}</span>`)
  result = result.replace(/(?<!["\w])(\d+(?:\.\d+)?)(?!["\w])/g, `<span style="color:#D2A24C">$1</span>`)
  const kwPattern = KEYWORDS
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const kwRe = new RegExp(`(?<![a-zA-Z_])(${kwPattern})(?![a-zA-Z_])`, 'g')
  result = result.replace(kwRe, (m, kw) => {
    if (m.includes('style="color:')) return m
    return `<span style="color:#E05A4C">${kw}</span>`
  })
  return result
}

function highlightCode(source) {
  return source.split('\n').map(highlightLine).join('\n')
}

export function exportStandaloneHTML(files) {
  const encoded = compressToEncodedURIComponent(JSON.stringify(files))
  const novaUrl = `${window.location.origin}${window.location.pathname}#code/${encoded}`

  const fileEntries = Object.entries(files)
  const fileBlocks = fileEntries.map(([name, source]) => `
    <div class="file-block">
      <div class="file-name">${escapeHTML(name)}</div>
      <pre><code>${highlightCode(source)}</code></pre>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nova Project</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #101219;
    color: #E4DED0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 24px;
    width: 100%;
    flex: 1;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .brand {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 28px;
    font-weight: 500;
    color: #E4DED0;
  }
  .open-btn {
    display: inline-block;
    padding: 8px 20px;
    background: #6D92D8;
    color: #101219;
    text-decoration: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .open-btn:hover { opacity: 0.85; }
  .file-block { margin-bottom: 28px; }
  .file-name {
    font-size: 13px;
    color: #A9A395;
    padding: 8px 16px;
    background: #1B1F2B;
    border: 1px solid #2C3140;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  }
  pre {
    background: #161923;
    border: 1px solid #2C3140;
    border-radius: 0 0 4px 4px;
    padding: 16px;
    overflow-x: auto;
    tab-size: 2;
  }
  code {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #E4DED0;
  }
  .footer {
    text-align: center;
    padding: 24px;
    color: #6E6A60;
    font-size: 13px;
    border-top: 1px solid #2C3140;
  }
  @media (max-width: 600px) {
    .container { padding: 16px 12px; }
    code { font-size: 12px; }
    .brand { font-size: 22px; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="brand">nova</div>
    <a class="open-btn" href="${escapeHTML(novaUrl)}" target="_blank" rel="noopener">Open in Nova</a>
  </div>
  ${fileBlocks}
</div>
<div class="footer">Made with Nova &mdash; a plain-English programming language</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nova-project.html'
  a.click()
  URL.revokeObjectURL(url)
}
