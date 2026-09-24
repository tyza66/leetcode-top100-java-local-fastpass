import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildJavaProject } from './harness.mjs'
import { getProblem } from './problems.mjs'

const COMPILE_TIMEOUT_MS = 20_000

function execWithTimeout(command, args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = timeoutMs == null ? null : new AbortController()
    const started = Date.now()
    let settled = false
    const timer =
      controller == null
        ? null
        : setTimeout(() => {
            controller.abort()
          }, timeoutMs)
    execFile(
      command,
      args,
      { cwd, signal: controller?.signal, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        resolve({
          stdout,
          stderr,
          timedOut: error?.name === 'AbortError' || error?.code === 'ABORT_ERR',
          runtimeMs: Date.now() - started,
          error
        })
      }
    )
  })
}

function parseResults(stdout) {
  const results = stdout
    .split('\n')
    .filter((line) => /^(PASS|FAIL|ERROR) CASE /.test(line))
    .map((line) => {
      const match = /^(PASS|FAIL|ERROR) CASE (\d+)(.*)$/.exec(line)
      return {
        status: match[1],
        caseId: Number(match[2]),
        detail: match[3].trim()
      }
    })
  const resultMatch = /RESULT (\d+)\/(\d+)/.exec(stdout)
  return {
    results,
    pass: resultMatch ? Number(resultMatch[1]) : 0,
    total: resultMatch ? Number(resultMatch[2]) : results.length
  }
}

export async function runJava({ slug, code, timeoutMs }) {
  const problem = await getProblem(slug)
  const project = buildJavaProject(problem, code)
  const dir = await mkdtemp(join(tmpdir(), 'leetcode-run-'))
  try {
    for (const [name, source] of Object.entries(project.files)) {
      await writeFile(join(dir, name), source, 'utf8')
    }

    const compile = await execWithTimeout(
      'javac',
      Object.keys(project.files),
      dir,
      COMPILE_TIMEOUT_MS
    )
    if (compile.error) {
      return {
        pass: 0,
        total: problem.tests?.length ?? 0,
        results: [],
        stdout: compile.stdout,
        stderr: compile.stderr,
        compileError: (compile.stderr || compile.stdout).trim(),
        runtimeMs: compile.runtimeMs,
        timedOut: compile.timedOut
      }
    }

    const run = await execWithTimeout('java', ['Main'], dir, timeoutMs)
    if (run.timedOut) {
      return {
        pass: 0,
        total: problem.tests?.length ?? 0,
        results: [],
        stdout: run.stdout,
        stderr: run.stderr,
        compileError: null,
        runtimeMs: run.runtimeMs,
        timedOut: true
      }
    }

    return {
      ...parseResults(run.stdout),
      stdout: run.stdout,
      stderr: run.stderr,
      compileError: null,
      runtimeMs: run.runtimeMs,
      timedOut: false
    }
  } catch (error) {
    return {
      pass: 0,
      total: problem.tests?.length ?? 0,
      results: [],
      stdout: '',
      stderr: '',
      compileError: error.message,
      runtimeMs: 0,
      timedOut: false
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
