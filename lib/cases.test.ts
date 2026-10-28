import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leaderSince, rivalRows } from './cases.ts'

test('a leader leads from the year after the evidence that chose it; own past from the start', () => {
  assert.equal(leaderSince({ shifts: [{ year: 2001, frm: [], to: ['a'] }, { year: 2006, frm: ['a'], to: ['b'] }], years: [{ year: 2001 }] }), 2007)
  assert.equal(leaderSince({ shifts: [], years: [{ year: 2001 }, { year: 2002 }] }), 2001)
})

test('rivals are ranked by evidence, each with a bar on a shared scale and the leader marked', () => {
  const rows = rivalRows({ leader: ['nyt'], mechanisms: [
    { features: ['nyt'], gain: 200 }, { features: ['approval'], gain: 50 }, { features: ['nyt', 'guardian'], gain: -100 },
  ] })
  assert.deepEqual(rows.map(r => [r.label, r.leader]), [['NYT coverage', true], ["critics' approval", false], ['NYT coverage + Guardian coverage', false]])
  assert.deepEqual(rows.map(r => r.bar), [1, 0.25, -0.5])
})
