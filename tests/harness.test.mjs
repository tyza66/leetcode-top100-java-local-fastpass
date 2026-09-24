import { describe, expect, it } from 'vitest'
import { buildJavaProject, javaFileName } from '../server/lib/harness.mjs'

const twoSumProblem = {
  slug: 'two-sum',
  frontendId: '1',
  metaData: {
    name: 'twoSum',
    params: [
      { name: 'nums', type: 'integer[]' },
      { name: 'target', type: 'integer' }
    ],
    return: { type: 'integer[]' }
  },
  codeSnippet: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
  tests: [
    { input: ['[2,7,11,15]', '9'], expected: '[0,1]' },
    { input: ['[3,3]', '6'], expected: '[0,1]' }
  ]
}

describe('buildJavaProject', () => {
  it('generates Main, Types and Solution files for two-sum', () => {
    const project = buildJavaProject(twoSumProblem, twoSumProblem.codeSnippet)
    expect(Object.keys(project.files).sort()).toEqual(['Main.java', 'Solution.java', 'Types.java'])
    expect(project.files['Main.java']).toContain('class Main')
    expect(project.files['Main.java']).toContain('solution.twoSum')
    expect(project.files['Main.java']).toContain('new int[]{2,7,11,15}')
    expect(project.files['Main.java']).toContain('"[0,1]"')
    expect(project.files['Types.java']).toContain('class TreeNode')
    expect(project.files['Solution.java']).toContain('public int[] twoSum')
  })

  it('keeps public class name as the java file name', () => {
    const cycleProblem = {
      slug: 'linked-list-cycle',
      metaData: {},
      codeSnippet: 'public class Solution {\n    public boolean hasCycle(ListNode head) {\n        \n    }\n}',
      tests: []
    }
    expect(javaFileName(cycleProblem.codeSnippet)).toBe('Solution.java')

    const codecSnippet = 'public class Codec {\n    public String serialize(TreeNode root) { return null; }\n}'
    expect(javaFileName(codecSnippet)).toBe('Codec.java')
  })

  it('generates a design harness for LRU cache', () => {
    const lruProblem = {
      slug: 'lru-cache',
      metaData: {
        classname: 'LRUCache',
        systemdesign: true,
        constructor: { params: [{ name: 'capacity', type: 'integer' }] },
        methods: [
          { name: 'get', params: [{ name: 'key', type: 'integer' }], return: { type: 'integer' } },
          {
            name: 'put',
            params: [
              { name: 'key', type: 'integer' },
              { name: 'value', type: 'integer' }
            ],
            return: { type: 'void' }
          }
        ]
      },
      codeSnippet: 'class LRUCache {\n    public LRUCache(int capacity) {}\n}',
      tests: [
        {
          input: [
            '["LRUCache","put","get"]',
            '[[2],[1,1],[1]]'
          ],
          expected: '[null,null,1]'
        }
      ]
    }
    const project = buildJavaProject(lruProblem, lruProblem.codeSnippet)
    expect(Object.keys(project.files)).toContain('LRUCache.java')
    expect(project.files['Main.java']).toContain('new LRUCache')
    expect(project.files['Main.java']).toContain('case "get"')
    expect(project.files['Main.java']).toContain('"[null,null,1]"')
  })

  it('canonicalizes unordered list expected output by sorting', () => {
    const anagramProblem = {
      slug: 'group-anagrams',
      metaData: {
        name: 'groupAnagrams',
        params: [{ name: 'strs', type: 'string[]' }],
        return: { type: 'list<list<string>>' }
      },
      codeSnippet: 'class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) { return null; }\n}',
      tests: [
        {
          input: ['["eat","tea","tan","ate","nat","bat"]'],
          expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]'
        }
      ]
    }
    const project = buildJavaProject(anagramProblem, anagramProblem.codeSnippet)
    expect(project.files['Main.java']).toContain('\"[[\\\"ate')
    expect(project.files['Main.java']).not.toContain('["bat"],["nat","tan"]')
  })

  it('formats double expected output with five decimals', () => {
    const divisionProblem = {
      slug: 'evaluate-division',
      metaData: {
        name: 'calcEquation',
        params: [
          { name: 'equations', type: 'list<list<string>>' },
          { name: 'values', type: 'double[]' },
          { name: 'queries', type: 'list<list<string>>' }
        ],
        return: { type: 'double[]' }
      },
      codeSnippet: 'class Solution {\n    public double[] calcEquation(List<List<String>> a, double[] b, List<List<String>> c) { return null; }\n}',
      tests: [{ input: ['[["a","b"]]', '[0.5]', '[["a","b"]]'], expected: '[0.50000]' }]
    }
    const project = buildJavaProject(divisionProblem, divisionProblem.codeSnippet)
    expect(project.files['Main.java']).toContain('new double[]{0.5}')
    expect(project.files['Main.java']).toContain('"[0.50000]"')
  })
})
