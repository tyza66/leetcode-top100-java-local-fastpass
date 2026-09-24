import { reactive } from 'vue'
import { fetchProblem, fetchProblems } from './api.mjs'

export const store = reactive({
  problems: [],
  currentSlug: null,
  current: null,
  listLoading: false,
  detailLoading: false,
  error: null,
  passedSlugs: new Set()
})

const PASSED_KEY = 'leetcode-top100-passed'

function persistPassed() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PASSED_KEY, JSON.stringify([...store.passedSlugs]))
  } catch {
    // storage unavailable; the in-memory mark still applies this session
  }
}

export function initPassed() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(PASSED_KEY)
    if (!raw) return
    for (const slug of JSON.parse(raw)) {
      if (typeof slug === 'string') store.passedSlugs.add(slug)
    }
  } catch {
    // corrupted saved data is ignored
  }
}

export function markPassed(slug) {
  if (!slug || store.passedSlugs.has(slug)) return
  store.passedSlugs.add(slug)
  persistPassed()
}

export const isPassed = (slug) => store.passedSlugs.has(slug)

export async function loadProblems() {
  store.listLoading = true
  store.error = null
  try {
    store.problems = await fetchProblems()
    if (!store.currentSlug && store.problems.length > 0) {
      await selectProblem(store.problems[0].slug)
    }
  } catch (error) {
    store.error = error.message
  } finally {
    store.listLoading = false
  }
}

initPassed()

export async function selectProblem(slug) {
  if (store.currentSlug === slug && store.current) return
  store.currentSlug = slug
  store.detailLoading = true
  store.error = null
  try {
    store.current = await fetchProblem(slug)
  } catch (error) {
    store.error = error.message
  } finally {
    store.detailLoading = false
  }
}
