use serde_json::Value;

pub fn java_type(leet: &str) -> &'static str {
    match leet {
        "integer" => "int",
        "integer[]" => "int[]",
        "integer[][]" => "int[][]",
        "string" => "String",
        "string[]" => "String[]",
        "boolean" => "boolean",
        "double" => "double",
        "double[]" => "double[]",
        "character[]" => "char[]",
        "character[][]" => "char[][]",
        "ListNode" => "ListNode",
        "ListNode[]" => "ListNode[]",
        "TreeNode" => "TreeNode",
        "list<integer>" => "List<Integer>",
        "list<string>" => "List<String>",
        "list<list<integer>>" => "List<List<Integer>>",
        "list<list<string>>" => "List<List<String>>",
        _ => "Object",
    }
}

fn char_literal(c: char) -> String {
    match c {
        '\\' => "'\\\\'".to_string(),
        '\'' => "'\\''".to_string(),
        '\n' => "'\\n'".to_string(),
        '\r' => "'\\r'".to_string(),
        '\t' => "'\\t'".to_string(),
        _ => format!("'{}'", c),
    }
}

pub fn java_literal(raw: &str, ty: &str) -> String {
    let value: Value = serde_json::from_str(raw).unwrap_or(Value::Null);
    match ty {
        "integer" | "double" | "boolean" => value.to_string(),
        "string" => format!("\"{}\"", value.as_str().unwrap_or("")),
        "integer[]" => {
            let arr = value.as_array().unwrap();
            format!("new int[]{{{}}}", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","))
        }
        "integer[][]" => {
            let arr = value.as_array().unwrap();
            let rows: Vec<String> = arr.iter().map(|row| {
                let r = row.as_array().unwrap();
                format!("{{{}}}", r.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","))
            }).collect();
            format!("new int[][]{{{}}}", rows.join(","))
        }
        "double[]" => {
            let arr = value.as_array().unwrap();
            format!("new double[]{{{}}}", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","))
        }
        "string[]" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|v| format!("\"{}\"", v.as_str().unwrap_or(""))).collect();
            format!("new String[]{{{}}}", parts.join(","))
        }
        "character[]" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|v| {
                char_literal(v.as_str().unwrap_or("").chars().next().unwrap_or(' '))
            }).collect();
            format!("new char[]{{{}}}", parts.join(","))
        }
        "character[][]" => {
            let arr = value.as_array().unwrap();
            let rows: Vec<String> = arr.iter().map(|row| {
                let r = row.as_array().unwrap();
                let parts: Vec<String> = r.iter().map(|v| char_literal(v.as_str().unwrap_or("").chars().next().unwrap_or(' '))).collect();
                format!("{{{}}}", parts.join(","))
            }).collect();
            format!("new char[][]{{{}}}", rows.join(","))
        }
        "ListNode" => {
            let arr = value.as_array().unwrap();
            if arr.is_empty() { "null".to_string() }
            else { format!("mkList(new int[]{{{}}})", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(",")) }
        }
        "ListNode[]" => {
            let arr = value.as_array().unwrap();
            if arr.is_empty() { "new ListNode[0]".to_string() }
            else {
                let parts: Vec<String> = arr.iter().map(|v| {
                    let a = v.as_array().unwrap();
                    if a.is_empty() { "null".to_string() }
                    else { format!("mkList(new int[]{{{}}})", a.iter().map(|x| x.to_string()).collect::<Vec<_>>().join(",")) }
                }).collect();
                format!("new ListNode[]{{{}}}", parts.join(","))
            }
        }
        "TreeNode" => {
            let arr = value.as_array().unwrap();
            if arr.is_empty() { "null".to_string() }
            else {
                let parts: Vec<String> = arr.iter().map(|v| {
                    if v.is_null() { "null".to_string() } else { v.to_string() }
                }).collect();
                format!("mkTree(new Integer[]{{{}}})", parts.join(","))
            }
        }
        "list<integer>" => {
            let arr = value.as_array().unwrap();
            format!("Arrays.asList({})", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","))
        }
        "list<string>" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|v| format!("\"{}\"", v.as_str().unwrap_or(""))).collect();
            format!("Arrays.asList({})", parts.join(","))
        }
        "list<list<integer>>" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|row| {
                let r = row.as_array().unwrap();
                format!("Arrays.asList({})", r.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","))
            }).collect();
            format!("Arrays.asList({})", parts.join(","))
        }
        "list<list<string>>" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|row| {
                let r = row.as_array().unwrap();
                let inner: Vec<String> = r.iter().map(|v| format!("\"{}\"", v.as_str().unwrap_or(""))).collect();
                format!("Arrays.asList({})", inner.join(","))
            }).collect();
            format!("Arrays.asList({})", parts.join(","))
        }
        _ => value.to_string(),
    }
}

