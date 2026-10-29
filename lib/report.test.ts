import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reportBlocks } from './report.ts'

test('a heading is its own line, even with its paragraph right under it', () => {
  assert.deepEqual(reportBlocks('## In short\nThe dollar is strong.\nNothing links yet.\n\n## What the evidence shows\nStress is low.'), [
    { kind: 'heading', text: 'In short' },
    { kind: 'para', text: 'The dollar is strong.\nNothing links yet.' },
    { kind: 'heading', text: 'What the evidence shows' },
    { kind: 'para', text: 'Stress is low.' },
  ])
})

test('paragraphs split on blank lines and a heading alone stays a heading', () => {
  assert.deepEqual(reportBlocks('# Title\n\nOne.\n\n\nTwo.'), [
    { kind: 'heading', text: 'Title' }, { kind: 'para', text: 'One.' }, { kind: 'para', text: 'Two.' },
  ])
})
