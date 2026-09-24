export const TECH_BY_TOPIC = {
  'hash-table': [
    { name: 'HashMap / HashSet', detail: 'get、containsKey、put 平均 O(1)。哈希表适合把“查找是否存在”降到常数时间，使用时要决定 key 与 value 各自表达什么，例如“值 -> 下标”还是“元素 -> 出现次数”。' },
    { name: '冲突与扩容', detail: 'Java 的 HashMap 在哈希冲突时使用链表或红黑树，整体平均仍是 O(1)。遍历过程中不断扩容可能带来少量开销，但不影响算法复杂度。' }
  ],
  'two-pointers': [
    { name: '双指针', detail: '分为相向双指针（有序数组求两数和、接雨水、盛最多水）和同向快慢指针（去重、滑动窗口）。核心是先建立指针移动的不变量，每次只让指针朝一个方向移动，避免重复枚举。' },
    { name: '边界处理', detail: '写好 while 的结束条件，防止 left 与 right 交叉或越界；在比较元素时优先验证索引是否有效。' }
  ],
  'sliding-window': [
    { name: '滑动窗口', detail: '用 left/right 维护一个连续区间，右指针扩张加入元素，左指针收缩移除元素。窗口内容通常用计数数组、HashMap 或单调队列维护，使整体复杂度降到 O(n)。' },
    { name: '窗口有效性', detail: '必须先明确窗口何时合法：通常是“满足条件后收缩”还是“不满足条件时扩张”，这决定了 while 循环的位置。' }
  ],
  'dynamic-programming': [
    { name: '动态规划五步', detail: '定义 dp 状态 -> 推导转移方程 -> 确定初始值 -> 确定遍历顺序 -> 返回答案。先写小例子验证 dp 表，再压缩空间。' },
    { name: '状态压缩', detail: '很多 dp 只依赖前一两行，可以把二维数组压成一维，甚至只用两个变量；滚动数组不会改变状态含义，只减少空间。' },
    { name: '记忆化搜索', detail: '用递归 + memo 数组/Map 缓存结果，本质上与自底向上 dp 等价，适合状态转移方向不直观的题目。' }
  ],
  'backtracking': [
    { name: '回溯模板', detail: '做选择 -> 递归 -> 撤销选择。一般代码为 path.add(x); dfs(pos+1); path.remove(path.size()-1)。组合、排列、子集、棋盘类题目都可套用。' },
    { name: '剪枝', detail: '排序后跳过相邻重复元素、提前判断剩余元素是否足够、用 used 数组标记已选下标，都能大幅减少分支。' }
  ],
  'depth-first-search': [
    { name: 'DFS 框架', detail: '递归进入子树/邻居之前先处理当前节点，返回结果时用子树信息汇总。树上的路径和、最大路径、最近公共祖先都依赖后序返回值。' },
    { name: '访问标记', detail: '图中需要 visited 集合避免走回头路；树天然无环，但要注意空节点和越界条件。' }
  ],
  'breadth-first-search': [
    { name: 'BFS 框架', detail: '用队列做层级遍历，每次取出当前层全部节点再扩展下一层；可以同时处理最短路径、层级序号、多源扩散等场景。' },
    { name: '层次计数', detail: '在 for (int i = size; i > 0; i--) 的循环里计算层数，能保证每次循环只处理同一层节点。' }
  ],
  'binary-tree': [
    { name: '树的三种遍历', detail: '前序（根左右）、中序（左根右）、后序（左右根）。先序可以序列化树，中序在有 BST 性质时有序，后序适合自底向上汇总。' },
    { name: '递归返回值设计', detail: '确定每个递归函数“要什么、给什么”。例如路径和要返回最大贡献，直径要维护全局最大值。' }
  ],
  'binary-search-tree': [
    { name: 'BST 性质', detail: '左子树所有值小于根，右子树所有值大于根，中序遍历得到升序序列。增删查平均 O(log n)。' },
    { name: '验证与转换', detail: '验证 BST 要传上下界，不能只比较当前节点与左右孩子；中序序列是判断和重建的常用桥梁。' }
  ],
  'binary-search': [
    { name: '二分查找模板', detail: '在有序（或满足单调性）的区间里找边界，用 l <= r 与 mid = l + (r - l) / 2。问“第一个满足条件”还是“最后一个满足条件”决定收缩方向。' },
    { name: '峰值与旋转数组', detail: '不一定完全有序，只要比较中点与端点即可排除一半；注意数组长度为 1 和边界索引。' }
  ],
  'linked-list': [
    { name: '虚拟头节点', detail: '需要删除头节点或统一处理插入时，创建 dummy.next = head，操作完成后返回 dummy.next，能省大量特判。' },
    { name: '快慢指针', detail: '找中点、找环、找倒数第 k 个节点都能用快慢指针；相遇后让一个指针回头的“找环入口”技巧要会推导。' }
  ],
  'stack': [
    { name: '栈与括号/表达式', detail: '后进先出天然匹配最近配对：括号匹配、直方图最大矩形、每日温度、字符串解码都依赖单调栈或普通栈保存待处理信息。' },
    { name: '单调栈', detail: '维护栈内元素单调递增或递减，弹出时往往就是答案结算时机；栈中保存下标比保存值更好用。' }
  ],
  'monotonic-stack': [
    { name: '单调栈', detail: '找“左边/右边第一个更大或更小”的元素，用单调栈一次遍历完成。入栈时保持单调性，出栈时结算答案。' }
  ],
  'monotonic-queue': [
    { name: '单调队列', detail: '滑动窗口最大值/最小值常用双端队列维护，队首是最值，队尾按单调性淘汰无用元素；每个元素最多出入队一次，整体 O(n)。' }
  ],
  'heap-priority-queue': [
    { name: '优先队列', detail: 'Java PriorityQueue 默认小顶堆。求第 k 大用大小为 k 的小顶堆，求若干最大元素用大顶堆；实现类统一在初始化时传入 Comparator。' },
    { name: '合并多个有序链', detail: '把每个序列的头节点放入堆，每次弹出最小节点并推入其后继，能高效完成 k 路归并。' }
  ],
  'greedy': [
    { name: '贪心策略', detail: '在每一步做出当前看起来最优的选择，需要证明局部最优能推出全局最优。常见场景：区间调度、跳跃游戏、分发任务、区间覆盖。' },
    { name: '贪心 + 排序', detail: '很多贪心题先排序再扫描，例如按结束时间排序、按高度排序、按频率排序，排序能让局部决策被简化。' }
  ],
  'sorting': [
    { name: '常用排序', detail: '快速排序/归并排序 O(n log n)；计数排序适合值域小的整数；TopK/找第 k 大可用快速选择，平均 O(n)。' },
    { name: '原地与稳定性', detail: '需要原地修改且关注空间时用快排或堆排；需要稳定排序且内存充足时用归并。' }
  ],
  'divide-and-conquer': [
    { name: '分治', detail: '把问题拆成独立子问题，分别求解后合并。归并排序、最大子数组、二叉搜索树计数都可以用分治思想。' },
    { name: '合并函数', detail: '分治的难点常在 merge 一步：要维护哪些全局信息、如何把左右答案组合。' }
  ],
  'prefix-sum': [
    { name: '前缀和', detail: '前缀和数组 s[i] 表示前 i 个元素之和，区间和 = s[r] - s[l-1]。子数组和为 k 的问题可配合哈希表记录前缀和出现次数。' },
    { name: 'HashMap 优化', detail: '求“和为 k 的子数组数”时，一边计算前缀和一边查询 pre - k 的出现次数，并更新当前前缀和计数，一次遍历完成。' }
  ],
  'string': [
    { name: '字符串处理', detail: '注意不可变性：频繁拼接用 StringBuilder；比较时想清楚大小写、数字位数、分隔符和空串；回文类题目常配合中心扩展或马拉车。' },
    { name: '字符计数', detail: '只含小写字母时用 int[26]，需要记录字符种类时维护 diff 变量，避免每次重新扫描。' }
  ],
  'matrix': [
    { name: '矩阵遍历', detail: '行列方向用方向数组 dirs={{-1,0},{1,0},{0,-1},{0,1}}；DFS 时先标记再递归，避免重复访问。' },
    { name: '矩阵变换', detail: '原地旋转、螺旋遍历、搜索二维矩阵都要求严格按层或按方向定义边界，写之前先画出下标规律。' }
  ],
  'math': [
    { name: '数学归纳', detail: '求通项、快速幂、取模、组合数、容斥等场景先推导公式，再在代码里维护迭代变量。' }
  ],
  'bit-manipulation': [
    { name: '异或性质', detail: 'a ^ a = 0，0 ^ a = a，异或满足交换律和结合律。出现奇数次的唯一元素可以用全员异或求出。' },
    { name: '位运算技巧', detail: 'n & (n-1) 消除最低位 1；n & -n 取出最低位 1；判断 2 的幂、统计 1 的个数都能用。' }
  ],
  'trie': [
    { name: '字典树', detail: '每个节点用一个数组/Map 存孩子，并标记是否为单词结尾。插入和查找长度都是 O(len)，适合前缀匹配与自动补全。' }
  ],
  'union-find': [
    { name: '并查集', detail: 'find 做路径压缩，union 按秩合并，接近 O(alpha)。适合动态连通性、岛屿连通、冗余连接等场景。' }
  ],
  'graph': [
    { name: '图遍历', detail: '邻接表建图；BFS 适合无权最短路和层数，DFS 适合连通分量与依赖路径；注意 visited 标记的时间点。' }
  ],
  'topological-sort': [
    { name: '拓扑排序', detail: '用入度表 + 队列实现 Kahn 算法：先加入入度为 0 的节点，每弹出节点就把后继入度减一。最终访问数不等于节点数说明有环。' }
  ],
  'recursion': [
    { name: '递归三要素', detail: '结束条件、缩小问题规模、当前层与递归结果的关系。写递归先默认子调用已经正确返回，再组合当前层逻辑。' }
  ],
  'memoization': [
    { name: '记忆化缓存', detail: '把递归参数映射到结果，存放在二维数组或 HashMap；注意缓存命中与未命中分开，避免用默认值掩盖真实结果 0。' }
  ],
  'design': [
    { name: '设计题', detail: '先确定核心数据结构，再约束每个方法复杂度。LRU 用 HashMap + 双向链表，最小栈用辅助栈或自定义节点，序列化树用先序 + 分隔符。' }
  ],
  'double-linked-list': [
    { name: '双向链表', detail: '在 O(1) 删除节点需要前驱指针；配合 HashMap 的“节点定位”可以实现 LRU 等数据结构。' }
  ],
  'segment-tree': [
    { name: '线段树', detail: '把区间维护在一棵树上，查询和更新 O(log n)。常用于区间和、区间最值、区间 lazy 更新。' }
  ],
  'binary-indexed-tree': [
    { name: '树状数组', detail: '用 lowbit 快速维护前缀和，单点更新与区间查询 O(log n)；相比线段树实现更短，适合单点更新场景。' }
  ],
  'quickselect': [
    { name: '快速选择', detail: '仿照快排分区，只递归含第 k 大元素的那一侧，平均复杂度 O(n)；与堆解法相比常数更小。' }
  ],
  'bucket-sort': [
    { name: '桶排序', detail: '数据值域/频次有限时按桶统计，线性完成排序或计数；注意桶的容量与下标换算。' }
  ],
  'counting': [
    { name: '计数数组', detail: '用数值直接作下标统计出现次数，常见 int[101]、int[26]；能把排序、频次判断降到 O(n)。' }
  ],
  '0-1-knapsack': [
    { name: '0-1 背包', detail: '每个物品只能选一次，滚动数组时从大到小遍历容量，保证每个物品只被使用一次。' }
  ],
  'complete-knapsack': [
    { name: '完全背包', detail: '每个物品可选无限次，滚动数组时从小到大遍历容量；组合数/排列数问题要注意两层循环的顺序。' }
  ],
  'knapsack-problem': [
    { name: '背包问题', detail: '先抽象出“物品、容量、价值”，再确定恰好装满还是不超过容量，初始值用 -inf 还是 0 会直接改变答案。' }
  ],
  'shortest-path': [
    { name: '最短路', detail: '无权图用 BFS，带权非负用 Dijkstra，可能负边用 Bellman-Ford；注意重边、自环与不可达点。' }
  ],
  'lowest-common-ancestor': [
    { name: '最近公共祖先', detail: '后序遍历返回“是否找到 p/q”；左右都找到时当前节点就是 LCA；BST 版本可直接按值大小决定走向。' }
  ],
  'manacher': [
    { name: 'Manacher 算法', detail: '用中心扩展 + 回文半径数组避免重复比较，能在 O(n) 内求最长回文子串；实现时注意边界与对称半径初始值。' }
  ],
  'floyds-cycle-finding-algorithm': [
    { name: 'Floyd 判圈', detail: '快慢指针在环内必然相遇；相遇后一个指针回到头节点，两指针同速走，再次相遇处就是环入口。' }
  ],
  'boyer-moore-majority-vote-algorithm': [
    { name: '摩尔投票', detail: '维护候选值与计数，计数归零时替换候选值。最终候选是出现次数超过一半的可能答案，需要再扫一遍验证。' }
  ],
  'bracket-sequences': [
    { name: '括号序列', detail: '用栈匹配右括号；生成括号用回溯并在递归中限制左括号/右括号数量；最长有效括号可结合栈或两次左右扫描。' }
  ],
  'pigeonhole-principle': [
    { name: '抽屉原理', detail: 'n+1 个元素放进 n 个桶必有一桶至少两个元素。判重/找重复数时把值域映射到桶或下标，配合原地标记。' }
  ],
  'quicksort': [
    { name: '快排', detail: '选 pivot 分区，递归排序两侧；平均 O(n log n)。实现时用左右交换法避免额外数组。' }
  ],
  'merge-sort': [
    { name: '归并排序', detail: '先拆后合，合并两个有序段；稳定且适合链表排序、求逆序对。' }
  ],
  'bubble-sort': [
    { name: '冒泡排序', detail: '相邻交换把最大元素“浮”到末尾，最多 n-1 趟；适合小数组或教学演示。' }
  ],
  'binary-lifting': [
    { name: '倍增', detail: '预处理 2^k 步后的状态，用于 LCA、RMQ、树上 K 级祖先等；查询时按二进制位跳跃。' }
  ],
  'dp-on-trees': [
    { name: '树上 DP', detail: '后序遍历得到子树答案，父节点用子树状态合并；常见打家劫舍 III：每个节点保存“选/不选”两个状态。' }
  ],
  'longest-increasing-subsequence': [
    { name: '最长递增子序列', detail: 'O(n^2) 用 dp[i]=max(dp[j]+1)；O(n log n) 用辅助数组维护递增尾巴并二分替换，注意替换不改变长度但保留更优结尾。' }
  ],
  'bellman-ford-algorithm': [
    { name: 'Bellman-Ford', detail: '对每条边松弛 n-1 次，可处理负权边；第 n 轮还能松弛说明存在负环。' }
  ],
  'floyd-warshall-algorithm': [
    { name: 'Floyd-Warshall', detail: '三重循环求任意两点最短路，k 在最外层枚举中间点；适合点数很小的稠密图。' }
  ],
  'range-minimum-maximum-query': [
    { name: 'RMQ', detail: '区间最值可用稀疏表或线段树；稀疏表预处理 O(n log n)，查询 O(1)。' }
  ],
  'directed-acyclic-graph': [
    { name: 'DAG', detail: '无环有向图可做拓扑排序与 DP；按拓扑序处理才能保证依赖在前。' }
  ],
  'tournament-sort': [
    { name: '锦标赛排序', detail: '通过两两比较构造树，找次优元素时只需比较它与胜者路径上的对手。' }
  ],
  'brute-force-search': [
    { name: '暴力枚举', detail: '直接枚举所有可能，适合数据范围小或作为兜底；写之前先算最坏枚举量，避免裸奔超时。' }
  ],
  'combinatorics': [
    { name: '组合数学', detail: '组合数 C(n,k) 可用递推或公式计算；做组合时注意去重、顺序问题与取模。' }
  ]
}

