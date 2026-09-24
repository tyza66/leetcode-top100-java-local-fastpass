import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import 'monaco-editor/min/vs/editor/editor.main.css'

globalThis.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
}

let completionEnabled = true

export function setCompletionEnabled(enabled) {
  completionEnabled = enabled
}

const COMPLETIONS = [
  ['public', 'Keyword'],
  ['private', 'Keyword'],
  ['protected', 'Keyword'],
  ['static', 'Keyword'],
  ['final', 'Keyword'],
  ['class', 'Keyword'],
  ['interface', 'Keyword'],
  ['new', 'Keyword'],
  ['this', 'Keyword'],
  ['super', 'Keyword'],
  ['return', 'Keyword'],
  ['null', 'Keyword'],
  ['true', 'Keyword'],
  ['false', 'Keyword'],
  ['if', 'Keyword'],
  ['else', 'Keyword'],
  ['for', 'Keyword'],
  ['while', 'Keyword'],
  ['break', 'Keyword'],
  ['continue', 'Keyword'],
  ['try', 'Keyword'],
  ['catch', 'Keyword'],
  ['throw', 'Keyword'],
  ['void', 'Keyword'],
  ['int', 'Keyword'],
  ['long', 'Keyword'],
  ['double', 'Keyword'],
  ['float', 'Keyword'],
  ['boolean', 'Keyword'],
  ['char', 'Keyword'],
  ['String', 'Class'],
  ['Integer', 'Class'],
  ['List', 'Class'],
  ['ArrayList', 'Class'],
  ['LinkedList', 'Class'],
  ['Map', 'Class'],
  ['HashMap', 'Class'],
  ['LinkedHashMap', 'Class'],
  ['Set', 'Class'],
  ['HashSet', 'Class'],
  ['Queue', 'Class'],
  ['Deque', 'Class'],
  ['ArrayDeque', 'Class'],
  ['Stack', 'Class'],
  ['Arrays', 'Class'],
  ['Collections', 'Class'],
  ['Math', 'Class'],
  ['System', 'Class'],
  ['TreeNode', 'Class'],
  ['ListNode', 'Class'],
  ['Arrays.sort(', 'Function'],
  ['Arrays.asList(', 'Function'],
  ['new ArrayList<>()', 'Function'],
  ['new HashMap<>()', 'Function'],
  ['new HashSet<>()', 'Function']
]

monaco.languages.registerCompletionItemProvider('java', {
  triggerCharacters: ['.'],
  provideCompletionItems(model, position) {
    if (!completionEnabled) return { suggestions: [] }
    const word = model.getWordUntilPosition(position)
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    }
    return {
      suggestions: COMPLETIONS.map(([label, kind]) => ({
        label,
        kind: monaco.languages.CompletionItemKind[kind],
        insertText: label,
        range
      }))
    }
  }
})

export function createEditor(el) {
  return monaco.editor.create(el, {
    language: 'java',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineHeight: 20,
    tabSize: 4,
    insertSpaces: true,
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    fixedOverflowWidgets: true
  })
}

export { monaco }
