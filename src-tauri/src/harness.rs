use crate::types;
use serde_json::Value;
use std::collections::HashMap;

const DESIGN_SLUGS: &[&str] = &["lru-cache", "min-stack", "implement-trie-prefix-tree"];
const UNORDERED_SLUGS: &[&str] = &[
    "two-sum", "top-k-frequent-elements", "group-anagrams", "subsets",
    "permutations", "combination-sum", "3sum", "find-all-anagrams-in-a-string",
    "find-all-numbers-disappeared-in-array", "remove-invalid-parentheses",
];

fn opt_array(val: &Value) -> Vec<Value> {
    val.as_array().cloned().unwrap_or_default()
}

pub fn is_design(problem: &Value) -> bool {
    if problem["metaData"]["systemdesign"].as_bool().unwrap_or(false) {
        return true;
    }
    let slug = problem["slug"].as_str().unwrap_or("");
    DESIGN_SLUGS.contains(&slug)
}

pub fn java_file_name(code: &str) -> String {
    let without_comments = regex_replace_comments(code);
    let re = regex::Regex::new(r"(?:public\s+)?class\s+(\w+)").unwrap();
    match re.captures(&without_comments) {
        Some(cap) => format!("{}.java", &cap[1]),
        None => "Solution.java".to_string(),
    }
}

fn regex_replace_comments(code: &str) -> String {
    let block = regex::Regex::new(r"/\*[\s\S]*?\*/").unwrap();
    let line = regex::Regex::new(r"//[^\n]*").unwrap();
    let s = block.replace_all(code, "");
    line.replace_all(&s, "").to_string()
}

pub fn default_snippet(problem: &Value) -> String {
    let meta = &problem["metaData"];
    let params = opt_array(&meta["params"]);
    let param_strs: Vec<String> = params.iter().map(|p| {
        format!("{} {}", types::java_type(p["type"].as_str().unwrap_or("")), p["name"].as_str().unwrap_or(""))
    }).collect();
    let ret_type = types::java_type(meta["return"]["type"].as_str().unwrap_or("void"));
    let name = meta["name"].as_str().unwrap_or("");
    format!("class Solution {{\n    public {} {}({}) {{\n        \n    }}\n}}", ret_type, name, param_strs.join(", "))
}

fn return_type_for(problem: &Value) -> String {
    let meta = &problem["metaData"];
    if is_design(problem) { return "design".to_string(); }
    let slug = problem["slug"].as_str().unwrap_or("");
    match slug {
        "lowest-common-ancestor-of-a-binary-tree" => return "integer".to_string(),
        "linked-list-cycle-ii" => return "integer".to_string(),
        "serialize-and-deserialize-binary-tree" => return "TreeNode".to_string(),
        _ => {}
    }
    if meta["return"]["type"].as_str() == Some("void") {
        let idx = meta["output"]["paramindex"].as_u64().unwrap_or(0) as usize;
        let params = opt_array(&meta["params"]);
        return params.get(idx).and_then(|p| p["type"].as_str()).unwrap_or("void").to_string();
    }
    meta["return"]["type"].as_str().unwrap_or("void").to_string()
}

fn design_case_body(problem: &Value) -> String {
    let meta = &problem["metaData"];
    let class_name = meta["classname"].as_str().unwrap_or("Design");
    let constructor_params = opt_array(&meta["constructor"]["params"]);
    let _constructor_args: Vec<String> = constructor_params.iter().enumerate().map(|(i, p)| {
        format!("{} args[0][{}]", types::cast_arg(p["type"].as_str().unwrap_or("")), i)
    }).collect();
    let method_cases: Vec<String> = opt_array(&meta["methods"]).iter().map(|method| {
        let arg_calls: Vec<String> = opt_array(&method["params"]).iter().enumerate().map(|(i, p)| {
            format!("{} args[i][{}]", types::cast_arg(p["type"].as_str().unwrap_or("")), i)
        }).collect();
        let call = format!("obj.{}({})", method["name"].as_str().unwrap_or(""), arg_calls.join(", "));
        if method["return"]["type"].as_str() == Some("void") {
            format!("                case \"{}\": {}; out.add(null); break;", method["name"].as_str().unwrap_or(""), call)
        } else {
            format!("                case \"{}\": out.add({}); break;", method["name"].as_str().unwrap_or(""), call)
        }
    }).collect();

    let mut out = String::new();
    out.push_str("        case 0: {\n");
    out.push_str("            String[] ops = (String[]) c.args[0];\n");
    out.push_str("            Object[][] args = (Object[][]) c.args[1];\n");
    out.push_str("            List<Object> out = new ArrayList<>();\n");
    out.push_str(&format!("            {} obj = new {};\n", class_name, class_name));
    out.push_str(&format!("            out.add(null);\n"));
    out.push_str("            for (int i = 1; i < ops.length; i++) {\n");
    out.push_str("                switch (ops[i]) {\n");
    for mc in &method_cases {
        out.push_str(mc);
        out.push('\n');
    }
    out.push_str("                    default: throw new IllegalArgumentException(\"unknown operation: \" + ops[i]);\n");
    out.push_str("                }\n");
    out.push_str("            }\n");
    out.push_str("            return out;\n");
    out.push_str("        }");
    out
}

