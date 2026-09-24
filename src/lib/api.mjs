// Detect Tauri runtime and use native invoke; otherwise fall back to HTTP fetch (web dev).
const isTauri = () => {
  if (typeof window === 'undefined') return false
  return !!(window.__TAURI_INTERNALS__ || window.__TAURI__)
}

let invoke = null
async function getInvoke() {
  if (invoke) return invoke
  const mod = await import('@tauri-apps/api/core')
  invoke = mod.invoke
  return invoke
}

async function tauriOrFetch(tauriCall, fetchCall) {
  if (isTauri()) {
    const inv = await getInvoke()
    return tauriCall(inv)
  }
  return fetchCall()
}

async function httpJson(path, options) {
  const res = await fetch(path, options)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || `request failed: ${res.status}`)
  }
  return res.json()
}

export const fetchProblems = () =>
  tauriOrFetch(
    (inv) => inv('list_problems'),
    () => httpJson('/api/problems')
  )

export const fetchProblem = (slug) =>
  tauriOrFetch(
    (inv) => inv('get_problem', { slug }),
    () => httpJson(`/api/problems/${slug}`)
  )

export const runJava = (payload) =>
  tauriOrFetch(
    (inv) => inv('run_java', { slug: payload.slug, code: payload.code, timeoutMs: payload.timeoutMs ?? null }),
    () =>
      httpJson('/api/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
  )

export const askAI = (payload) =>
  tauriOrFetch(
    (inv) =>
      inv('ai_chat', {
        apiBase: payload.apiBase,
        apiKey: payload.apiKey,
        model: payload.model,
        messages: payload.messages
      }),
    () =>
      httpJson('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
  )

export { isTauri }

const JAVA_TYPES = {
  integer: 'int',
  'integer[]': 'int[]',
  'integer[][]': 'int[][]',
  string: 'String',
  'string[]': 'String[]',
  boolean: 'boolean',
  double: 'double',
  'double[]': 'double[]',
  'character[]': 'char[]',
  'character[][]': 'char[][]',
  ListNode: 'ListNode',
  'ListNode[]': 'ListNode[]',
  TreeNode: 'TreeNode',
  'list<integer>': 'List<Integer>',
  'list<string>': 'List<String>',
  'list<list<integer>>': 'List<List<Integer>>',
  'list<list<string>>': 'List<List<String>>'
}

export function editorTemplate(problem) {
  if (problem.codeSnippet) return problem.codeSnippet
  const meta = problem.metaData || {}
  const params = (meta.params || [])
    .map((param) => `${JAVA_TYPES[param.type] || param.type} ${param.name}`)
    .join(', ')
  const returnType = JAVA_TYPES[meta.return?.type] || meta.return?.type || 'void'
  return `class Solution {\n    public ${returnType} ${meta.name}(${params}) {\n        \n    }\n}`
}
