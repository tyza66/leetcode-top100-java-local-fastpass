import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = process.cwd()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function padded(id) {
  return String(id).padStart(4, '0')
}

function doocsRange(id) {
  const n = Number(id)
  if (n <= 99) return '0000-0099'
  const start = Math.floor(n / 100) * 100
  return `${padded(start)}-${padded(start + 99)}`
}

async function fetchText(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (i === attempts - 1) throw err
      await sleep(400 * (i + 1))
    }
  }
}

export async function runFetchSolutions() {
  const index = JSON.parse(await readFile('data/problems/index.json', 'utf8'))
  await mkdir('data/solutions', { recursive: true })
  let ok = 0
  let missing = []
  let failed = []
  const queue = [...index]
  async function worker() {
    while (queue.length) {
      const item = queue.shift()
      const id = padded(item.frontendId)
      const doocsUrl = `https://raw.githubusercontent.com/doocs/leetcode/main/solution/${doocsRange(item.frontendId)}/${id}.${encodeURIComponent(item.title)}/README.md`
      const lcmUrl = `https://raw.githubusercontent.com/youngyangyang04/leetcode-master/master/problems/${id}.${encodeURIComponent(item.titleCn)}.md`
      let has = false
      try {
        const doocs = await fetchText(doocsUrl)
        if (doocs) {
          await writeFile(`data/solutions/${id}.doocs.md`, doocs)
          has = true
        }
        const lcm = await fetchText(lcmUrl)
        if (lcm) {
          await writeFile(`data/solutions/${id}.lcm.md`, lcm)
          has = true
        }
        if (has) ok++
        else missing.push(`${item.frontendId}:${item.slug}`)
      } catch (err) {
        failed.push(`${item.frontendId}:${item.slug}: ${err.message}`)
      }
      await sleep(80)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  console.log(`Solutions fetched: ${ok}/${index.length}, missing ${missing.length}, failed ${failed.length}`)
  if (missing.length) console.log('missing:', missing.slice(0, 30).join(', '))
  if (failed.length) console.log('failed:', failed.slice(0, 10).join('\n'))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runFetchSolutions().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
