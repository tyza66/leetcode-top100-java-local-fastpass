export const JAVA_TYPES = {
  integer: 'int',
  'integer[]': 'int[]',
  'integer[][]': 'int[][]',
  string: 'String',
  'string[]': 'String[]',
  boolean: 'boolean',
  double: 'double',
  'double[]': 'double[]',
  'character[]': 'char[]',
  'character[][]': 'char[][]',
  ListNode: 'ListNode',
  'ListNode[]': 'ListNode[]',
  TreeNode: 'TreeNode',
  'list<integer>': 'List<Integer>',
  'list<string>': 'List<String>',
  'list<list<integer>>': 'List<List<Integer>>',
  'list<list<string>>': 'List<List<String>>'
}

export function javaType(leetType) {
  return JAVA_TYPES[leetType] ?? leetType
}

function charLiteral(char) {
  const escaped = char.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `'${escaped}'`
}

export function javaLiteral(raw, type) {
  const value = JSON.parse(raw)
  switch (type) {
    case 'integer':
    case 'double':
    case 'boolean':
      return String(value)
    case 'string':
      return JSON.stringify(value)
    case 'integer[]':
      return `new int[]{${value.join(',')}}`
    case 'integer[][]':
      return `new int[][]{${value.map((row) => `{${row.join(',')}}`).join(',')}}`
    case 'double[]':
      return `new double[]{${value.map((n) => String(n)).join(',')}}`
    case 'string[]':
      return `new String[]{${value.map(JSON.stringify).join(',')}}`
    case 'character[]':
      return `new char[]{${value.map(charLiteral).join(',')}}`
    case 'character[][]':
      return `new char[][]{${value.map((row) => `{${row.map(charLiteral).join(',')}}`).join(',')}}`
    case 'ListNode':
      return value.length === 0 ? 'null' : `mkList(new int[]{${value.join(',')}})`
    case 'ListNode[]':
      if (value.length === 0) return 'new ListNode[0]'
      return `new ListNode[]{${value.map((v) => (v.length === 0 ? 'null' : `mkList(new int[]{${v.join(',')}})`)).join(',')}}`
    case 'TreeNode':
      return value.length === 0
        ? 'null'
        : `mkTree(new Integer[]{${value.map((v) => (v === null ? 'null' : String(v))).join(',')}})`
    case 'list<integer>':
      return `Arrays.asList(${value.map(String).join(',')})`
    case 'list<string>':
      return `Arrays.asList(${value.map(JSON.stringify).join(',')})`
    case 'list<list<integer>>':
      return `Arrays.asList(${value.map((row) => `Arrays.asList(${row.map(String).join(',')})`).join(',')})`
    case 'list<list<string>>':
      return `Arrays.asList(${value.map((row) => `Arrays.asList(${row.map(JSON.stringify).join(',')})`).join(',')})`
    default:
      throw new Error(`unsupported parameter type: ${type}`)
  }
}

export function localVar(type, name, expr) {
  const java = javaType(type)
  const cast = {
    integer: '(Integer)',
    double: '(Double)',
    boolean: '(Boolean)',
    'integer[]': '(int[])',
    'integer[][]': '(int[][])',
    string: '(String)',
    'string[]': '(String[])',
    'double[]': '(double[])',
    'character[]': '(char[])',
    'character[][]': '(char[][])',
    ListNode: '(ListNode)',
    'ListNode[]': '(ListNode[])',
    TreeNode: '(TreeNode)'
  }[type]
  if (!cast) return `${java} ${name} = (${java}) ${expr};`
  return `${java} ${name} = ${cast} ${expr};`
}

function toFixed5(value) {
  return Number(value).toFixed(5)
}

function elementType(type) {
  if (type.startsWith('list<list<')) {
    const inner = type.slice('list<list<'.length, -2)
    return `list<${inner}>`
  }
  if (type.startsWith('list<')) return type.slice('list<'.length, -1)
  if (type.endsWith('[][]')) return type.slice(0, -2)
  if (type.endsWith('[]')) return type.slice(0, -2)
  return 'integer'
}

function renderValue(value, type, unordered) {
  if (type === 'ListNode') {
    if (!Array.isArray(value) || value.length === 0) return '[]'
    return `[${value.join(',')}]`
  }
  if (type === 'TreeNode') {
    if (!Array.isArray(value) || value.length === 0) return '[]'
    const rendered = value.map((v) => (v === null ? 'null' : String(v)))
    while (rendered.length > 0 && rendered[rendered.length - 1] === 'null') rendered.pop()
    return `[${rendered.join(',')}]`
  }
  if (type === 'double') return toFixed5(value)
  if (type === 'double[]') return `[${value.map(toFixed5).join(',')}]`
  if (type === 'string') return JSON.stringify(value)
  if (type === 'boolean' || type === 'integer') return String(value)
  if (type === 'design') {
    return `[${value
      .map((item) => {
        if (item === null) return 'null'
        if (typeof item === 'string') return JSON.stringify(item)
        return String(item)
      })
      .join(',')}]`
  }
  const arrayLike =
    type.startsWith('list') || type.endsWith('[]') || type.endsWith('[][]') || Array.isArray(value)
  if (arrayLike && Array.isArray(value)) {
    const rendered = value.map((item) => renderValue(item, elementType(type), unordered))
    if (unordered) rendered.sort()
    return `[${rendered.join(',')}]`
  }
  return String(value)
}

export function canonicalExpected(raw, type, unordered = false) {
  return renderValue(JSON.parse(raw), type, unordered)
}