export const TOPIC_CN = {
  'hash-table': '哈希表',
  array: '数组',
  'two-pointers': '双指针',
  queue: '队列',
  'sliding-window': '滑动窗口',
  'dynamic-programming': '动态规划',
  backtracking: '回溯',
  'depth-first-search': '深度优先搜索',
  'breadth-first-search': '广度优先搜索',
  'binary-tree': '二叉树',
  'binary-search-tree': '二叉搜索树',
  'binary-search': '二分查找',
  'linked-list': '链表',
  stack: '栈',
  'monotonic-stack': '单调栈',
  'monotonic-queue': '单调队列',
  'heap-priority-queue': '堆/优先队列',
  greedy: '贪心',
  sorting: '排序',
  'divide-and-conquer': '分治',
  'prefix-sum': '前缀和',
  string: '字符串',
  matrix: '矩阵',
  math: '数学',
  'bit-manipulation': '位运算',
  trie: '字典树',
  'union-find': '并查集',
  graph: '图',
  'topological-sort': '拓扑排序',
  recursion: '递归',
  memoization: '记忆化',
  design: '设计',
  'doubly-linked-list': '双向链表',
  'segment-tree': '线段树',
  'binary-indexed-tree': '树状数组',
  quickselect: '快速选择',
  'bucket-sort': '桶排序',
  counting: '计数',
  '0-1-knapsack': '0-1 背包',
  'complete-knapsack': '完全背包',
  'knapsack-problem': '背包问题',
  'shortest-path': '最短路',
  'lowest-common-ancestor': '最近公共祖先',
  manacher: '马拉车算法',
  'floyds-cycle-finding-algorithm': '快慢指针判环',
  'boyer-moore-majority-vote-algorithm': '摩尔投票',
  'bracket-sequences': '括号序列',
  'pigeonhole-principle': '抽屉原理',
  quicksort: '快速排序',
  'merge-sort': '归并排序',
  'bubble-sort': '冒泡排序',
  'binary-lifting': '倍增',
  'dp-on-trees': '树上 DP',
  'longest-increasing-subsequence': '最长递增子序列',
  'bellman-ford-algorithm': 'Bellman-Ford',
  'floyd-warshall-algorithm': 'Floyd-Warshall',
  'range-minimum-maximum-query': '区间最值查询',
  'directed-acyclic-graph': '有向无环图',
  'tournament-sort': '锦标赛排序',
  'brute-force-search': '暴力搜索',
  combinatorics: '组合数学'
}

