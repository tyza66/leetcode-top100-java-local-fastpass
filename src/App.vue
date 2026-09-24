<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FileText, Lightbulb, Sparkles } from 'lucide-vue-next'
import AskAIPanel from './components/AskAIPanel.vue'
import EditorPanel from './components/EditorPanel.vue'
import HintPanel from './components/HintPanel.vue'
import ProblemList from './components/ProblemList.vue'
import ProblemPanel from './components/ProblemPanel.vue'
import { loadProblems, store } from './lib/store.mjs'

const activeTab = ref('problem')
const sidebarCollapsed = ref(false)

function handleResize() {
  if (window.innerWidth <= 700) sidebarCollapsed.value = false
}

onMounted(() => {
  loadProblems()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

function difficultyClass(value) {
  const key = String(value || '').toUpperCase()
  return key === 'EASY' ? 'easy' : key === 'MEDIUM' ? 'medium' : 'hard'
}
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <ProblemList :collapsed="sidebarCollapsed" @toggle-collapse="sidebarCollapsed = !sidebarCollapsed" />
    <main class="workspace">
      <section class="content-pane">
        <header class="workspace-topbar">
          <div class="segmented" role="tablist" aria-label="题目视图">
            <button :class="{ active: activeTab === 'problem' }" role="tab" @click="activeTab = 'problem'">
              <FileText :size="14" />
              <span>题目</span>
            </button>
            <button :class="{ active: activeTab === 'hint' }" role="tab" @click="activeTab = 'hint'">
              <Lightbulb :size="14" />
              <span>提示</span>
            </button>
            <button :class="{ active: activeTab === 'ai' }" role="tab" @click="activeTab = 'ai'">
              <Sparkles :size="14" />
              <span>问AI</span>
            </button>
          </div>
          <div v-if="store.current" class="workspace-title">
            <span class="difficulty-badge" :class="difficultyClass(store.current.difficulty)">
              {{ store.current.difficulty }}
            </span>
            <span class="question-id">{{ store.current.frontendId }}</span>
            <h1>{{ store.current.titleCn }}</h1>
            <span class="english-title">{{ store.current.title }}</span>
          </div>
        </header>
        <ProblemPanel v-show="activeTab === 'problem'" />
        <HintPanel v-show="activeTab === 'hint'" />
        <AskAIPanel v-show="activeTab === 'ai'" />
      </section>
      <EditorPanel />
    </main>
  </div>
</template>
