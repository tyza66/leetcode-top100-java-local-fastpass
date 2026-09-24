import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getProblem, listProblems } from './lib/problems.mjs'
import { runJava } from './lib/javaRunner.mjs'

const app = express()
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT || 8787)

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/problems', async (_req, res, next) => {
  try {
    res.json(await listProblems())
  } catch (error) {
    next(error)
  }
})
app.get('/api/problems/:slug', async (req, res, next) => {
  try {
    res.json(await getProblem(req.params.slug))
  } catch (error) {
    next(error)
  }
})
app.post('/api/run', async (req, res, next) => {
  try {
    const { slug, code } = req.body || {}
    const timeoutMs =
      req.body?.timeoutMs == null ? 5000 : Number(req.body.timeoutMs)
    if (!slug || typeof code !== 'string') {
      res.status(400).json({ error: 'slug and code are required' })
      return
    }
    res.json(await runJava({ slug, code, timeoutMs }))
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: error.message })
})

const dist = join(root, 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
}

app.listen(port, '0.0.0.0', () => {
  console.log(`leetcode-local api listening on http://127.0.0.1:${port}`)
})
