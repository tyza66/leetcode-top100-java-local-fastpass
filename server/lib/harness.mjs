import { canonicalExpected, javaLiteral, javaType, localVar } from './types.mjs'

const DESIGN_SLUGS = new Set(['lru-cache', 'min-stack', 'implement-trie-prefix-tree'])
const UNORDERED_SLUGS = new Set([
  'two-sum',
  'top-k-frequent-elements',
  'group-anagrams',
  'subsets',
  'permutations',
  'combination-sum',
  '3sum',
  'find-all-anagrams-in-a-string',
  'find-all-numbers-disappeared-in-an-array',
  'remove-invalid-parentheses'
])

export function isDesign(problem) {
  return Boolean(problem.metaData?.systemdesign) || DESIGN_SLUGS.has(problem.slug)
}

export function javaFileName(code) {
  const withoutComments = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
  const match = /(?:public\s+)?class\s+(\w+)/.exec(withoutComments)
  return match ? `${match[1]}.java` : 'Solution.java'
}

export function defaultSnippet(problem) {
  const meta = problem.metaData || {}
  const params = (meta.params || [])
    .map((param) => `${javaType(param.type)} ${param.name}`)
    .join(', ')
  return `class Solution {\n    public ${javaType(meta.return?.type ?? 'void')} ${meta.name}(${params}) {\n        \n    }\n}`
}

function returnTypeFor(problem) {
  const meta = problem.metaData || {}
  if (isDesign(problem)) return 'design'
  if (problem.slug === 'lowest-common-ancestor-of-a-binary-tree') return 'integer'
  if (problem.slug === 'linked-list-cycle-ii') return 'integer'
  if (problem.slug === 'serialize-and-deserialize-binary-tree') return 'TreeNode'
  if (meta.return?.type === 'void') {
    const index = meta.output?.paramindex ?? 0
    return meta.params?.[index]?.type ?? 'void'
  }
  return meta.return?.type ?? 'void'
}

function castArg(type, expr) {
  return {
    integer: '(Integer)',
    string: '(String)',
    boolean: '(Boolean)',
    double: '(Double)'
  }[type] ?? `(${javaType(type)})`
}

function designCaseBody(problem) {
  const meta = problem.metaData || {}
  const className = meta.classname || 'Design'
  const constructorParams = meta.constructor?.params || []
  const constructorArgs = constructorParams
    .map((param, index) => `${castArg(param.type, 'args[0]')} args[0][${index}]`)
    .join(', ')
  const methodCases = (meta.methods || [])
    .map((method) => {
      const argCalls = (method.params || [])
        .map((param, index) => `${castArg(param.type, 'args[i]')} args[i][${index}]`)
        .join(', ')
      const call = `obj.${method.name}(${argCalls})`
      if (method.return?.type === 'void') {
        return `                case "${method.name}": ${call}; out.add(null); break;`
      }
      return `                case "${method.name}": out.add(${call}); break;`
    })
    .join('\n')
  return `        case 0: {
            String[] ops = (String[]) c.args[0];
            Object[][] args = (Object[][]) c.args[1];
            List<Object> out = new ArrayList<>();
            ${className} obj = new ${className}(${constructorArgs});
            out.add(null);
            for (int i = 1; i < ops.length; i++) {
                switch (ops[i]) {
${methodCases}
                    default: throw new IllegalArgumentException("unknown operation: " + ops[i]);
                }
            }
            return out;
        }`
}