fn ordinary_case_body(problem: &Value) -> String {
    let meta = &problem["metaData"];
    let slug = problem["slug"].as_str().unwrap_or("");
    let params_arr = opt_array(&meta["params"]);
    let param_types: Vec<&str> = params_arr.iter()
        .map(|p| p["type"].as_str().unwrap_or("")).collect();
    let name = meta["name"].as_str().unwrap_or("");

    if slug == "linked-list-cycle" || slug == "linked-list-cycle-ii" {
        let ret = if slug == "linked-list-cycle-ii" {
            "ListNode node = solution.detectCycle(head); return node == null ? null : node.val;"
        } else {
            "return solution.hasCycle(head);"
        };
        let mut s = String::new();
        s.push_str("        {\n");
        s.push_str("            ListNode head = mkList((int[]) c.args[0]);\n");
        s.push_str("            int pos = (Integer) c.args[1];\n");
        s.push_str("            makeCycle(head, pos);\n");
        s.push_str(&format!("            {}\n", ret));
        s.push_str("        }");
        return s;
    }

    if slug == "intersection-of-two-linked-lists" {
        return "        {\n            int intersectVal = (Integer) c.args[0];\n            int[] listA = (int[]) c.args[1];\n            int[] listB = (int[]) c.args[2];\n            int skipA = (Integer) c.args[3];\n            int skipB = (Integer) c.args[4];\n            ListNode[] pair = buildIntersection(intersectVal, listA, listB, skipA, skipB);\n            return solution.getIntersectionNode(pair[0], pair[1]);\n        }".to_string();
    }

    if slug == "lowest-common-ancestor-of-a-binary-tree" {
        return "        {\n            TreeNode root = (TreeNode) c.args[0];\n            int pVal = (Integer) c.args[1];\n            int qVal = (Integer) c.args[2];\n            TreeNode p = findNode(root, pVal);\n            TreeNode q = findNode(root, qVal);\n            TreeNode node = solution.lowestCommonAncestor(root, p, q);\n            return node == null ? null : node.val;\n        }".to_string();
    }

    if slug == "serialize-and-deserialize-binary-tree" {
        return "        {\n            TreeNode root = (TreeNode) c.args[0];\n            Codec ser = new Codec();\n            Codec deser = new Codec();\n            return deser.deserialize(ser.serialize(root));\n        }".to_string();
    }

    let mut out = String::new();
    out.push_str("        {\n");
    for (i, t) in param_types.iter().enumerate() {
        let vname = format!("v{}", i);
        let arg_expr = format!("c.args[{}]", i);
        let lv = types::local_var(t, &vname, &arg_expr);
        out.push_str(&format!("            {}\n", lv));
    }
    let call_args: Vec<String> = (0..param_types.len()).map(|i| format!("v{}", i)).collect();
    let call_args_str = call_args.join(", ");
    if meta["return"]["type"].as_str() == Some("void") {
        let idx = meta["output"]["paramindex"].as_u64().unwrap_or(0) as usize;
        out.push_str(&format!("            solution.{}({});\n", name, call_args_str));
        out.push_str(&format!("            return v{};\n", idx));
    } else {
        out.push_str(&format!("            return solution.{}({});\n", name, call_args_str));
    }
    out.push_str("        }");
    out
}

