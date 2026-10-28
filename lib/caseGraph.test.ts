import { test } from 'node:test'
import assert from 'node:assert/strict'
import { caseGraph } from './caseGraph.ts'

const set = (key: string, pool: string[], leader: string[], gains: Record<string, number>) => ({
  key, title: key, outcome: 'acquisitions next year', pool, leader,
  mechanisms: Object.entries(gains).map(([f, gain]) => ({ features: f.split('+'), gain })),
})

test('each set is a band of its mechanisms, each drawn to its outcome', () => {
  const g = caseGraph([set('artists', ['nyt', 'approval', 'guardian'], ['nyt'], { nyt: 193, approval: 76, guardian: -5, 'nyt+approval': 60 })], 520, 300)
  assert.equal(g.bands.length, 1)
  const [band] = g.bands
  assert.deepEqual(band.edges.map(e => e.feature), ['nyt', 'approval', 'guardian'])   // pool order; pairs not drawn
  const [nyt, approval, guardian] = band.edges
  assert.equal(nyt.tone, 'leader')
  assert.equal(approval.tone, 'helps')
  assert.equal(guardian.tone, 'fails')
  assert.ok(nyt.width > approval.width && approval.width > guardian.width)
  assert.equal(nyt.gainText, '+193')
  assert.equal(guardian.gainText, '−5')
  assert.ok(band.edges.every(e => e.y1 > band.top && e.y1 < band.bottom))
})

test('bands share the height, one per case set', () => {
  const g = caseGraph([set('a', ['x'], [], { x: 1 }), set('b', ['y'], ['y'], { y: 2 })], 520, 300)
  assert.deepEqual(g.bands.map(b => [b.top, b.bottom]), [[0, 150], [150, 300]])
  assert.equal(g.bands[0].edges[0].tone, 'helps')   // positive but not the leader
})
