<script setup>
import { store } from '../lib/store.mjs'

function difficultyClass(value) {
  const key = String(value || '').toUpperCase()
  return key === 'EASY' ? 'easy' : key === 'MEDIUM' ? 'medium' : 'hard'
}

function joinInput(test) {
  return (test.input || []).join('\n')
}
</script>

<template>
  <div class="problem-panel">
    <div v-if="store.detailLoading" class="panel-state">加载题面中…</div>
    <template v-else-if="store.current">
      <div class="topic-row">
        <span v-for="topic in store.current.topics || []" :key="topic.slug" class="topic-chip">
          {{ topic.cn || topic.name }}
        </span>
      </div>

      <article class="statement" v-html="store.current.contentHtml"></article>

      <section class="local-cases">
        <h2>测试用例</h2>
        <div v-for="(test, index) in store.current.tests || []" :key="index" class="local-case">
          <div class="case-title">用例 {{ index + 1 }}</div>
          <div class="io-row">
            <span class="io-label">输入</span>
            <pre>{{ joinInput(test) }}</pre>
          </div>
          <div class="io-row">
            <span class="io-label">输出</span>
            <pre>{{ test.expected }}</pre>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
