import { reactive } from 'vue'
import { fetchProblem, fetchProblems } from './api.mjs'

export const store = reactive({
  problems: [],
  currentSlug: null,
  current: null,
  listLoading: false,
  detailLoading: false,
  error: null
})

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
