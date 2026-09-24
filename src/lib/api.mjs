async function request(path, options) {
  const res = await fetch(path, options)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || `request failed: ${res.status}`)
  }
  return res.json()
}

export const fetchProblems = () => request('/api/problems')

export const fetchProblem = (slug) => request(`/api/problems/${slug}`)

export const runJava = (payload) =>
  request('/api/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })

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
