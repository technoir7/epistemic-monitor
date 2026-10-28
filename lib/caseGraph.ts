// Layout of the case-mechanism graph (engine REFACTOR_SPEC D29): for each
// case set, a band with its mechanisms on the left, each drawn to the outcome
// it is judged to predict, as thick as the evidence for it over each case's
// own past. Widths share one scale across bands, so a weak mechanism in one
// set never looks as strong as a strong one in another.

import type { CaseSet } from './types'

type GraphSet = Pick<CaseSet, 'key' | 'title' | 'outcome' | 'pool' | 'leader' | 'mechanisms'>

export type EdgeTone = 'leader' | 'helps' | 'fails'

export interface CaseEdge {
  feature: string
  gain: number
  gainText: string
  tone: EdgeTone
  width: number
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface CaseBand {
  key: string
  title: string
  outcome: string
  top: number
  bottom: number
  outcomeX: number
  outcomeY: number
  edges: CaseEdge[]
}

const MARGIN = 150     // room for the labels either side
const PAD = 26         // keeps the first and last mechanism off the band's edge
const MAX_WIDTH = 7

function signed(n: number): string {
  const r = Math.round(n)
  return r > 0 ? `+${r}` : r < 0 ? `−${-r}` : '0'
}

export function caseGraph(sets: GraphSet[], width: number, height: number): { bands: CaseBand[] } {
  const single = (s: GraphSet) =>
    new Map(s.mechanisms.filter(m => m.features.length === 1).map(m => [m.features[0], m.gain]))
  const best = Math.max(1, ...sets.flatMap(s => Array.from(single(s).values())))
  const h = height / sets.length
  const bands = sets.map((s, i) => {
    const top = i * h
    const bottom = top + h
    const gains = single(s)
    const features = s.pool.filter(f => gains.has(f))
    const step = features.length > 1 ? (h - 2 * PAD) / (features.length - 1) : 0
    const outcomeY = top + h / 2
    const edges = features.map((f, j): CaseEdge => {
      const gain = gains.get(f) as number
      return {
        feature: f,
        gain,
        gainText: signed(gain),
        tone: s.leader.includes(f) ? 'leader' : gain > 0 ? 'helps' : 'fails',
        width: 1 + (MAX_WIDTH - 1) * Math.max(gain, 0) / best,
        x1: MARGIN,
        y1: features.length > 1 ? top + PAD + j * step : outcomeY,
        x2: width - MARGIN,
        y2: outcomeY,
      }
    })
    return { key: s.key, title: s.title, outcome: s.outcome, top, bottom, outcomeX: width - MARGIN, outcomeY, edges }
  })
  return { bands }
}