function ordinaryCaseBody(problem) {
  const meta = problem.metaData || {}
  const slug = problem.slug
  const paramTypes = (meta.params || []).map((param) => param.type)
  const name = meta.name

  if (slug === 'linked-list-cycle' || slug === 'linked-list-cycle-ii') {
    return `        {
            ListNode head = mkList((int[]) c.args[0]);
            int pos = (Integer) c.args[1];
            makeCycle(head, pos);
            ${
              slug === 'linked-list-cycle-ii'
                ? 'ListNode node = solution.detectCycle(head); return node == null ? null : node.val;'
                : 'return solution.hasCycle(head);'
            }
        }`
  }
  if (slug === 'intersection-of-two-linked-lists') {
    return `        {
            int intersectVal = (Integer) c.args[0];
            int[] listA = (int[]) c.args[1];
            int[] listB = (int[]) c.args[2];
            int skipA = (Integer) c.args[3];
            int skipB = (Integer) c.args[4];
            ListNode[] pair = buildIntersection(intersectVal, listA, listB, skipA, skipB);
            return solution.getIntersectionNode(pair[0], pair[1]);
        }`
  }
  if (slug === 'lowest-common-ancestor-of-a-binary-tree') {
    return `        {
            TreeNode root = (TreeNode) c.args[0];
            int pVal = (Integer) c.args[1];
            int qVal = (Integer) c.args[2];
            TreeNode p = findNode(root, pVal);
            TreeNode q = findNode(root, qVal);
            TreeNode node = solution.lowestCommonAncestor(root, p, q);
            return node == null ? null : node.val;
        }`
  }
  if (slug === 'serialize-and-deserialize-binary-tree') {
    return `        {
            TreeNode root = (TreeNode) c.args[0];
            Codec ser = new Codec();
            Codec deser = new Codec();
            return deser.deserialize(ser.serialize(root));
        }`
  }

  const vars = paramTypes
    .map((type, index) => localVar(type, `v${index}`, `c.args[${index}]`))
    .join('\n            ')
  const callArgs = paramTypes.map((_, index) => `v${index}`).join(', ')
  const isVoid = meta.return?.type === 'void'
  return `        {
            ${vars}
            ${isVoid ? `solution.${name}(${callArgs});\n            return v${meta.output?.paramindex ?? 0};` : `return solution.${name}(${callArgs});`}
        }`
}

function runCaseSource(problem) {
  if (isDesign(problem)) {
    return `static Object runCase(Case c) throws Exception {
        return runDesign(c);
    }`
  }
  const body = ordinaryCaseBody(problem)
  return `static Object runCase(Case c) throws Exception {
${body}
    }`
}

function designRunSource(problem) {
  return `static Object runDesign(Case c) throws Exception {
        switch (c.id) {
${designCaseBody(problem)}
        }
        throw new IllegalArgumentException("unknown case id");
    }`
}

function caseArgs(problem, testCase) {
  if (isDesign(problem)) {
    const ops = JSON.parse(testCase.input[0])
    const argRows = JSON.parse(testCase.input[1])
    const meta = problem.metaData || {}
    const constructorParams = meta.constructor?.params || []
    const methodByName = new Map((meta.methods || []).map((method) => [method.name, method]))
    const opsLiteral = `new String[]{${ops.map(JSON.stringify).join(',')}}`
    const argsLiteral = `new Object[][]{${argRows
      .map((row, index) => {
        if (row.length === 0) return 'new Object[0]'
        const params = index === 0 ? constructorParams : methodByName.get(ops[index])?.params || []
        const literals = row.map((value, argIndex) =>
          javaLiteral(JSON.stringify(value), params[argIndex]?.type)
        )
        return `new Object[]{${literals.join(',')}}`
      })
      .join(',')}}`
    return `${opsLiteral}, ${argsLiteral}`
  }
  if (problem.slug === 'linked-list-cycle' || problem.slug === 'linked-list-cycle-ii') {
    return `new int[]{${JSON.parse(testCase.input[0]).join(',')}}, ${JSON.parse(testCase.input[1])}`
  }
  if (problem.slug === 'intersection-of-two-linked-lists') {
    const values = testCase.input.map((line) => JSON.parse(line))
    const [intersectVal, listA, listB, skipA, skipB] = values
    return [
      String(intersectVal),
      `new int[]{${listA.join(',')}}`,
      `new int[]{${listB.join(',')}}`,
      String(skipA),
      String(skipB)
    ].join(', ')
  }
  const paramTypes = (problem.metaData?.params || []).map((param) => param.type)
  return testCase.input.map((line, index) => javaLiteral(line, paramTypes[index])).join(', ')
}

function buildCaseLiterals(problem) {
  const returnType = returnTypeFor(problem)
  const unordered = UNORDERED_SLUGS.has(problem.slug)
  return (problem.tests || [])
    .map((testCase, index) => {
      const expected = canonicalExpected(testCase.expected, returnType, unordered)
      return `            new Case(${index}, new Object[]{${caseArgs(problem, testCase)}}, ${JSON.stringify(expected)}, ${JSON.stringify(returnType)}, ${unordered})`
    })
    .join(',\n')
}

const TYPES_SOURCE = `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
`

