const CODE_FENCE = /```([\s\S]*?)```/g
const CODE_SPAN = /`([^`]+)`/g
const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const BOLD = /\*\*([^*]+)\*\*/g

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function inline(text) {
  const escaped = escapeHtml(text)
  const spans = []
  let output = escaped.replace(CODE_SPAN, (_, content) => {
    spans.push(`<code>${content}</code>`)
    return `\u0000${spans.length - 1}\u0000`
  })
  output = output
    .replace(LINK, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(BOLD, '<strong>$1</strong>')
  output = output.replace(/\u0000(\d+)\u0000/g, (_, index) => spans[Number(index)])
  return output.replace(/\n/g, '<br>')
}

function renderBlock(block) {
  if (block.startsWith('### ')) return `<h4>${inline(block.slice(4))}</h4>`
  if (block.startsWith('## ')) return `<h3>${inline(block.slice(3))}</h3>`
  if (block.startsWith('# ')) return `<h2>${inline(block.slice(2))}</h2>`

  const lines = block.split('\n').filter((line) => line.trim() !== '')
  const listItems = lines.filter((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line))
  if (listItems.length === lines.length && lines.length > 0) {
    const ordered = /^\s*\d+\.\s+/.test(listItems[0])
    const items = listItems
      .map((line) => `<li>${inline(line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))}</li>`)
      .join('')
    return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`
  }
  return `<p>${inline(block)}</p>`
}

function renderProse(text) {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n{2,}/)
    .map((block) => renderBlock(block.trim()))
    .join('\n')
}

export function renderMarkdown(text) {
  const parts = []
  let lastIndex = 0
  let match
  CODE_FENCE.lastIndex = 0
  while ((match = CODE_FENCE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(renderProse(text.slice(lastIndex, match.index)))
    const raw = match[1]
    const newlineIndex = raw.indexOf('\n')
    const code = (newlineIndex === -1 ? raw : raw.slice(newlineIndex + 1)).replace(/\n$/, '')
    parts.push(`<pre class="ai-code">${escapeHtml(code)}</pre>`)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(renderProse(text.slice(lastIndex)))
  return parts.join('\n')
}