pub fn cast_arg(ty: &str) -> &str {
    match ty {
        "integer" => "(Integer)",
        "string" => "(String)",
        "boolean" => "(Boolean)",
        "double" => "(Double)",
        _ => java_type(ty),
    }
}

pub fn local_var(ty: &str, name: &str, expr: &str) -> String {
    match ty {
        "integer" => format!("int {} = (Integer) {};", name, expr),
        "double" => format!("double {} = (Double) {};", name, expr),
        "boolean" => format!("boolean {} = (Boolean) {};", name, expr),
        "integer[]" => format!("int[] {} = (int[]) {};", name, expr),
        "integer[][]" => format!("int[][] {} = (int[][]) {};", name, expr),
        "string" => format!("String {} = (String) {};", name, expr),
        "string[]" => format!("String[] {} = (String[]) {};", name, expr),
        "double[]" => format!("double[] {} = (double[]) {};", name, expr),
        "character[]" => format!("char[] {} = (char[]) {};", name, expr),
        "character[][]" => format!("char[][] {} = (char[][]) {};", name, expr),
        "ListNode" => format!("ListNode {} = (ListNode) {};", name, expr),
        "ListNode[]" => format!("ListNode[] {} = (ListNode[]) {};", name, expr),
        "TreeNode" => format!("TreeNode {} = (TreeNode) {};", name, expr),
        _ => format!("{} {} = ({}) {};", java_type(ty), name, java_type(ty), expr),
    }
}

fn to_fixed5(value: f64) -> String {
    format!("{:.5}", value)
}

fn element_type(ty: &str) -> &str {
    if ty.starts_with("list<list<") {
        return "list<inner>";
    } else if ty.starts_with("list<") {
        return &ty["list<".len()..ty.len()-1];
    } else if ty.ends_with("[][]") {
        return &ty[..ty.len()-2];
    } else if ty.ends_with("[]") {
        return &ty[..ty.len()-2];
    }
    "integer"
}

fn render_value(value: &Value, ty: &str, unordered: bool) -> String {
    match ty {
        "ListNode" => {
            let arr = value.as_array().unwrap();
            if arr.is_empty() { "[]".to_string() }
            else { format!("[{}]", arr.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(",")) }
        }
        "TreeNode" => {
            let arr = value.as_array().unwrap();
            if arr.is_empty() { "[]".to_string() }
            else {
                let mut rendered: Vec<String> = arr.iter().map(|v| {
                    if v.is_null() { "null".to_string() } else { v.to_string() }
                }).collect();
                while rendered.last().map(|s| s.as_str()) == Some("null") { rendered.pop(); }
                format!("[{}]", rendered.join(","))
            }
        }
        "double" => to_fixed5(value.as_f64().unwrap_or(0.0)),
        "double[]" => {
            let arr = value.as_array().unwrap();
            format!("[{}]", arr.iter().map(|v| to_fixed5(v.as_f64().unwrap_or(0.0))).collect::<Vec<_>>().join(","))
        }
        "string" => format!("\"{}\"", value.as_str().unwrap_or("")),
        "boolean" | "integer" => value.to_string(),
        "design" => {
            let arr = value.as_array().unwrap();
            let parts: Vec<String> = arr.iter().map(|v| {
                if v.is_null() { "null".to_string() }
                else if v.is_string() { format!("\"{}\"", v.as_str().unwrap_or("")) }
                else { v.to_string() }
            }).collect();
            format!("[{}]", parts.join(","))
        }
        _ => {
            let is_array_like = ty.starts_with("list") || ty.ends_with("[]") || ty.ends_with("[][]") || value.is_array();
            if is_array_like && value.is_array() {
                let arr = value.as_array().unwrap();
                let et = element_type(ty);
                let mut rendered: Vec<String> = arr.iter().map(|v| render_value(v, et, unordered)).collect();
                if unordered { rendered.sort(); }
                format!("[{}]", rendered.join(","))
            } else {
                value.to_string()
            }
        }
    }
}

pub fn canonical_expected(raw: &str, ty: &str, unordered: bool) -> String {
    let value: Value = serde_json::from_str(raw).unwrap_or(Value::Null);
    render_value(&value, ty, unordered)
}
