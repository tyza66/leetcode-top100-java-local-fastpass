<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Play, RotateCcw, Terminal, Timer } from 'lucide-vue-next'
import { editorTemplate, runJava } from '../lib/api.mjs'
import { markPassed, store } from '../lib/store.mjs'
import { createEditor, setCompletionEnabled } from '../lib/editor.js'

const editorRef = ref(null)
const completionEnabled = ref(true)
const timeoutEnabled = ref(true)
const timeoutMs = ref(5000)
const running = ref(false)
const result = ref(null)
const error = ref(null)

let editor = null
let activeSlug = null
let changeDisposable = null
const codes = new Map()

function difficultyClass(value) {
  const key = String(value || '').toUpperCase()
  return key === 'EASY' ? 'easy' : key === 'MEDIUM' ? 'medium' : 'hard'
}

function resetCode() {
  if (!activeSlug || !store.current) return
  const template = editorTemplate(store.current)
  codes.set(activeSlug, template)
  editor?.setValue(template)
  result.value = null
  error.value = null
}

async function run() {
  if (running.value || !activeSlug) return
  running.value = true
  result.value = null
  error.value = null
  try {
    result.value = await runJava({
      slug: activeSlug,
      code: editor?.getValue() ?? '',
      timeoutMs: timeoutEnabled.value ? timeoutMs.value : null
    })
    if (result.value.pass === result.value.total && result.value.total > 0) {
      markPassed(activeSlug)
    }
  } catch (runError) {
    error.value = runError.message
  } finally {
    running.value = false
  }
}

onMounted(async () => {
  if (!editorRef.value) return
  editor = createEditor(editorRef.value)
  changeDisposable = editor.onDidChangeModelContent(() => {
    if (activeSlug) codes.set(activeSlug, editor.getValue())
  })
  setCompletionEnabled(completionEnabled.value)
})

onBeforeUnmount(() => {
  changeDisposable?.dispose()
  editor?.dispose()
  editor = null
})

watch(completionEnabled, (value) => setCompletionEnabled(value))

watch(
  () => store.currentSlug,
  (slug) => {
    activeSlug = slug
    result.value = null
    error.value = null
  }
)

watch(
  () => store.current?.slug,
  async (slug) => {
    if (!slug || !editor || slug !== activeSlug) return
    await nextTick()
    if (!codes.has(slug)) codes.set(slug, editorTemplate(store.current))
    editor.setValue(codes.get(slug))
  }
)
</script>

<template>
  <div class="editor-panel">
    <header class="editor-header">
      <div class="editor-title">
        <span class="editor-id">{{ store.current?.frontendId }}</span>
        <h2>{{ store.current?.titleCn || '请选择题目' }}</h2>
        <span v-if="store.current" class="editor-difficulty" :class="difficultyClass(store.current.difficulty)">
          {{ store.current.difficulty }}
        </span>
      </div>
      <div class="editor-toolbar">
        <label class="tool-switch">
          <input v-model="completionEnabled" type="checkbox" />
          <span>代码提示</span>
        </label>
        <label class="tool-switch">
          <input v-model="timeoutEnabled" type="checkbox" />
          <Timer :size="14" />
          <span>超时</span>
        </label>
        <select v-if="timeoutEnabled" v-model="timeoutMs" class="timeout-select">
          <option :value="1000">1s</option>
          <option :value="3000">3s</option>
          <option :value="5000">5s</option>
          <option :value="10000">10s</option>
        </select>
        <button class="icon-button" title="恢复模板" @click="resetCode">
          <RotateCcw :size="15" />
        </button>
        <button class="run-button" :disabled="running" @click="run">
          <Play :size="15" />
          {{ running ? '运行中' : '运行' }}
        </button>
      </div>
    </header>

    <div ref="editorRef" class="editor-host"></div>

    <div class="console-panel">
      <div v-if="error" class="console-error">{{ error }}</div>
      <template v-else-if="result">
        <div class="console-summary">
          <span class="pass-count" :class="{ all: result.pass === result.total && result.total > 0 }">
            {{ result.pass }}/{{ result.total }} 通过
          </span>
          <span>{{ result.runtimeMs }} ms</span>
          <span v-if="result.timedOut" class="timed-label">超时</span>
        </div>
        <pre v-if="result.compileError" class="compile-error">{{ result.compileError }}</pre>
        <div v-for="item in result.results" :key="item.caseId" class="case-line" :class="item.status.toLowerCase()">
          <span class="case-status">{{ item.status }}</span>
          <span>用例 {{ item.caseId + 1 }}</span>
          <span>{{ item.detail }}</span>
        </div>
        <pre v-if="result.stdout" class="console-stdout">{{ result.stdout }}</pre>
      </template>
      <div v-else class="console-idle">
        <Terminal :size="17" />
      </div>
    </div>
  </div>
</template>
