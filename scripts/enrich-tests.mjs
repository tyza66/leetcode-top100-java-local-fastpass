import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problemsDir = join(root, 'data', 'problems')

function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&minus;/g, '-')
    .replace(/&times;/g, 'x')
    .replace(/\u200b/g, '')
}

function compact(text) {
  return text.replace(/\s+/g, '').replace(/'/g, '"')
}

function scanExamplePairs(html) {
  const text = html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<\/pre>/g, '\n')
    .replace(/<\/div>/g, '\n')
  const lines = stripHtml(text)
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const pairs = []
  let pendingInput = []
  let currentOutput = null
  let mode = null
  const flushOutput = () => {
    if (currentOutput !== null) {
      pairs.push({ input: compact(pendingInput.join(' ')), output: compact(currentOutput.join(' ')) })
      currentOutput = null
    }
    pendingInput = []
  }
  for (const line of lines) {
    const inputMatch = /^输入\s*[:：]?\s*(.*)$/.exec(line)
    const outputMatch = /^输出\s*[:：]?\s*(.*)$/.exec(line)
    if (inputMatch) {
      flushOutput()
      mode = 'input'
      if (inputMatch[1]) pendingInput.push(inputMatch[1])
      continue
    }
    if (outputMatch) {
      mode = 'output'
      currentOutput = []
      if (outputMatch[1]) currentOutput.push(outputMatch[1])
      continue
    }
    if (/^(示例|解释|说明|提示|约束|进阶|注意|Example|Explanation|Constraints|Follow-up)/.test(line)) {
      flushOutput()
      mode = null
      pendingInput = []
      continue
    }
    if (mode === 'input') pendingInput.push(line)
    else if (mode === 'output') currentOutput.push(line)
  }
  flushOutput()
  return pairs.filter((pair) => pair.input && pair.output)
}

const HARDCODED_EXPECTED = {
  'binary-tree-inorder-traversal': {
    '1': '[4,2,6,5,7,1,9,8,3]'
  },
  'meeting-rooms-ii': {
    '0': '2',
    '1': '1'
  }
}

function cycleNodeExpected(testCase) {
  const vals = JSON.parse(testCase[0])
  const pos = Number(testCase[1])
  return pos < 0 ? 'null' : String(vals[pos])
}

const DESIGN_SLUGS = new Set([
  'lru-cache',
  'min-stack',
  'implement-trie-prefix-tree'
])

function splitCases(problem) {
  const meta = problem.metaData || {}
  const lines = (problem.exampleTestcases || '').split('\n').filter((line) => line !== '')
  if (meta.systemdesign || DESIGN_SLUGS.has(problem.slug)) return [lines]
  const paramCount = meta.params?.length || 1
  const cases = []
  for (let i = 0; i < lines.length; i += paramCount) {
    if (lines.slice(i, i + paramCount).some(Boolean)) cases.push(lines.slice(i, i + paramCount))
  }
  return cases
}

function matchExpected(problem, cases, blocks) {
  return cases.map((testCase) => {
    const joinedWithComma = compact(testCase.join(','))
    const joinedWithoutComma = compact(testCase.join(''))
    const block = blocks.find((candidate) => {
      const input = candidate.input.replace(/[A-Za-z_][A-Za-z0-9_]*\s*=/g, '')
      return input && (
        input.includes(joinedWithComma) ||
        input.includes(joinedWithoutComma) ||
        joinedWithComma.includes(input) ||
        joinedWithoutComma.includes(input)
      )
    })
    return block?.output ?? null
  })
}

function intersectionExpected(testCase) {
  const intersectVal = JSON.parse(testCase[0])
  if (intersectVal === 0) return '[]'
  const listA = JSON.parse(testCase[1])
  const skipA = Number(testCase[3])
  return `[${listA.slice(skipA).join(',')}]`
}

async function main() {
  const files = (await readdir(problemsDir)).filter(
    (file) => file.endsWith('.json') && file !== 'index.json'
  )
  let missing = 0
  for (const file of files) {
    const path = join(problemsDir, file)
    const problem = JSON.parse(await readFile(path, 'utf8'))
    const cases = splitCases(problem)
    const blocks = scanExamplePairs(problem.contentHtml || '')
    const expected = matchExpected(problem, cases, blocks)
    const tests = cases.map((testCase, index) => {
      let value = expected[index]
      if (value === null) {
        value = HARDCODED_EXPECTED[problem.slug]?.[String(index)] ?? null
      }
      if (problem.slug === 'intersection-of-two-linked-lists') {
        value = intersectionExpected(testCase)
      }
      if (problem.slug === 'linked-list-cycle-ii') {
        value = cycleNodeExpected(testCase)
      }
      return { input: testCase, expected: value }
    })
    if (tests.some((test) => !test.expected)) missing += 1
    problem.tests = tests
    await writeFile(path, `${JSON.stringify(problem, null, 2)}\n`, 'utf8')
  }
  console.log(`enriched ${files.length} problems, ${missing} missing expected outputs`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
