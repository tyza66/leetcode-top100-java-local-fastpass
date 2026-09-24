<script setup>
import { onMounted, ref } from 'vue'
import { FileText, Lightbulb } from 'lucide-vue-next'
import EditorPanel from './components/EditorPanel.vue'
import HintPanel from './components/HintPanel.vue'
import ProblemList from './components/ProblemList.vue'
import ProblemPanel from './components/ProblemPanel.vue'
import { loadProblems, store } from './lib/store.mjs'

const activeTab = ref('problem')

onMounted(() => loadProblems())

function difficultyClass(value) {
  const key = String(value || '').toUpperCase()
  return key === 'EASY' ? 'easy' : key === 'MEDIUM' ? 'medium' : 'hard'
}
</script>

<template>
  <div class="app-shell">
    <ProblemList />
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
      </section>
      <EditorPanel />
    </main>
  </div>
</template>
