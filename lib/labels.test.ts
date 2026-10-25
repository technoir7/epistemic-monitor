import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hypothesisLabel, hypothesisShortLabel, isLagged, levelBadge, shortId, variableLabel } from './labels.ts'

test('variableLabel shows last week as t-1', () => {
  assert.equal(variableLabel('CreditSpreadStress_prev'), 'CreditSpreadStress t-1')
  assert.equal(variableLabel('LiquidityStress'), 'LiquidityStress')
  assert.equal(isLagged('AIRiskOn_prev'), true)
  assert.equal(isLagged('AIRiskOn'), false)
})

test('hypothesisLabel turns variant names into the edge they change', () => {
  assert.equal(
    hypothesisLabel('variant_add_CreditSpreadStress_prev->LiquidityStress'),
    '+ CreditSpreadStress t-1 → LiquidityStress',
  )
  assert.equal(hypothesisLabel('variant_remove_A->B'), '− A → B')
})

test('hypothesisLabel turns evidence-prompted changes into the edge they change', () => {
  assert.equal(hypothesisLabel('prompted_add_InflationShock_prev->InflationShock'), '+ InflationShock t-1 → InflationShock')
  assert.equal(hypothesisLabel('prompted_reverse_A->C'), '⇄ A → C')
})

test('hypothesisLabel leaves the starting structure alone', () => {
  const start = 'unconnected: no hypotheses yet'
  assert.equal(hypothesisLabel(start), start)
})

test('hypothesisShortLabel drops a description but keeps changes whole', () => {
  assert.equal(hypothesisShortLabel('unconnected: no hypotheses yet'), 'unconnected')
  assert.equal(hypothesisShortLabel('variant_remove_A_prev->B'), '− A t-1 → B')
  assert.equal(hypothesisShortLabel('prompted_add_A->B'), '+ A → B')
})

test('shortId keeps the first 8 characters', () => {
  assert.equal(shortId('81fa8d07-4283-4880-a6a5-827d39bb781a'), '81fa8d07')
})

test('levelBadge names a graded signal by its most likely level', () => {
  assert.deepEqual(levelBadge('high'), { text: 'HIGH', tone: 'high' })
  assert.deepEqual(levelBadge('mid'), { text: 'MID', tone: 'mid' })
  assert.deepEqual(levelBadge('low'), { text: 'LOW', tone: 'low' })
  assert.throws(() => levelBadge('True'))
})
