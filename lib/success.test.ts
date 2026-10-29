import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adds, pushes, rewardedBy } from './success.ts'
import type { Rewarded } from './types'

test("the leader's features are listed by how hard they push, each with its direction", () => {
  const rows = pushes({ effects: { 'nyt=2': 1.4, 'nyt=1': 0.6, 'painting=1': -0.9, 'sculpture=1': 0.05 } }, 3)
  assert.deepEqual(rows.map(r => [r.label, r.push]), [['NYT coverage, several', 1.4], ['painting (Guardian), one', -0.9], ['NYT coverage, one', 0.6]])
})

test('what critics rewarded is split by kind and ranked by the share of verdicts in favour', () => {
  const r: Rewarded[] = [
    { kind: 'medium', name: 'video', approvals: 6, disapprovals: 4, approved: [], disapproved: [] },
    { kind: 'medium', name: 'photography', approvals: 9, disapprovals: 1, approved: [], disapproved: [] },
    { kind: 'trend', name: 'heists', approvals: 1, disapprovals: 9, approved: [], disapproved: [] },
  ]
  assert.deepEqual(rewardedBy(r, 'medium').map(x => [x.name, x.share]), [['photography', 0.9], ['video', 0.6]])
  assert.deepEqual(rewardedBy(r, 'trend').map(x => x.name), ['heists'])
})

test("what each leading feature adds is the gain lost when it is dealt at random, averaged over the deals, biggest first", () => {
  const rows = adds({ gain: 100, dealt: { nyt: [40, 50, 60], painting: [101, 99, 100] } })
  assert.deepEqual(rows.map(r => [r.label, r.adds]), [['NYT coverage', 50], ['painting (Guardian)', 0]])
})