fn run_case_source(problem: &Value) -> String {
    if is_design(problem) {
        return "static Object runCase(Case c) throws Exception {\n        return runDesign(c);\n    }".to_string();
    }
    let body = ordinary_case_body(problem);
    format!("static Object runCase(Case c) throws Exception {{\n{}\n    }}", body)
}

fn design_run_source(problem: &Value) -> String {
    format!("static Object runDesign(Case c) throws Exception {{\n        switch (c.id) {{\n{}\n        }}\n        throw new IllegalArgumentException(\"unknown case id\");\n    }}", design_case_body(problem))
}

fn case_args(problem: &Value, test_case: &Value) -> String {
    if is_design(problem) {
        let input = test_case["input"].as_array().unwrap();
        let ops: Vec<Value> = serde_json::from_str(input[0].as_str().unwrap_or("[]")).unwrap_or_default();
        let arg_rows: Vec<Value> = serde_json::from_str(input[1].as_str().unwrap_or("[]")).unwrap_or_default();
        let meta = &problem["metaData"];
        let constructor_params = opt_array(&meta["constructor"]["params"]);
        let methods = opt_array(&meta["methods"]);
        let mut method_map: HashMap<&str, &Value> = HashMap::new();
        for method in &methods {
            if let Some(n) = method["name"].as_str() {
                method_map.insert(n, method);
            }
        }
        let ops_literal = format!("new String[]{{{}}}", ops.iter().map(|v| format!("\"{}\"", v.as_str().unwrap_or(""))).collect::<Vec<_>>().join(","));
        let _rows_len = arg_rows.len();
        let mut row_strs: Vec<String> = Vec::new();
        for (index, row_val) in arg_rows.iter().enumerate() {
            let row = row_val.as_array().cloned().unwrap_or_default();
            if row.is_empty() { row_strs.push("new Object[0]".to_string()); continue; }
            let params = if index == 0 { constructor_params.clone() } else {
                ops.get(index).and_then(|op| method_map.get(op.as_str().unwrap_or("")))
                    .map(|m| opt_array(&m["params"]))
                    .unwrap_or_default()
            };
            let literals: Vec<String> = row.iter().enumerate().map(|(arg_index, value)| {
                let ty = params.get(arg_index).and_then(|p| p["type"].as_str()).unwrap_or("integer");
                types::java_literal(&value.to_string(), ty)
            }).collect();
            row_strs.push(format!("new Object[]{{{}}}", literals.join(",")));
        }
        let args_literal = format!("new Object[][]{{{}}}", row_strs.join(","));
        return format!("{}, {}", ops_literal, args_literal);
    }

    let slug = problem["slug"].as_str().unwrap_or("");
    if slug == "linked-list-cycle" || slug == "linked-list-cycle-ii" {
        let input = test_case["input"].as_array().unwrap();
        let arr: Vec<Value> = serde_json::from_str(input[0].as_str().unwrap_or("[]")).unwrap_or_default();
        let pos: i64 = serde_json::from_str(input[1].as_str().unwrap_or("0")).unwrap_or(0);
        return format!("new int[]{{{}}}, {}", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","), pos);
    }

    if slug == "intersection-of-two-linked-lists" {
        let input = test_case["input"].as_array().unwrap();
        let values: Vec<Value> = input.iter().map(|line| {
            serde_json::from_str(line.as_str().unwrap_or("")).unwrap_or(Value::Null)
        }).collect();
        let intersect_val = &values[0];
        let list_a: Vec<Value> = values[1].as_array().cloned().unwrap_or_default();
        let list_b: Vec<Value> = values[2].as_array().cloned().unwrap_or_default();
        let skip_a = &values[3];
        let skip_b = &values[4];
        return format!("{}, new int[]{{{}}}, new int[]{{{}}}, {}, {}",
            intersect_val,
            list_a.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","),
            list_b.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","),
            skip_a, skip_b);
    }

    let params_arr = opt_array(&problem["metaData"]["params"]);
    let param_types: Vec<&str> = params_arr.iter()
        .map(|p| p["type"].as_str().unwrap_or("")).collect();
    let input = test_case["input"].as_array().unwrap();
    input.iter().enumerate().map(|(i, line)| {
        types::java_literal(line.as_str().unwrap_or(""), param_types.get(i).copied().unwrap_or("integer"))
    }).collect::<Vec<_>>().join(", ")
}

