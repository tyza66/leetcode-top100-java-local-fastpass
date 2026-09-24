import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { TECH_BY_TOPIC, MEMORY_FALLBACK_BY_TOPIC, PITFALLS_BY_TOPIC, TOPIC_CN } from '../data/hints/base-tech.mjs'

function clean(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\{?O\([^)]*\)\}?/g, (m) => m.replace(/\$/g, ''))
    .replace(/\$/g, '')
    .replace(/\\to/g, '->')
    .replace(/\\le/g, '<=')
    .replace(/\\ge/g, '>=')
    .replace(/\\times/g, 'x')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractComplexity(text) {
  const t = /\s*时间复杂度([^\n]*)/.exec(text)
  const s = /\s*空间复杂度([^\n]*)/.exec(text)
  let out = ''
  if (t) out += `时间复杂度 ${t[1].replace(/[，,。]/g, '').trim()}`
  if (s) out += `${out ? ' / ' : ''}空间复杂度 ${s[1].replace(/[。]/g, '').trim()}`
  if (!out) {
    const any = /\$*(O\([^)]*\))\$*/.exec(text)
    if (any) out = any[1]
  }
  return out || '按题面约束估计'
}

function extractJava(body) {
  const m = /```java\n([\s\S]*?)```/.exec(body)
  return m ? m[1].trim() : ''
}

function extractApproach(body) {
  const cleaned = clean(body)
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const out = []
  for (const line of lines) {
    if (/^(时间复杂度|空间复杂度|####|###|##|```)/.test(line)) continue
    if (/^(Python\d*|Java|C\+\+|Go|TypeScript|Rust|JavaScript|C#|PHP|Swift|Kotlin|Scala|Ruby|C)$/.test(line)) continue
    out.push(line)
  }
  if (out[0] === '思考') out.shift()
  return out.join('\n').slice(0, 700)
}

function parseDoocs(md) {
  if (!md) return []
  const section = md.match(/## 解法([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''
  if (!section.trim()) return []
  const headings = [...section.matchAll(/\n### 方法([^\n]+)/g)].map((m) => `方法${m[1].trim()}`)
  const parts = section.split(/\n### 方法[^\n]+/).slice(1)
  return parts.map((body, i) => {
    const title = headings[i] ?? `方法${i + 1}`
    const approach = extractApproach(body)
    const complexity = extractComplexity(body)
    const javaSnippet = extractJava(body)
    return { title, approach, complexity, javaSnippet }
  })
}

function parseLcm(md) {
  if (!md) return null
  const section = md.match(/## 思路([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''
  const javaBlocks = [...md.matchAll(/```java\n([\s\S]*?)```/g)].map((m) => m[1].trim())
  return {
    approach: extractApproach(section),
    javaSnippets: javaBlocks
  }
}

function fallbackMemory(topics) {
  const topic = topics.find((t) => MEMORY_FALLBACK_BY_TOPIC[t.slug])
  return topic ? MEMORY_FALLBACK_BY_TOPIC[topic.slug] : MEMORY_FALLBACK_BY_TOPIC.array
}

function collectTech(problem) {
  const tech = []
  const seen = new Set()
  for (const topic of problem.topics || []) {
    for (const item of TECH_BY_TOPIC[topic.slug] || []) {
      if (!seen.has(item.name)) {
        seen.add(item.name)
        tech.push(item)
      }
    }
  }
  return tech.slice(0, 6)
}

function collectKeywords(problem, optimal) {
  const words = new Set([problem.titleCn])
  for (const topic of problem.topics || []) {
    words.add(TOPIC_CN[topic.slug] || topic.cn || topic.name)
  }
  for (const part of (optimal.title || '').split(/[：:，,、\s]+/)) {
    if (part.length >= 2 && part.length <= 8 && !part.startsWith('方法')) words.add(part)
  }
  return [...words].slice(0, 8)
}

function collectPitfalls(problem) {
  const pitfalls = []
  for (const topic of problem.topics || []) {
    for (const item of PITFALLS_BY_TOPIC[topic.slug] || []) {
      if (!pitfalls.includes(item)) pitfalls.push(item)
    }
  }
  if (!pitfalls.length) pitfalls.push('先明确题目边界条件与返回值转义', '写前用小样例手动推演一遍')
  return pitfalls.slice(0, 5)
}

export async function runEnrichHints() {
  const index = JSON.parse(await readFile('data/problems/index.json', 'utf8'))
  let ok = 0
  for (const item of index) {
    const file = `data/problems/${item.slug}.json`
    const problem = JSON.parse(await readFile(file, 'utf8'))
    const id = String(item.frontendId).padStart(4, '0')
    let doocsMd = null
    let lcmMd = null
    try {
      doocsMd = await readFile(`data/solutions/${id}.doocs.md`, 'utf8')
    } catch {}
    try {
      lcmMd = await readFile(`data/solutions/${id}.lcm.md`, 'utf8')
    } catch {}

    const methods = parseDoocs(doocsMd)
    const lcm = parseLcm(lcmMd)
    const optimal = methods[0] || {
      title: lcm ? '从题解思路出发' : '先读题并定位考查点',
      approach: lcm?.approach || '建议先从暴力解入手，再根据数据范围优化',
      complexity: '按实现分析',
      javaSnippet: lcm?.javaSnippets?.[0] ?? ''
    }
    const memory = methods[1] || {
      ...fallbackMemory(problem.topics),
      javaSnippet: lcm?.javaSnippets?.[1] ?? lcm?.javaSnippets?.[0] ?? ''
    }
    const hints = {
      optimal: {
        title: optimal.title,
        approach: optimal.approach || '暂无自动解析，建议参考来源链接',
        complexity: optimal.complexity,
        javaSnippet: optimal.javaSnippet
      },
      memory: {
        title: memory.title,
        approach: memory.approach,
        complexity: memory.complexity,
        javaSnippet: memory.javaSnippet
      },
      keywords: collectKeywords(problem, optimal),
      tech: collectTech(problem),
      pitfalls: collectPitfalls(problem),
      references: [
        { name: 'Doocs LeetCode', url: 'https://github.com/doocs/leetcode' },
        { name: '代码随想录', url: 'https://github.com/youngyangyang04/leetcode-master' }
      ]
    }
    problem.hints = hints
    await writeFile(file, JSON.stringify(problem, null, 2))
    if (hints.optimal.approach && hints.optimal.approach !== '暂无自动解析，建议参考来源链接') ok++
  }
  console.log(`Hints enriched: ${ok}/${index.length}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runEnrichHints().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
