import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchQuestion } from './lib/leetcode.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function downloadImage(url, dir, index) {
  try {
    const urlObj = new URL(url)
    const ext = path.extname(urlObj.pathname) || '.png'
    const name = `img-${index}${ext}`
    const target = path.join(dir, name)
    if (existsSync(target)) return `assets/problems/${path.basename(dir)}/${name}`
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    })
    if (!res.ok) return url
    await mkdir(dir, { recursive: true })
    await writeFile(target, Buffer.from(await res.arrayBuffer()))
    return `assets/problems/${path.basename(dir)}/${name}`
  } catch (err) {
    console.warn(`[img] skip ${url}: ${err.message}`)
    return url
  }
}

async function localizeImages(html, slug) {
  const dir = `public/assets/problems/${slug}`
  const seen = new Map()
  const urls = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
  let counter = 0
  for (const url of urls) {
    if (!seen.has(url)) seen.set(url, await downloadImage(url, dir, ++counter))
  }
  return html.replace(/src="(https?:\/\/[^"]+)"/g, (full, url) => `src="${seen.get(url) ?? url}"`)
}

async function fetchWithRetry(slug, attempts = 3) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchQuestion(slug)
    } catch (err) {
      lastError = err
      await sleep(500 * (i + 1))
    }
  }
  throw lastError
}

export async function runFetchProblems() {
  const index = JSON.parse(await readFile('data/problems/index.json', 'utf8'))
  let done = 0
  let failed = []
  for (const item of index) {
    try {
      const q = await fetchWithRetry(item.slug)
      const java = q.codeSnippets?.find((s) => s.lang === 'Java')?.code ?? ''
      const contentHtml = await localizeImages(q.translatedContent || q.content || '', item.slug)
      const problem = {
        frontendId: q.questionFrontendId,
        questionId: q.questionId,
        title: q.title,
        titleCn: q.translatedTitle,
        slug: q.titleSlug,
        difficulty: q.difficulty,
        topics: q.topicTags?.map((t) => ({ name: t.name, cn: t.name, slug: t.slug })) ?? [],
        metaData: q.metaData ? JSON.parse(q.metaData) : {},
        codeSnippet: java,
        sampleTestCase: q.sampleTestCase ?? '',
        exampleTestcases: q.exampleTestcases ?? '',
        contentHtml,
        contentEnHtml: q.content ?? '',
        hints: null
      }
      await writeFile(`data/problems/${item.slug}.json`, JSON.stringify(problem, null, 2))
      done++
      if (done % 10 === 0 || done === index.length) console.log(`problems fetched: ${done}/${index.length}`)
    } catch (err) {
      failed.push(item.slug)
      console.warn(`[skip] ${item.slug}: ${err.message}`)
    }
    await sleep(150)
  }
  console.log(`Done: ${done}/${index.length}, failed: ${failed.length}`)
  if (failed.length) console.log('failed:', failed.join(', '))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runFetchProblems().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