export const MEMORY_FALLBACK_BY_TOPIC = {
  array: {
    title: '暴力枚举（兜底）',
    approach: '先枚举所有可选的“起点/下标对”，逐个验证条件，找到答案立即返回。代码直观、不易写错，适合先保正确性再优化。',
    complexity: '通常 O(n^2) 时间 / O(1) 空间'
  },
  'hash-table': {
    title: '暴力查找（兜底）',
    approach: '第一层枚举一个元素，第二层线性扫描找目标对应元素；每轮用下标与元素关系做去重。',
    complexity: 'O(n^2) 时间 / O(1) 空间'
  },
  'dynamic-programming': {
    title: '记忆化搜索',
    approach: '把大问题写成递归函数，参数进备忘录；先写朴素递归，再缓存子问题，最后再改自底向上表格。',
    complexity: '递归 O(状态数 x 转移) / O(状态数)'
  },
  'backtracking': {
    title: '回溯生成所有候选',
    approach: '用递归枚举每一步选择，选择后用临时列表记录路径，回溯时撤销最后一步；到边界时判断是否合法。',
    complexity: '指数级，取决于分支数'
  },
  'two-pointers': {
    title: '暴力双循环',
    approach: '两层循环枚举所有配对，把下标对当成候选集，最后统一做条件验证与最值比较。',
    complexity: 'O(n^2) 时间 / O(1) 空间'
  },
  'sliding-window': {
    title: '枚举所有子区间',
    approach: '用双层循环确定每个左右端点，对每个子区间单独统计并更新答案；范围小的时候足够。',
    complexity: 'O(n^2) 时间 / O(1) 空间'
  },
  'linked-list': {
    title: '转数组再处理',
    approach: '先遍历链表把值放入数组，用数组完成判断或计算，再按需重建链表；逻辑直观，面试中可先给该解法。',
    complexity: 'O(n) 时间 / O(n) 空间'
  },
  string: {
    title: '枚举子串 + 计数',
    approach: '枚举字符串所有起点，逐步扩展右端点并维护计数，扩展过程中判断是否满足条件；写起来直观。',
    complexity: 'O(n^2) 时间 / O(字符集) 空间'
  },
  tree: {
    title: '递归暴力遍历',
    approach: '对每个节点执行一次以它为根的完整遍历，把所有子树统计结果汇总；思路简单，适合小规模树。',
    complexity: '最坏 O(n^2) 时间'
  },
  'binary-tree': {
    title: '递归暴力遍历',
    approach: '对每个节点执行一次完整子树遍历并汇总；逻辑直接，先把所有节点当候选根。',
    complexity: '最坏 O(n^2) 时间'
  },
  'binary-search': {
    title: '线性扫描',
    approach: '直接从头到尾扫描数组并记录答案；只在区间极小时使用，或者作为验证二分结果的参考实现。',
    complexity: 'O(n) 时间 / O(1) 空间'
  },
  stack: {
    title: '两层循环补栈',
    approach: '对每个位置扫描其后元素，找到第一个满足条件的值并记录；不再依赖栈时最容易理解。',
    complexity: 'O(n^2) 时间 / O(1) 空间'
  },
  'heap-priority-queue': {
    title: '排序后截取',
    approach: '把全部元素排序，再取前 k 个；思路最直接，适合 k 较小时使用。',
    complexity: 'O(n log n) 时间 / O(n) 空间'
  },
  'depth-first-search': {
    title: '对所有起点 DFS',
    approach: '把每个点/节点都当作起点走一遍搜索，用 visited 防止绕圈，每次搜索维护全局计数。',
    complexity: 'O(n) 到 O(n^2) 取决于图结构'
  },
  'breadth-first-search': {
    title: '逐层扩展 BFS',
    approach: '从起点入队，每次处理当前层全部节点再进入下一层，用距离数组记录步数。',
    complexity: 'O(V+E) 时间 / O(V) 空间'
  }
}

