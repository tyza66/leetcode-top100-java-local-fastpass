import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { fetchTop100 } from './lib/leetcode.mjs'

export async function runFetchTop100() {
  const rows = await fetchTop100()
  const problems = rows.map((q, index) => ({
    id: index + 1,
    frontendId: q.frontendQuestionId,
    title: q.title,
    titleCn: q.titleCn,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    paidOnly: q.paidOnly,
    acRate: q.acRate,
    topics: q.topicTags.map((t) => ({ cn: t.nameTranslated, slug: t.slug }))
  }))
  await mkdir('data/problems', { recursive: true })
  await writeFile('data/problems/index.json', JSON.stringify(problems, null, 2))
  const easy = problems.filter((p) => p.difficulty === 'EASY').length
  const medium = problems.filter((p) => p.difficulty === 'MEDIUM').length
  const hard = problems.filter((p) => p.difficulty === 'HARD').length
  console.log(`Top100 fetched: ${problems.length} problems (easy ${easy}, medium ${medium}, hard ${hard})`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runFetchTop100().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
