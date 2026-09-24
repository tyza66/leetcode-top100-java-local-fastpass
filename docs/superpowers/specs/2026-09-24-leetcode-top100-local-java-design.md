# 力扣 Top100 本地 Java 训练平台设计文档

日期：2026-09-24

## 目标

构建一个无需登录、无社交功能的本地 Web 应用：选题后进入类似力扣的做题界面，左侧是题目、提示两个页签；右侧是带关键字补全开关、超时开关的 Java 网页编辑器；点击运行后调用本机 JDK 21 编译执行样例测试用例。题目、图片、测试用例和题解全部从官网/GitHub 拉取后本地化。

## 架构

- 前端：Vue 3 + Vite + Monaco Editor。
- 后端：Node.js + Express，提供题目 API、问题详情 API、Java 编译执行 API。
- 执行：后端生成 Java 测试 harness，调用本机 `javac` / `java`，按超时开关执行并返回 stdout、stderr、编译错误。
- 数据：LeetCode CN GraphQL 抓取热题 100 列表与详情，GitHub `youngyangyang04/leetcode-master` 提供中文题解素材，落盘到本地 JSON 与图片资源目录。

## 数据流

1. `scripts/fetch-top100.mjs`：调用 `leetcode.cn/graphql` 的 `problemsetQuestionList`（`filters.listId = "2cktkvj"`）获取 100 题列表，写 `data/problems/index.json`。
2. `scripts/fetch-problems.mjs`：对每个 `titleSlug` 调用 `questionData` 查询，保存题面 HTML、示例测试用例、`metaData`、Java 模板、难度、通过率、标签；下载题面图片到 `public/assets/problems/<slug>/`。
3. `scripts/fetch-solutions.mjs`：按题目编号抓取 `leetcode-master` 的 `problems/<题号>.<中文标题>.md`，解析出思路、复杂度、代码等素材。
4. `scripts/enrich-hints.mjs`：把题解素材与内置的技术详解/关键字模板合并，生成每题 `hints` 字段，写回问题 JSON。
5. 前端从 `/api/problems` 加载列表，按需从 `/api/problems/:slug` 加载详情与提示；运行请求 POST `/api/run`。

## 数据模型

`data/problems/index.json`：

```json
{
  "id": 1,
  "frontendId": "1",
  "title": "Two Sum",
  "titleCn": "两数之和",
  "slug": "two-sum",
  "difficulty": "EASY",
  "acRate": 0.55,
  "topics": ["数组", "哈希表"]
}
```

`data/problems/<slug>.json`：

```json
{
  "frontendId": "1",
  "title": "Two Sum",
  "titleCn": "两数之和",
  "slug": "two-sum",
  "difficulty": "EASY",
  "acRate": 0.55,
  "topics": ["Array", "Hash Table"],
  "contentHtml": "<p>...</p>",
  "metaData": "{\"name\":\"twoSum\",...}",
  "codeSnippet": "class Solution {...}",
  "sampleTestcases": "[2,7,11,15]\n9\n...",
  "hints": {
    "optimal": {
      "title": "哈希表一次遍历",
      "approach": "遍历 nums，用 Map 记录已见值到下标；对每个 num 查 target - num。",
      "complexity": "O(n) / O(n)",
      "javaSnippet": "class Solution {...}"
    },
    "memory": {
      "title": "暴力两重循环（易记）",
      "approach": "两重循环枚举下标对，找到即返回。",
      "complexity": "O(n^2) / O(1)",
      "javaSnippet": "class Solution {...}"
    },
    "keywords": ["哈希表", "互补数", "一次遍历"],
    "tech": [
      { "name": "HashMap", "detail": "put 覆盖不会影响正确性；containsKey 平均 O(1)。" }
    ],
    "pitfalls": ["同一个元素不能使用两次", "返回下标而非元素"]
  }
}
```

## Java 执行设计

`POST /api/run` 请求：

```json
{
  "slug": "two-sum",
  "code": "class Solution {...}",
  "timeoutMs": 5000
}
```

后端步骤：

1. 从 `data/problems/<slug>.json` 读取 `metaData` 与 `sampleTestcases`。
2. 生成 `Main.java`：内嵌通用 JSON 风格样例解析器（支持整数、字符串、布尔、null、一维/二维数组、链表、树），按 `metaData` 反射调用 `Solution` 方法，比较返回值与期望输出。
3. 写入临时目录，执行 `javac Main.java`，失败时返回编译错误。
4. 执行 `java Main`，超时则 kill 进程并返回 `Time Limit Exceeded`。
5. 返回 `{ pass, results, stdout, stderr, compileError, runtimeMs }`。

## 前端界面

- 左栏：100 题列表，显示题号、难度色、中文标题、通过率；支持搜索和难度筛选。
- 主区左侧页签：
  - “题目”：题面 HTML、示例、约束、图片。
  - “提示”：最优解、最易记忆解、关键字、所用技术详解、易错点。
- 主区右侧：
  - Monaco 编辑器，默认 Java 模板。
  - 工具栏：语言、超时开关、代码提示开关、恢复模板、运行按钮。
  - 运行控制台：输出结果、测试用例通过状态、耗时。
- 无登录、无社交；本地 `npm run dev` 后浏览器直开。

## 错误处理与验证

- 抓取脚本支持断点重跑：已存在的问题文件跳过或覆盖选项。
- 后端执行使用临时目录，执行结束清理；超时使用进程组 kill。
- 前端对编译错误、超时、网络错误分别展示。
- 测试：Vitest 覆盖 harness 生成与样例解析；用真实 `javac` 集成验证 two-sum、滑动窗口最大值等样例。
- 交付前运行 `npm run build`、`npm test`，并用 Playwright 截图验证桌面/移动布局与运行流程。

## 范围

首版覆盖力扣热题 100 全部题目；付费题不在列表中则不包含。登录、提交、排行、社区等社交能力不做。
