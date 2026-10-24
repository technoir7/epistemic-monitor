import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hypothesisLabel, hypothesisShortLabel, isLagged, shortId, variableLabel } from './labels.ts'

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

test('hypothesisLabel leaves seed hypotheses alone', () => {
  const seed = 'T_persistence: each signal follows its own last week'
  assert.equal(hypothesisLabel(seed), seed)
  assert.equal(hypothesisLabel('T*: demand-chain'), 'T*: demand-chain')
})

test('hypothesisShortLabel drops a seed description but keeps variants whole', () => {
  assert.equal(hypothesisShortLabel('T_persistence: each signal follows its own last week'), 'T_persistence')
  assert.equal(hypothesisShortLabel('variant_remove_A_prev->B'), '− A t-1 → B')
})

test('shortId keeps the first 8 characters', () => {
  assert.equal(shortId('81fa8d07-4283-4880-a6a5-827d39bb781a'), '81fa8d07')
})
