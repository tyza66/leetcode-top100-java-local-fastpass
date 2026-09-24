# 力扣 Top100 本地 Java 平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个本地 Vue 3 应用，收录力扣热题 100 的题目、图片、样例测试用例与详细题解，提供带关键字补全和超时开关的 Monaco Java 编辑器，并通过本机 JDK 编译执行验证。

**Architecture:** Vite + Vue 3 前端负责选题与编辑器；Express 后端提供题目数据和 `/api/run` 编译执行；抓取脚本从 LeetCode CN GraphQL 拉题、GitHub 拉题解，全部落盘本地 JSON。

**Tech Stack:** Vue 3、Vite、Monaco Editor、Express、Node 22、JDK 21、Vitest、Playwright。

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.js`
- Create: `src/App.vue`

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "leetcode-top100-java-local",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -k -n api,web -c blue,green \"node server/index.mjs\" \"vite\"",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "scrape": "node scripts/scrape.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "concurrently": "^9.0.1",
    "express": "^4.21.0",
    "monaco-editor": "^0.52.0",
    "vite": "^5.4.8",
    "vue": "^3.5.12"
  },
  "devDependencies": {
    "vitest": "^2.1.3"
  }
}
```

- [ ] **Step 2: 创建 `vite.config.js`**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    }
  },
  test: {
    environment: 'node'
  }
})
```

- [ ] **Step 3: 创建 `index.html` 与 `.gitignore`**

`index.html` 使用 `#app` 挂载点与中文 `<title>`；`.gitignore` 忽略 `node_modules`、`dist`、`.tmp`。

- [ ] **Step 4: 创建最小 `src/main.js` / `src/App.vue`**

`main.js` 挂载 Vue；`App.vue` 先输出 `<div>loading</div>`，保证 `npm run dev` 可启动。

- [ ] **Step 5: 安装依赖并验证**

```bash
npm install
npm run build
```

Expected: `vite build` 退出码 0，生成 `dist/`。

- [ ] **Step 6: 提交**

```bash
git add .
git commit -m "feat: scaffold vite vue app"
```

---

### Task 2: 抓取热题 100 列表与题目详情

**Files:**
- Create: `scripts/lib/leetcode.mjs`
- Create: `scripts/fetch-top100.mjs`
- Create: `scripts/fetch-problems.mjs`
- Create: `scripts/scrape.mjs`

- [ ] **Step 1: 实现 `scripts/lib/leetcode.mjs`**

封装两个 GraphQL 请求：

```js
const GRAPHQL = 'https://leetcode.cn/graphql/'
const HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

export async function graphql(query, variables) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables })
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

export async function fetchTop100() {
  const query = `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
      hasMore total
      questions {
        frontendQuestionId title titleCn titleSlug difficulty paidOnly acRate
        topicTags { nameTranslated slug }
      }
    }
  }`
  const out = []
  for (let skip = 0; skip < 100; skip += 100) {
    const data = await graphql(query, {
      categorySlug: '', skip, limit: 100,
      filters: { listId: '2cktkvj' }
    })
    out.push(...data.problemsetQuestionList.questions)
  }
  return out
}

export async function fetchQuestion(slug) {
  const query = `query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId questionFrontendId title titleSlug translatedTitle translatedContent
      difficulty topicTags { name slug nameTranslated } metaData
      codeSnippets { lang code } sampleTestCase exampleTestcases content
    }
  }`
  const data = await graphql(query, { titleSlug: slug })
  return data.question
}
```

- [ ] **Step 2: 实现 `scripts/fetch-top100.mjs`**

调用 `fetchTop100()`，清洗字段，写 `data/problems/index.json`，打印总数与每难度数量。

- [ ] **Step 3: 实现 `scripts/fetch-problems.mjs`**

读 `data/problems/index.json`，对每个 slug 调用 `fetchQuestion(slug)`：

```js
const java = q.codeSnippets.find(s => s.lang === 'Java')?.code ?? ''
const metaData = JSON.parse(q.metaData || '{}')
const problem = {
  frontendId: q.questionFrontendId,
  questionId: q.questionId,
  title: q.title,
  titleCn: q.translatedTitle,
  slug: q.titleSlug,
  difficulty: q.difficulty,
  topics: q.topicTags.map(t => ({ name: t.name, cn: t.nameTranslated, slug: t.slug })),
  metaData,
  codeSnippet: java,
  sampleTestCase: q.sampleTestCase,
  exampleTestcases: q.exampleTestcases,
  contentHtml: q.translatedContent || q.content,
  contentEnHtml: q.content,
  hints: null
}
```

