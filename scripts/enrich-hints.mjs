import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { TECH_BY_TOPIC, MEMORY_FALLBACK_BY_TOPIC, PITFALLS_BY_TOPIC, TOPIC_CN } from '../data/hints/base-tech.mjs'

function cleanMath(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\\textit\{([^{}]*)\}/g, '$1')
    .replace(/\\textbf\{([^{}]*)\}/g, '$1')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]*)\}/g, '$1')
    .replace(/\\begin\{[a-z]+\*?\}[\s\S]*?\\end\{[a-z]+\*?\}/g, '')
    .replace(/\\min\b/g, 'min')
    .replace(/\\max\b/g, 'max')
    .replace(/\\to/g, '->')
    .replace(/\\le/g, '<=')
    .replace(/\\ge/g, '>=')
    .replace(/\\times/g, 'x')
    .replace(/\\,/g, ' ')
    .replace(/\$/g, '')
}

function stripCodeFences(text) {
  const lines = String(text).split('\n')
  let inCode = false
  const out = []
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode
      continue
    }
    if (!inCode) out.push(line)
  }
  return out.join('\n')
}

function clean(text) {
  return cleanMath(stripCodeFences(text))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanMathText(text) {
  return cleanMath(text).trim()
}

function extractComplexity(text) {
  const cleaned = cleanMathText(text)
  const matches = [...cleaned.matchAll(/(?:时间复杂度|空间复杂度)[^\n]*/g)].map((m) => m[0])
  const target = matches.find((item) => item.includes('空间复杂度')) || matches[matches.length - 1]
  const timeIndex = target ? target.indexOf('时间复杂度') : -1
  const spaceIndex = target ? target.indexOf('空间复杂度') : -1
  const timeText =
    timeIndex >= 0 ? target.slice(timeIndex + 5, spaceIndex > timeIndex ? spaceIndex : undefined) : ''
  const spaceText = spaceIndex >= 0 ? target.slice(spaceIndex + 5) : ''
  let out = ''
  if (timeText.trim()) out += `时间复杂度 ${timeText.replace(/[，,。]/g, '').trim()}`
  if (spaceText.trim()) out += `${out ? ' / ' : ''}空间复杂度 ${spaceText.replace(/[。]/g, '').trim()}`
  if (!out) {
    const any = /(O\([^)]*\))/.exec(cleaned)
    if (any) out = any[1]
  }
  return out || '按题面约束估计'
}

function extractJava(body) {
  const lines = String(body).split('\n')
  const out = []
  let capture = false
  for (const line of lines) {
    if (/^\s*```\s*(?:java|Java)\s*$/.test(line)) {
      capture = true
      continue
    }
    if (capture && /^\s*```/.test(line)) {
      capture = false
      continue
    }
    if (capture) out.push(line)
  }
  return out.join('\n').trim()
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
    if (/^(Python\d*|Java|C\+\+|Go|TypeScript|Rust|JavaScript|C#|PHP|Swift|Kotlin|Scala|Ruby|Nim|Cangjie|C)$/.test(line)) continue
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

function resolveMemory(problem, optimal, lcm) {
  const snippet = lcm?.javaSnippets?.[1] ?? lcm?.javaSnippets?.[0] ?? ''
  if (snippet) {
    return {
      title: '题解直出记忆版',
      approach:
        '优先背题解里这段最直白的 Java 实现：记住容器/指针/状态变量，主流程结束后补返回值与边界。想先保正确性时，可以先用文字里的兜底思路过一遍再优化。',
      complexity: '以代码注释与题解为准',
      javaSnippet: snippet
    }
  }
  if (optimal.javaSnippet) {
    const techNames = collectTech(problem)
      .map((item) => item.name)
      .join('、')
    return {
      title: '最优解模板（三步记忆）',
      approach:
        `把「${optimal.title}」拆成三步记忆：第一步定核心结构（${techNames}），第二步照着下面模板走主流程，第三步核对边界与返回类型。背熟后再默写一遍，同类题只替换细节。`,
      complexity: optimal.complexity,
      javaSnippet: optimal.javaSnippet
    }
  }
  return { ...fallbackMemory(problem.topics), javaSnippet: '' }
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
    const memory = methods[1]
      ? { ...methods[1], javaSnippet: methods[1].javaSnippet || optimal.javaSnippet || '' }
      : resolveMemory(problem, optimal, lcm)
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
