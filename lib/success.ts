// Readings of the art success snapshot (engine REFACTOR_SPEC D31) for the success panel.

import type { Rewarded, SuccessKind, ThemeTest } from './types'
import { mechanismLabel } from './labels.ts'

const AMOUNT: Record<string, string> = { '1': 'one', '2': 'several' }

/** The leader's features by how hard they push on any success next year: + helps, - hurts. */
export function pushes(kind: Pick<SuccessKind, 'effects'>, top: number): { label: string; push: number }[] {
  return Object.entries(kind.effects)
    .map(([k, push]) => {
      const [f, level] = k.split('=')
      return { label: `${mechanismLabel([f])}, ${AMOUNT[level] ?? level}`, push }
    })
    .sort((a, b) => Math.abs(b.push) - Math.abs(a.push))
    .slice(0, top)
}

/** Trends or media critics judged this year, by the share of verdicts in favour. */
export function rewardedBy(rows: Rewarded[], kind: Rewarded['kind']): (Rewarded & { share: number })[] {
  return rows
    .filter(r => r.kind === kind)
    .map(r => ({ ...r, share: r.approvals / (r.approvals + r.disapprovals) }))
    .sort((a, b) => b.share - a.share)
}

/** Nats each leading feature adds: the engine's gain less its gain with that
 *  feature dealt at random among the year's artists, averaged over the deals. */
export function adds(kind: Pick<SuccessKind, 'gain' | 'dealt'>): { label: string; adds: number }[] {
  return Object.entries(kind.dealt)
    .map(([f, deals]) => ({ label: mechanismLabel([f]), adds: kind.gain - deals.reduce((a, b) => a + b, 0) / deals.length }))
    .sort((a, b) => b.adds - a.adds)
}

const RECORDS = ['good_theme', 'poor_theme']

/** Whether a theme's record joins what leads for a kind (engine ART-PLAN §14),
 *  how much the leader then beats the kind's own leader, and what good-record
 *  themes add (gain less the mean with them dealt at random). */
export function themeRecord(t: Pick<ThemeTest, 'leader' | 'gain' | 'gain_without' | 'dealt'>): {
  leads: boolean; over: number; adds: number
} {
  const deals = t.dealt.good_theme ?? []
  return {
    leads: t.leader.some(f => RECORDS.includes(f)),
    over: t.gain - t.gain_without,
    adds: deals.length ? t.gain - deals.reduce((a, b) => a + b, 0) / deals.length : 0,
  }
}