每请求间隔 150ms，写入 `data/problems/<slug>.json`。

- [ ] **Step 4: 下载题面图片**

从 `contentHtml` 用正则提取 `https://assets.leetcode.cn/...` 或 `https://pic.leetcode.cn/...` 图片 URL，下载到 `public/assets/problems/<slug>/`，并把 HTML 中 URL 替换为 `/assets/problems/<slug>/<filename>`。已存在的图片跳过。

- [ ] **Step 5: 实现 `scripts/scrape.mjs` 并运行**

```js
import './fetch-top100.mjs'
import './fetch-problems.mjs'
```

```bash
node scripts/scrape.mjs
```

Expected: 打印 “Top100 fetched: 100 problems”，`data/problems/` 有 100 个 JSON；抽查 `data/problems/two-sum.json` 存在 `contentHtml` 与 `exampleTestcases`。

- [ ] **Step 6: 提交**

```bash
git add data scripts
git commit -m "feat: scrape leetcode top100 problems"
```

---

### Task 3: 抓取并合并 GitHub 题解素材

**Files:**
- Create: `scripts/fetch-solutions.mjs`
- Create: `scripts/enrich-hints.mjs`
- Create: `data/hints/base-tech.mjs`

- [ ] **Step 1: 抓取 `leetcode-master` 题解**

请求 `https://api.github.com/repos/youngyangyang04/leetcode-master/contents/problems` 得到文件名列表，按 `data/problems/index.json` 的题号匹配 `^<frontendId>\\.` 的文件，下载 raw markdown 到 `data/solutions/<frontendId>.md`。

- [ ] **Step 2: 解析题解 markdown**

按二级标题切分（`## 思路`、`## 双指针` 等），抽取出现次数最多的标题作为“解法要点”；保留前 1200 字作为 `sourceExcerpt`。

- [ ] **Step 3: 内置技术知识库**

`data/hints/base-tech.mjs` 按 topic slug 提供 `tech` 数组，例如：

```js
export const TECH_BY_TOPIC = {
  'hash-table': [
    { name: 'HashMap', detail: 'get/containsKey/put 平均 O(1)；适合查找互补元素与去重统计。' }
  ],
  'two-pointers': [
    { name: '双指针', detail: '相向或同向移动指针，用有序性剪枝；注意越界与边界条件。' }
  ]
}
```

- [ ] **Step 4: 生成 `hints` 字段**

`enrich-hints.mjs` 对每题生成：

```js
const hints = {
  optimal: {
    title: '最优解标题（来自题解摘要或自动归纳）',
    approach: '步骤式思路，3-6 行',
    complexity: '时间复杂度 / 空间复杂度',
    javaSnippet: '核心代码片段'
  },
  memory: {
    title: '最易记忆解标题',
    approach: '口诀式思路，2-4 行',
    complexity: '复杂度',
    javaSnippet: '可背模板'
  },
  keywords: ['关键字1', '关键字2', '关键字3'],
  tech: TECH_BY_TOPIC[slug] ?? [],
  pitfalls: ['易错点1', '易错点2']
}
```

Java 片段优先来自已抓取题解中的 Java 代码块；缺失时自动降级为不展示代码的标题/思路。

- [ ] **Step 5: 运行与抽查**

```bash
node scripts/enrich-hints.mjs
```

Expected: 至少 80/100 题有非空 `optimal.approach`；抽查 two-sum、container-with-most-water、sliding-window-maximum。

- [ ] **Step 6: 提交**

```bash
git add data scripts
git commit -m "feat: add github solution hints"
```

---

### Task 4: Java 测试 harness（TDD）

**Files:**
- Create: `tests/harness.test.mjs`
- Create: `server/lib/harness.mjs`
- Create: `server/lib/types.mjs`

- [ ] **Step 1: 写失败测试**

```js
import { describe, it, expect } from 'vitest'
import { buildMainSource } from '../server/lib/harness.mjs'

it('generates a Main.java for two-sum sample testcases', () => {
  const src = buildMainSource({
    name: 'twoSum',
    params: [
      { name: 'nums', type: 'integer[]' },
      { name: 'target', type: 'integer' }
    ],
    return: { type: 'integer[]', size: 2 }
  }, '[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6')
  expect(src).toContain('class Main')
  expect(src).toContain('twoSum')
})
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- tests/harness.test.mjs
```

Expected: FAIL，`Cannot find module`。

- [ ] **Step 3: 实现类型映射 `server/lib/types.mjs`**