const HELPERS_SOURCE = `    static ListNode mkList(int[] vals) {
        if (vals == null || vals.length == 0) return null;
        ListNode head = new ListNode(vals[0]);
        ListNode cur = head;
        for (int i = 1; i < vals.length; i++) {
            cur.next = new ListNode(vals[i]);
            cur = cur.next;
        }
        return head;
    }

    static void makeCycle(ListNode head, int pos) {
        if (head == null || pos < 0) return;
        ListNode tail = head;
        int len = 1;
        while (tail.next != null) {
            tail = tail.next;
            len++;
        }
        if (pos >= len) return;
        ListNode at = head;
        for (int i = 0; i < pos; i++) at = at.next;
        tail.next = at;
    }

    static TreeNode mkTree(Integer[] vals) {
        if (vals == null || vals.length == 0) return null;
        TreeNode root = new TreeNode(vals[0]);
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < vals.length) {
            TreeNode cur = queue.poll();
            if (i < vals.length) {
                Integer left = vals[i++];
                if (left != null) {
                    cur.left = new TreeNode(left);
                    queue.add(cur.left);
                }
            }
            if (i < vals.length) {
                Integer right = vals[i++];
                if (right != null) {
                    cur.right = new TreeNode(right);
                    queue.add(cur.right);
                }
            }
        }
        return root;
    }

    static TreeNode findNode(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode left = findNode(root.left, val);
        return left != null ? left : findNode(root.right, val);
    }

    static ListNode appendTail(ListNode head, ListNode tail) {
        if (head == null) return tail;
        ListNode cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = tail;
        return head;
    }

    static ListNode[] buildIntersection(int intersectVal, int[] a, int[] b, int skipA, int skipB) {
        if (intersectVal == 0) return new ListNode[] { mkList(a), mkList(b) };
        ListNode suffix = mkList(java.util.Arrays.copyOfRange(a, skipA, a.length));
        ListNode headA = appendTail(mkList(java.util.Arrays.copyOfRange(a, 0, skipA)), suffix);
        ListNode headB = appendTail(mkList(java.util.Arrays.copyOfRange(b, 0, skipB)), suffix);
        return new ListNode[] { headA, headB };
    }

    static String listText(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        ListNode cur = head;
        boolean first = true;
        while (cur != null) {
            if (!first) sb.append(',');
            sb.append(cur.val);
            first = false;
            cur = cur.next;
        }
        return sb.append(']').toString();
    }

    static String treeText(TreeNode root) {
        if (root == null) return "[]";
        List<String> out = new ArrayList<>();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode cur = queue.poll();
            if (cur == null) {
                out.add("null");
                continue;
            }
            out.add(String.valueOf(cur.val));
            queue.add(cur.left);
            queue.add(cur.right);
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(",", out.subList(0, end)) + "]";
    }

    static String objText(Object v) {
        if (v == null) return "null";
        if (v instanceof String) return "\\"" + v + "\\"";
        if (v instanceof Boolean) return v.toString();
        if (v instanceof Double || v instanceof Float) {
            return String.format(Locale.ROOT, "%.5f", ((Number) v).doubleValue());
        }
        if (v instanceof Number) return v.toString();
        if (v instanceof int[]) {
            int[] arr = (int[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(arr[i]);
            }
            return sb.append(']').toString();
        }
        if (v instanceof Integer[]) {
            Integer[] arr = (Integer[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(arr[i] == null ? "null" : String.valueOf(arr[i]));
            }
            return sb.append(']').toString();
        }
        if (v instanceof int[][]) {
            int[][] arr = (int[][]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(objText(arr[i]));
            }
            return sb.append(']').toString();
        }
        if (v instanceof char[]) {
            char[] arr = (char[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append('"').append(arr[i]).append('"');
            }
            return sb.append(']').toString();
        }
        if (v instanceof char[][]) {
            char[][] arr = (char[][]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(objText(arr[i]));
            }
            return sb.append(']').toString();
        }
        if (v instanceof double[]) {
            double[] arr = (double[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(String.format(Locale.ROOT, "%.5f", arr[i]));
            }
            return sb.append(']').toString();
        }
        if (v instanceof String[]) {
            String[] arr = (String[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append('"').append(arr[i]).append('"');
            }
            return sb.append(']').toString();
        }
        if (v instanceof Object[]) {
            Object[] arr = (Object[]) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(objText(arr[i]));
            }
            return sb.append(']').toString();
        }
        if (v instanceof List) {
            List<?> list = (List<?>) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(objText(list.get(i)));
            }
            return sb.append(']').toString();
        }
        if (v instanceof ListNode) return listText((ListNode) v);
        if (v instanceof TreeNode) return treeText((TreeNode) v);
        return String.valueOf(v);
    }

    static List<String> childTexts(Object v) {
        List<String> items = new ArrayList<>();
        if (v instanceof List) {
            for (Object e : (List<?>) v) items.add(unorderedText(e));
        } else if (v instanceof int[]) {
            for (int x : (int[]) v) items.add(String.valueOf(x));
        } else if (v instanceof int[][]) {
            for (int[] row : (int[][]) v) items.add(sortedText(row));
        } else if (v instanceof double[]) {
            for (double d : (double[]) v) items.add(String.format(Locale.ROOT, "%.5f", d));
        } else if (v instanceof String[]) {
            for (String s : (String[]) v) items.add("\\"" + s + "\\"");
        } else if (v instanceof char[]) {
            for (char ch : (char[]) v) items.add("\\"" + ch + "\\"");
        } else if (v instanceof Object[]) {
            for (Object e : (Object[]) v) items.add(unorderedText(e));
        }
        return items;
    }

    static String sortedText(Object v) {
        List<String> items = childTexts(v);
        Collections.sort(items);
        return "[" + String.join(",", items) + "]";
    }

    static String unorderedText(Object e) {
        if (e == null) return "null";
        if (e instanceof List || e.getClass().isArray()) return sortedText(e);
        if (e instanceof Double || e instanceof Float) {
            return String.format(Locale.ROOT, "%.5f", ((Number) e).doubleValue());
        }
        return objText(e);
    }

    static String textOf(Object v, String type, boolean unordered) {
        if (type.equals("ListNode")) return listText((ListNode) v);
        if (type.equals("TreeNode")) return treeText((TreeNode) v);
        if (type.equals("double")) {
            if (v == null) return "null";
            return String.format(Locale.ROOT, "%.5f", ((Number) v).doubleValue());
        }
        if (unordered && (type.endsWith("[]") || type.endsWith("[][]") || type.startsWith("list"))) {
            return sortedText(v);
        }
        return objText(v);
    }
`