export const PITFALLS_BY_TOPIC = {
  'hash-table': ['注意“先查后插”，避免同一元素被使用两次', 'Map 里存下标还是存次数要想清楚', '整数可能为负，不要用数组下标无脑表示 key'],
  'two-pointers': ['移动指针前检查越界', '有去重要求时不要跳过重复元素而不更新答案', '相向指针不要交叉'],
  'sliding-window': ['窗口何时收缩要想清楚，否则可能漏解', '计数变化后要先判断窗口是否仍合法', '右指针越界后还要处理窗口内合法结果'],
  'dynamic-programming': ['dp 数组初始值要区分 0 与“不可达”', '遍历顺序决定能否使用前一轮状态，注意下标从 1 开始', '返回的是 dp[n] 还是 dp 数组最大值'],
  'backtracking': ['递归结束条件要放在选择之前', '撤销选择必须与选择一一对应', '排序去重时跳过相邻重复元素的条件要写对'],
  'linked-list': ['处理头节点变化时使用虚拟头节点', '快指针每次走两步前确认 next 非空', '翻转链表要保存好 next，避免断链'],
  'binary-tree': ['空节点要单独处理', '递归返回值类型与树的关系要先设计好', '使用全局变量时注意重置'],
  'binary-search': ['while 条件的 < 与 <= 决定边界怎么写', 'mid 用 l+(r-l)/2 防溢出', '更新 l/r 时必须跳过 mid，否则死循环'],
  'stack': ['栈空时不要贸然 peek/pop', '保存下标比保存值更容易算距离', '记得最后清空剩余栈内容'],
  'string': ['字符串下标从 0 开始，子串边界要小心', '统计字符时先确定字符集大小', '拼接字符串用 StringBuilder'],
  'matrix': ['边界判断顺序：先越界再看内容', '原地修改前先备份会被覆盖的值', 'visited 要在入队/递归前标记'],
  'greedy': ['贪心需要能证明局部最优 -> 全局最优', '排序的依据要与贪心目标一致', '注意覆盖的区间初值']
}