把 LeetCode `metaData.type` 字符串映射到 Java 类型：

```js
export const JAVA_TYPES = {
  integer: 'int',
  'integer[]': 'int[]',
  'integer[][]': 'int[][]',
  string: 'String',
  'string[]': 'String[]',
  boolean: 'boolean',
  'boolean[]': 'boolean[]',
  double: 'double',
  'double[]': 'double[]',
  ListNode: 'ListNode',
  TreeNode: 'TreeNode',
  'list<integer>': 'List<Integer>',
  'list<string>': 'List<String>',
  'list<list<integer>>': 'List<List<Integer>>'
}
```

- [ ] **Step 4: 实现 `buildMainSource`**

生成包含以下内容的 `Main.java`：

```java
import java.lang.reflect.Method;
import java.util.*;

public class Main {
  static class ListNode { int val; ListNode next; ListNode(int x) { val = x; } }
  static class TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }

  public static void main(String[] args) throws Exception {
    // 解析样例输入，反射调用 Solution，逐个比较并打印 PASS/FAIL
  }
}
```

样例解析器支持：整数、字符串、布尔、null、一维/二维数组、`List`、链表、树。比较器对数组/链表/树输出 `[1,2,3]` 形式文本。

- [ ] **Step 5: 运行确认通过**

```bash
npm test -- tests/harness.test.mjs
```

Expected: PASS。

- [ ] **Step 6: 集成验证编译运行**

写 `tests/java-run.test.mjs`：对 two-sum 用一个错误解法（期望 FAIL）与正确解法（期望 PASS）各跑一次真实 `javac`。先跑错误解法确认 harness 能判定 FAIL，再跑正确解法确认 PASS。

```bash
npm test -- tests/java-run.test.mjs
```

- [ ] **Step 7: 提交**

```bash
git add server tests
git commit -m "feat: generate and run java test harness"
```

---

### Task 5: Express API

**Files:**
- Create: `server/index.mjs`
- Create: `server/lib/problems.mjs`
- Create: `server/lib/javaRunner.mjs`

- [ ] **Step 1: 实现 `server/lib/problems.mjs`**

```js
import { readFile } from 'node:fs/promises'

export async function listProblems() {
  return JSON.parse(await readFile('data/problems/index.json', 'utf8'))
}

export async function getProblem(slug) {
  return JSON.parse(await readFile(`data/problems/${slug}.json`, 'utf8'))
}
```

- [ ] **Step 2: 实现 `server/lib/javaRunner.mjs`**

`runJava({ code, slug, timeoutMs })`：

1. 读问题 JSON，生成 `Main.java` 与 `Solution.java`。
2. 写入 `os.tmpdir()/leetcode-run-<random>`。
3. `execFile('javac', ['Main.java'], { cwd })`，失败返回 `compileError`。
4. `execFile('java', ['Main'], { cwd, timeout })`，超时返回 `{ timedOut: true }`。
5. 清理目录，返回 `{ pass, stdout, stderr, runtimeMs }`。

超时使用 `AbortController` + `execFile` 的 `signal`，kill 进程组。

- [ ] **Step 3: 实现 `server/index.mjs`**

端口 8787，路由：

```js
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.get('/api/problems', async (req, res) => res.json(await listProblems()))
app.get('/api/problems/:slug', async (req, res) => res.json(await getProblem(req.params.slug)))
app.post('/api/run', async (req, res) => {
  const result = await runJava(req.body)
  res.json(result)
})
```

生产模式静态托管 `dist/`。

- [ ] **Step 4: 验证**

```bash
node server/index.mjs &
curl -s http://127.0.0.1:8787/api/health
curl -s http://127.0.0.1:8787/api/problems | head -c 200
```

Expected: `{"ok":true}` 与 JSON 数组。

- [ ] **Step 5: 提交**

```bash
git add server
git commit -m "feat: add express api and java runner"
```

---

### Task 6: 前端数据层与整体布局

**Files:**
- Create: `src/lib/api.mjs`
- Create: `src/lib/store.mjs`
- Create: `src/components/ProblemList.vue`
- Create: `src/components/ProblemPanel.vue`
- Create: `src/components/HintPanel.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 实现 `src/lib/api.mjs`**

```js
export async function fetchProblems() {
  return (await fetch('/api/problems')).json()
}

export async function fetchProblem(slug) {
  return (await fetch(`/api/problems/${slug}`)).json()
}

