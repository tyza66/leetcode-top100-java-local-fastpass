import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const problemsDir = join(root, 'data', 'problems')

function safeSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}

export async function listProblems() {
  return JSON.parse(await readFile(join(problemsDir, 'index.json'), 'utf8'))
}

export async function getProblem(slug) {
  if (!safeSlug(slug)) throw new Error('invalid slug')
  return JSON.parse(await readFile(join(problemsDir, `${slug}.json`), 'utf8'))
}
