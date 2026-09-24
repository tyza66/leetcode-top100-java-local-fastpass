const GRAPHQL = 'https://leetcode.cn/graphql/'
const HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36'
}

export async function graphql(query, variables) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
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
      categorySlug: '',
      skip,
      limit: 100,
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
      difficulty topicTags { name slug } metaData
      codeSnippets { lang code } sampleTestCase exampleTestcases content
    }
  }`
  const data = await graphql(query, { titleSlug: slug })
  return data.question
}