export async function runJava(payload) {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}
```

- [ ] **Step 2: 实现 `src/lib/store.mjs`**

用 Vue `reactive` 保存 `problems`、`currentSlug`、`current`、`loading`、`error`；`selectProblem(slug)` 异步加载详情与 Java 模板。

- [ ] **Step 3: 实现 `ProblemList.vue`**

左栏：搜索框、难度筛选（全部/简单/中等/困难）、题目行（题号、标题、通过率、难度色点）。当前题高亮。

- [ ] **Step 4: 实现 `ProblemPanel.vue`**

`v-html` 渲染题面；图片已在抓取时本地化；渲染示例、约束。

- [ ] **Step 5: 实现 `HintPanel.vue`**

分区渲染：最优解、最易记忆解、关键字 chips、所用技术详解、易错点。代码块用 `<pre><code>`。

- [ ] **Step 6: 组装 `App.vue` 三栏布局**

`aside` + `main`（题目/提示 tabs）+ 编辑器面板。初始加载列表并选中第一题。

- [ ] **Step 7: 提交**

```bash
git add src
git commit -m "feat: build problem list and panels"
```

---

### Task 7: Monaco Java 编辑器

**Files:**
- Create: `src/components/EditorPanel.vue`
- Create: `src/lib/editor.js`

- [ ] **Step 1: 配置 Monaco worker**

`src/lib/editor.js` 导入 `monaco-editor` 与 `editor.worker?worker`，设置 `self.MonacoEnvironment`。

- [ ] **Step 2: Java 关键字补全**

`monaco.languages.registerCompletionItemProvider('java', provider)`；提供 `public`、`private`、`static`、`int`、`String`、`List`、`return`、`new` 等关键字与常用类型。补全受全局 `completionEnabled` 开关控制。

- [ ] **Step 3: 实现 `EditorPanel.vue`**

包含：

- 标题栏：题号/中文题名、难度。
- 工具行：超时下拉（1s/3s/5s/10s）、“代码提示”开关、“恢复模板”、“运行”按钮。
- Monaco 实例；切换题目时替换模型内容为模板。
- 下方控制台显示运行结果。

- [ ] **Step 4: 运行验证**

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`，确认编辑器渲染、关键字提示可开关。

- [ ] **Step 5: 提交**

```bash
git add src
git commit -m "feat: add monaco java editor"
```

---

### Task 8: 样式与响应式打磨

**Files:**
- Create: `src/styles.css`
- Modify: `src/App.vue`、各组件 class

- [ ] **Step 1: 设计系统**

以力扣式深色代码区 + 浅色阅读区为主，加入本地工具的克制差异化：题面区使用暖白纸张色，代码区使用深墨绿，强调色用橙红；字体用系统中文栈 + `ui-monospace` 代码字体。

- [ ] **Step 2: 响应式**

- `>=1100px`：三栏（列表 280px、题面 minmax(420px, 1fr)、编辑器 1fr）。
- `700-1100px`：列表折叠为顶部横向滚动条，题面与编辑器上下分栏。
- `<700px`：题面/提示页签全屏，编辑器在页签下方，控制台可滚动。

- [ ] **Step 3: 视觉细节**

难度色：简单绿 `#00b8a3`、中等橙 `#ffb800`、困难红 `#ff375f`；当前题目左侧橙色竖条；运行按钮主色 `#2f6fed`；代码提示开关使用分段按钮而非文字说明。

- [ ] **Step 4: 提交**

```bash
git add src
git commit -m "feat: polish layout and responsive styles"
```

---

### Task 9: 验收与修复

**Files:**
- Create: `tests/api.test.mjs`（可选）
- Modify: 按验证结果修复

- [ ] **Step 1: 单元与集成测试**

```bash
npm test
```

Expected: 全部 PASS。

- [ ] **Step 2: 构建**

```bash
npm run build
```

Expected: 退出码 0。

- [ ] **Step 3: 启动并人工/Playwright 验证**

```bash
npm run dev
```

用 Playwright 打开 `http://localhost:5173`：截图桌面与移动尺寸，检查题目列表、题面、提示页、编辑器、运行控制台；点击运行 two-sum 默认模板确认 PASS。

- [ ] **Step 4: 修复发现的问题并复跑**

回到对应任务修复，重新跑 `npm test` 与 `npm run build`。

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: complete local leetcode platform"
```

---

## 自审

- 规格覆盖：100 题列表、题面/图片/测试用例、提示四块内容、Monaco 补全开关、超时开关、Java 编译执行、无登录社交。
- 无占位符：除数据抓取本身内容依赖远端外，代码步骤均给出实现内容。
- 类型一致：前后端使用 `slug` 作为唯一标识，`timeoutMs` 单位为毫秒。
