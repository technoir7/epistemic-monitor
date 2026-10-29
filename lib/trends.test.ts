import { test } from 'node:test'
import assert from 'node:assert/strict'
import { measure, shares } from './trends.ts'

const lists = {
  year: 2026, before: 3, years: [2023, 2024, 2025, 2026], all_writers: [100, 100, 100, 200],
  lists: { new: ['7'], growing: ['7', '9'], fading: ['8'], argued: ['7'] },
  trends: {
    '7': { key: '7', name: 'art made with AI', start: 2025, words: [], writers: [0, 0, 0, 40], papers: [], verdicts: [5, 4], sample: [] },
    '8': { key: '8', name: 'NFTs', start: 2021, words: [], writers: [30, 20, 10, 6], papers: [], verdicts: [0, 1], sample: [] },
    '9': { key: '9', name: 'heists', start: 2010, words: [], writers: [10, 10, 10, 32], papers: [], verdicts: [0, 0], sample: [] },
  },
}

test("a trend's share each year is its writers over every writer", () => {
  assert.deepEqual(shares(lists, lists.trends['8']), [0.3, 0.2, 0.1, 0.03])
})

test('each list says what put a trend on it', () => {
  assert.equal(measure(lists, 'new', lists.trends['7']), '40 writers')
  assert.equal(measure(lists, 'growing', lists.trends['7']), 'new')
  assert.equal(measure(lists, 'growing', lists.trends['9']), '×1.6')
  assert.equal(measure(lists, 'fading', lists.trends['8']), '30% → 3%')
  assert.equal(measure(lists, 'argued', lists.trends['7']), '44% split')
})
