<script setup>
import { KeyRound, Lightbulb, ShieldAlert, Wrench } from 'lucide-vue-next'
import { store } from '../lib/store.mjs'
</script>

<template>
  <div class="hint-panel">
    <template v-if="store.current">
      <section class="hint-section">
        <div class="hint-heading">
          <Lightbulb :size="17" />
          <h2>最优解</h2>
        </div>
        <div v-if="store.current.hints?.optimal" class="hint-body">
          <h3>{{ store.current.hints.optimal.title }}</h3>
          <p class="approach">{{ store.current.hints.optimal.approach }}</p>
          <p class="complexity">{{ store.current.hints.optimal.complexity }}</p>
          <pre v-if="store.current.hints.optimal.javaSnippet" class="hint-code">{{
            store.current.hints.optimal.javaSnippet
          }}</pre>
        </div>
      </section>

      <section class="hint-section">
        <div class="hint-heading">
          <Lightbulb :size="17" />
          <h2>最易记忆解</h2>
        </div>
        <div v-if="store.current.hints?.memory" class="hint-body">
          <h3>{{ store.current.hints.memory.title }}</h3>
          <p class="approach">{{ store.current.hints.memory.approach }}</p>
          <p class="complexity">{{ store.current.hints.memory.complexity }}</p>
          <pre v-if="store.current.hints.memory.javaSnippet" class="hint-code">{{
            store.current.hints.memory.javaSnippet
          }}</pre>
        </div>
      </section>

      <section class="hint-section">
        <div class="hint-heading">
          <KeyRound :size="17" />
          <h2>关键字</h2>
        </div>
        <div class="keyword-row">
          <span v-for="keyword in store.current.hints?.keywords || []" :key="keyword" class="keyword-chip">
            {{ keyword }}
          </span>
        </div>
      </section>

      <section class="hint-section">
        <div class="hint-heading">
          <Wrench :size="17" />
          <h2>所用技术详解</h2>
        </div>
        <div class="tech-list">
          <div v-for="(tech, index) in store.current.hints?.tech || []" :key="index" class="tech-item">
            <h3>{{ tech.name }}</h3>
            <p>{{ tech.detail }}</p>
          </div>
        </div>
      </section>

      <section class="hint-section">
        <div class="hint-heading">
          <ShieldAlert :size="17" />
          <h2>易错点</h2>
        </div>
        <ul class="pitfall-list">
          <li v-for="pitfall in store.current.hints?.pitfalls || []" :key="pitfall">{{ pitfall }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>