export function buildMainSource(problem) {
  const hasSolution = !isDesign(problem) && problem.slug !== 'serialize-and-deserialize-binary-tree'
  const solutionField = hasSolution ? '\n    static Solution solution = new Solution();\n' : ''
  const designMethod = isDesign(problem) ? `\n${designRunSource(problem)}\n` : ''
  return `import java.lang.reflect.*;
import java.util.*;

public class Main {
    static class Case {
        final int id;
        final Object[] args;
        final String expected;
        final String returnType;
        final boolean unordered;
        Case(int id, Object[] args, String expected, String returnType, boolean unordered) {
            this.id = id;
            this.args = args;
            this.expected = expected;
            this.returnType = returnType;
            this.unordered = unordered;
        }
    }
${solutionField}
    public static void main(String[] args) throws Exception {
        Case[] cases = new Case[] {
${buildCaseLiterals(problem)}
        };
        int pass = 0;
        for (Case c : cases) {
            long start = System.nanoTime();
            try {
                Object actual = runCase(c);
                String actualText = textOf(actual, c.returnType, c.unordered);
                boolean ok = actualText.equals(c.expected);
                double ms = (System.nanoTime() - start) / 1_000_000.0;
                System.out.println((ok ? "PASS" : "FAIL") + " CASE " + c.id
                    + " [" + String.format(Locale.ROOT, "%.1f", ms) + "ms] expected=" + c.expected
                    + " actual=" + actualText);
                if (ok) pass++;
            } catch (Throwable t) {
                System.out.println("ERROR CASE " + c.id + " " + t);
                t.printStackTrace(System.out);
            }
        }
        System.out.println("RESULT " + pass + "/" + cases.length);
        if (pass != cases.length) System.exit(1);
    }

${runCaseSource(problem)}
${designMethod}
${HELPERS_SOURCE}
}
`
}

export function buildJavaProject(problem, code) {
  const source = code || problem.codeSnippet || defaultSnippet(problem)
  const withImports = /^\s*package\s/.test(source)
    ? source
    : `import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n${source}`
  return {
    files: {
      'Types.java': TYPES_SOURCE,
      [javaFileName(source)]: withImports,
      'Main.java': buildMainSource(problem)
    }
  }
}
