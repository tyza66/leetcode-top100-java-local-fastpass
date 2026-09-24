import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/lib/markdown.mjs'

describe('renderMarkdown', () => {
  it('renders paragraphs, bold and inline code', () => {
    const html = renderMarkdown('用 **双指针** 处理，复杂度 O(n)。\n\n再看 `int[]` 的定义。')
    expect(html).toContain('<p>用 <strong>双指针</strong> 处理，复杂度 O(n)。</p>')
    expect(html).toContain('<code>int[]</code>')
  })

  it('renders fenced code blocks without touching inner markup', () => {
    const html = renderMarkdown('```java\npublic <T> T max(T a) { return a; }\n```')
    expect(html).toContain('<pre class="ai-code">public &lt;T&gt; T max(T a) { return a; }</pre>')
  })

  it('renders bullet and ordered lists', () => {
    const html = renderMarkdown('- 第一点\n- 第二点\n\n1. 步骤一\n2. 步骤二')
    expect(html).toContain('<ul><li>第一点</li><li>第二点</li></ul>')
    expect(html).toContain('<ol><li>步骤一</li><li>步骤二</li></ol>')
  })

  it('escapes raw html from the model output', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
