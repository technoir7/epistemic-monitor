// Readings of a case set (engine REFACTOR_SPEC D29) shared by the art panels.

import type { CaseSet } from './types'
import { mechanismLabel } from './labels.ts'

/** The first year the current leader predicted: the year after the shift that chose it. */
export function leaderSince(set: { shifts: CaseSet['shifts']; years: { year: number }[] }): number | undefined {
  const last = set.shifts[set.shifts.length - 1]
  return last ? last.year + 1 : set.years[0]?.year
}

export interface RivalRow {
  label: string
  gain: number
  bar: number        // gain over the largest gain or loss, -1..1
  leader: boolean
}

/** Every rival set of mechanisms, best first, as the engine reports them. */
export function rivalRows(set: Pick<CaseSet, 'leader' | 'mechanisms'>): RivalRow[] {
  const scale = Math.max(1, ...set.mechanisms.map(m => Math.abs(m.gain)))
  const leader = [...set.leader].sort().join('+')
  return set.mechanisms.map(m => ({
    label: mechanismLabel(m.features),
    gain: m.gain,
    bar: m.gain / scale,
    leader: [...m.features].sort().join('+') === leader,
  }))
}
