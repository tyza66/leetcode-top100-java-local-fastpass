<script setup>
import { computed, ref, watch } from 'vue'
import { Send, Sparkles } from 'lucide-vue-next'
import { askAI } from '../lib/api.mjs'
import { renderMarkdown } from '../lib/markdown.mjs'
import { store } from '../lib/store.mjs'

const apiBase = ref('https://api.openai.com/v1/chat/completions')
const model = ref('gpt-4o-mini')
const apiKey = ref('')
const prompt = ref('')
const loading = ref(false)
const error = ref(null)
const response = ref(null)

const rendered = computed(() => (response.value ? renderMarkdown(response.value) : ''))

watch(
  () => store.current?.slug,
  () => {
    const problem = store.current
    prompt.value = problem
      ? `请用中文讲解 LeetCode ${problem.frontendId} ${problem.titleCn}（${problem.title}）这道题的解题思路，包含最优解、最易记忆的写法，并给出完整 Java 代码和复杂度分析。`
      : ''
    response.value = null
    error.value = null
  },
  { immediate: true }
)

async function send() {
  if (loading.value) return
  if (!apiBase.value.trim() || !model.value.trim() || !apiKey.value.trim() || !prompt.value.trim()) {
    error.value = '请先填写 API 地址、模型、API Key 和问题。'
    return
  }
  loading.value = true
  error.value = null
  response.value = null
  try {
    const data = await askAI({
      apiBase: apiBase.value.trim(),
      apiKey: apiKey.value.trim(),
      model: model.value.trim(),
      messages: [{ role: 'user', content: prompt.value.trim() }]
    })
    response.value = data.content
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ai-panel">
    <section class="ai-config">
      <h2>AI 配置</h2>
      <div class="ai-config-grid">
        <label class="ai-field">
          <span>API 地址</span>
          <input
            v-model="apiBase"
            type="url"
            placeholder="https://api.openai.com/v1/chat/completions"
            spellcheck="false"
          />
        </label>
        <label class="ai-field">
          <span>模型</span>
          <input v-model="model" placeholder="gpt-4o-mini" spellcheck="false" />
        </label>
        <label class="ai-field">
          <span>API Key</span>
          <input v-model="apiKey" type="password" placeholder="sk-..." autocomplete="off" />
        </label>
      </div>
      <p class="ai-note">配置只保存在当前页面内存里，刷新后自动清空。</p>
    </section>

    <section class="ai-ask">
      <label class="ai-question-field">
        <span>问题</span>
        <textarea v-model="prompt" rows="6" spellcheck="false"></textarea>
      </label>
      <button class="ai-send-button" :disabled="loading" @click="send">
        <Send :size="14" />
        {{ loading ? '等待回答…' : '发送给 AI' }}
      </button>
    </section>

    <div v-if="error" class="ai-error">{{ error }}</div>
    <div v-if="loading" class="ai-loading">
      <Sparkles :size="17" />
      <span>AI 正在思考…</span>
    </div>
    <div v-else-if="response" class="ai-response" v-html="rendered"></div>
    <div v-else class="ai-idle">
      <Sparkles :size="18" />
      <span>填入接口配置后即可向 AI 提问</span>
    </div>
  </div>
</template>
