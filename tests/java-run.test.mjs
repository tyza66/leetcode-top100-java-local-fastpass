import { describe, expect, it } from 'vitest'
import { runJava } from '../server/lib/javaRunner.mjs'

const twoSumCorrect = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int other = target - nums[i];
            if (seen.containsKey(other)) return new int[] { seen.get(other), i };
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`

const twoSumWrong = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[] { 0, 0 };
    }
}`

const groupAnagrams = `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`

const lruCache = `class LRUCache {
    private final LinkedHashMap<Integer, Integer> cache;
    private final int capacity;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new LinkedHashMap<Integer, Integer>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                return size() > LRUCache.this.capacity;
            }
        };
    }

    public int get(int key) {
        return cache.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        cache.put(key, value);
    }
}`

const lca = `class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root.val == p.val || root.val == q.val) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left == null) return right;
        if (right == null) return left;
        return root;
    }
}`

const codec = `public class Codec {
    public String serialize(TreeNode root) {
        List<String> out = new ArrayList<>();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node == null) {
                out.add("null");
                continue;
            }
            out.add(String.valueOf(node.val));
            queue.offer(node.left);
            queue.offer(node.right);
        }
        while (out.size() > 0 && out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
        return "[" + String.join(",", out) + "]";
    }

    public TreeNode deserialize(String data) {
        if (data == null || data.equals("[]")) return null;
        String[] parts = data.substring(1, data.length() - 1).split(",");
        TreeNode root = new TreeNode(Integer.parseInt(parts[0]));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        int i = 1;
        while (!queue.isEmpty() && i < parts.length) {
            TreeNode node = queue.poll();
            if (i < parts.length && !parts[i].equals("null")) {
                node.left = new TreeNode(Integer.parseInt(parts[i]));
                queue.offer(node.left);
            }
            i++;
            if (i < parts.length && !parts[i].equals("null")) {
                node.right = new TreeNode(Integer.parseInt(parts[i]));
                queue.offer(node.right);
            }
            i++;
        }
        return root;
    }
}`

describe('java runner integration', () => {
  it('rejects a wrong two-sum solution', async () => {
    const result = await runJava({ slug: 'two-sum', code: twoSumWrong, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.timedOut).toBe(false)
    expect(result.pass).toBe(0)
    expect(result.total).toBe(3)
    expect(result.results.filter((item) => item.status === 'FAIL').length).toBe(3)
  })

  it('accepts a correct two-sum solution', async () => {
    const result = await runJava({ slug: 'two-sum', code: twoSumCorrect, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.pass).toBe(result.total)
    expect(result.results.every((item) => item.status === 'PASS')).toBe(true)
  })

  it('runs unordered list output for group anagrams', async () => {
    const result = await runJava({ slug: 'group-anagrams', code: groupAnagrams, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.pass).toBe(result.total)
  })

  it('runs a design problem harness for LRU cache', async () => {
    const result = await runJava({ slug: 'lru-cache', code: lruCache, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.pass).toBe(result.total)
  })

  it('compares tree node identity for lowest common ancestor', async () => {
    const result = await runJava({ slug: 'lowest-common-ancestor-of-a-binary-tree', code: lca, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.pass).toBe(result.total)
  })

  it('round-trips serialized binary trees', async () => {
    const result = await runJava({ slug: 'serialize-and-deserialize-binary-tree', code: codec, timeoutMs: 10_000 })
    expect(result.compileError).toBeNull()
    expect(result.pass).toBe(result.total)
  })

  it('kills a timed out solution and reports timedOut', async () => {
    const loop = `class Solution {
        public int[] twoSum(int[] nums, int target) {
            while (true) {}
        }
    }`
    const result = await runJava({ slug: 'two-sum', code: loop, timeoutMs: 400 })
    expect(result.timedOut).toBe(true)
    expect(result.pass).toBe(0)
  })
})
