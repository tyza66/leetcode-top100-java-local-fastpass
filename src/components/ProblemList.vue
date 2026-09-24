<script setup>
import { computed, ref } from 'vue'
import { CheckCircle2, Code2, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-vue-next'
import { isPassed, selectProblem, store } from '../lib/store.mjs'

defineProps({
  collapsed: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-collapse'])

const query = ref('')
const difficulty = ref('ALL')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return store.problems.filter((problem) => {
    const matchedDifficulty = difficulty.value === 'ALL' || problem.difficulty === difficulty.value
    const matchedQuery =
      !q ||
      problem.titleCn?.toLowerCase().includes(q) ||
      problem.title?.toLowerCase().includes(q) ||
      problem.frontendId === q
    return matchedDifficulty && matchedQuery
  })
})

function difficultyClass(value) {
  return value === 'EASY' ? 'easy' : value === 'MEDIUM' ? 'medium' : 'hard'
}
</script>

<template>
  <div class="problem-sidebar">
    <div class="sidebar-head">
      <div class="sidebar-head-inner">
        <div class="brand">
          <Code2 :size="17" />
          <span>Top100 Java</span>
        </div>
        <span class="problem-count">{{ store.problems.length }} 题</span>
      </div>
      <div class="collapsed-brand">Top100</div>
      <button
        class="collapse-button"
        :title="collapsed ? '展开题目栏' : '收起题目栏'"
        @click="emit('toggle-collapse')"
      >
        <PanelLeftClose v-if="!collapsed" :size="16" />
        <PanelLeftOpen v-else :size="16" />
      </button>
    </div>

    <div class="sidebar-filters">
      <label class="search-box">
        <Search :size="14" />
        <input v-model="query" placeholder="搜索题号或标题" />
      </label>
      <div class="difficulty-filter">
        <button
          v-for="item in [
            { label: '全部', value: 'ALL' },
            { label: '简单', value: 'EASY' },
            { label: '中等', value: 'MEDIUM' },
            { label: '困难', value: 'HARD' }
          ]"
          :key="item.value"
          :class="{ active: difficulty === item.value }"
          @click="difficulty = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <div class="problem-scroll">
      <div v-if="store.listLoading" class="sidebar-empty">加载题目中…</div>
      <div v-else-if="filtered.length === 0" class="sidebar-empty">没有匹配的题目</div>
      <button
        v-for="problem in filtered"
        :key="problem.slug"
        class="problem-item"
        :class="{ active: store.currentSlug === problem.slug, passed: isPassed(problem.slug) }"
        @click="selectProblem(problem.slug)"
      >
        <span class="difficulty-dot" :class="difficultyClass(problem.difficulty)"></span>
        <span v-if="isPassed(problem.slug)" class="passed-mark" title="已通过">
          <CheckCircle2 :size="15" />
        </span>
        <span class="problem-id">{{ problem.frontendId }}</span>
        <span class="problem-titles">
          <strong>{{ problem.titleCn }}</strong>
          <small>{{ problem.title }}</small>
        </span>
        <span class="problem-rate">{{ Math.round(problem.acRate * 100) }}%</span>
      </button>
    </div>
  </div>
</template>