fn build_case_literals(problem: &Value) -> String {
    let return_type = return_type_for(problem);
    let unordered = UNORDERED_SLUGS.contains(&problem["slug"].as_str().unwrap_or(""));
    let tests = opt_array(&problem["tests"]);
    tests.iter().enumerate().map(|(index, test_case)| {
        let expected = types::canonical_expected(test_case["expected"].as_str().unwrap_or(""), &return_type, unordered);
        let escaped = expected.replace('\\', "\\\\").replace('"', "\\\"");
        format!("            new Case({}, new Object[]{{{}}}, \"{}\", \"{}\", {})",
            index, case_args(problem, test_case), escaped, return_type, unordered)
    }).collect::<Vec<_>>().join(",\n")
}

const TYPES_SOURCE: &str = r#"class ListNode {
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
"#;

fn helpers_source() -> &'static str {
    r#"    static ListNode mkList(int[] vals) {
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
        while (tail.next != null) { tail = tail.next; len++; }
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
                if (left != null) { cur.left = new TreeNode(left); queue.add(cur.left); }
            }
            if (i < vals.length) {
                Integer right = vals[i++];
                if (right != null) { cur.right = new TreeNode(right); queue.add(cur.right); }
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
            if (cur == null) { out.add("null"); continue; }
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
        if (v instanceof String) return "\"" + v + "\"";
        if (v instanceof Boolean) return v.toString();
        if (v instanceof Double || v instanceof Float) return String.format(Locale.ROOT, "%.5f", ((Number) v).doubleValue());
        if (v instanceof Number) return v.toString();
        if (v instanceof int[]) {
            int[] arr = (int[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(arr[i]); }
            return sb.append(']').toString();
        }
        if (v instanceof Integer[]) {
            Integer[] arr = (Integer[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(arr[i] == null ? "null" : String.valueOf(arr[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof int[][]) {
            int[][] arr = (int[][]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(objText(arr[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof char[]) {
            char[] arr = (char[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append('"').append(arr[i]).append('"'); }
            return sb.append(']').toString();
        }
        if (v instanceof char[][]) {
            char[][] arr = (char[][]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(objText(arr[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof double[]) {
            double[] arr = (double[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(String.format(Locale.ROOT, "%.5f", arr[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof String[]) {
            String[] arr = (String[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append('"').append(arr[i]).append('"'); }
            return sb.append(']').toString();
        }
        if (v instanceof Object[]) {
            Object[] arr = (Object[]) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(','); sb.append(objText(arr[i])); }
            return sb.append(']').toString();
        }
        if (v instanceof List) {
            List<?> list = (List<?>) v; StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) { if (i > 0) sb.append(','); sb.append(objText(list.get(i))); }
            return sb.append(']').toString();
        }
        if (v instanceof ListNode) return listText((ListNode) v);
        if (v instanceof TreeNode) return treeText((TreeNode) v);
        return String.valueOf(v);
    }

    static List<String> childTexts(Object v) {
        List<String> items = new ArrayList<>();
        if (v instanceof List) { for (Object e : (List<?>) v) items.add(unorderedText(e)); }
        else if (v instanceof int[]) { for (int x : (int[]) v) items.add(String.valueOf(x)); }
        else if (v instanceof int[][]) { for (int[] row : (int[][]) v) items.add(sortedText(row)); }
        else if (v instanceof double[]) { for (double d : (double[]) v) items.add(String.format(Locale.ROOT, "%.5f", d)); }
        else if (v instanceof String[]) { for (String s : (String[]) v) items.add("\"" + s + "\""); }
        else if (v instanceof char[]) { for (char ch : (char[]) v) items.add("\"" + ch + "\""); }
        else if (v instanceof Object[]) { for (Object e : (Object[]) v) items.add(unorderedText(e)); }
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
        if (e instanceof Double || e instanceof Float) return String.format(Locale.ROOT, "%.5f", ((Number) e).doubleValue());
        return objText(e);
    }

    static String textOf(Object v, String type, boolean unordered) {
        if (type.equals("ListNode")) return listText((ListNode) v);
        if (type.equals("TreeNode")) return treeText((TreeNode) v);
        if (type.equals("double")) { if (v == null) return "null"; return String.format(Locale.ROOT, "%.5f", ((Number) v).doubleValue()); }
        if (unordered && (type.endsWith("[]") || type.endsWith("[][]") || type.startsWith("list"))) return sortedText(v);
        return objText(v);
    }
"#
}

fn build_main_source(problem: &Value) -> String {
    let has_solution = !is_design(problem) && problem["slug"].as_str() != Some("serialize-and-deserialize-binary-tree");
    let solution_field = if has_solution { "\n    static Solution solution = new Solution();\n".to_string() } else { String::new() };
    let design_method = if is_design(problem) {
        format!("\n{}\n", design_run_source(problem))
    } else {
        String::new()
    };
    let cases = build_case_literals(problem);
    let rcs = run_case_source(problem);

    let mut out = String::new();
    out.push_str("import java.lang.reflect.*;\nimport java.util.*;\n\npublic class Main {\n");
    out.push_str("    static class Case {\n");
    out.push_str("        final int id;\n        final Object[] args;\n        final String expected;\n        final String returnType;\n        final boolean unordered;\n");
    out.push_str("        Case(int id, Object[] args, String expected, String returnType, boolean unordered) {\n");
    out.push_str("            this.id = id; this.args = args; this.expected = expected; this.returnType = returnType; this.unordered = unordered;\n        }\n    }\n");
    out.push_str(&solution_field);
    out.push_str("    public static void main(String[] args) throws Exception {\n");
    out.push_str("        Case[] cases = new Case[] {\n");
    out.push_str(&cases);
    out.push_str("\n        };\n");
    out.push_str("        int pass = 0;\n");
    out.push_str("        for (Case c : cases) {\n");
    out.push_str("            long start = System.nanoTime();\n");
    out.push_str("            try {\n");
    out.push_str("                Object actual = runCase(c);\n");
    out.push_str("                String actualText = textOf(actual, c.returnType, c.unordered);\n");
    out.push_str("                boolean ok = actualText.equals(c.expected);\n");
    out.push_str("                double ms = (System.nanoTime() - start) / 1_000_000.0;\n");
    out.push_str("                System.out.println((ok ? \"PASS\" : \"FAIL\") + \" CASE \" + c.id\n");
    out.push_str("                    + \" [\" + String.format(Locale.ROOT, \"%.1f\", ms) + \"ms] expected=\" + c.expected\n");
    out.push_str("                    + \" actual=\" + actualText);\n");
    out.push_str("                if (ok) pass++;\n");
    out.push_str("            } catch (Throwable t) {\n");
    out.push_str("                System.out.println(\"ERROR CASE \" + c.id + \" \" + t);\n");
    out.push_str("                t.printStackTrace(System.out);\n");
    out.push_str("            }\n");
    out.push_str("        }\n");
    out.push_str("        System.out.println(\"RESULT \" + pass + \"/\" + cases.length);\n");
    out.push_str("        if (pass != cases.length) System.exit(1);\n    }\n\n");
    out.push_str(&rcs);
    out.push('\n');
    out.push_str(&design_method);
    out.push_str(helpers_source());
    out.push_str("\n}\n");
    out
}

pub struct JavaProject {
    pub files: HashMap<String, String>,
}

pub fn build_java_project(problem: &Value, code: &str) -> JavaProject {
    let source = if !code.is_empty() {
        code.to_string()
    } else if let Some(snippet) = problem["codeSnippet"].as_str() {
        snippet.to_string()
    } else {
        default_snippet(problem)
    };
    let needs_imports = !regex::Regex::new(r"^\s*package\s").unwrap().is_match(&source);
    let file_name = java_file_name(&source);
    let with_imports = if needs_imports {
        format!("import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n{}", source)
    } else {
        source
    };
    let mut files = HashMap::new();
    files.insert("Types.java".to_string(), TYPES_SOURCE.to_string());
    files.insert(file_name, with_imports);
    files.insert("Main.java".to_string(), build_main_source(problem));
    JavaProject { files }
}
