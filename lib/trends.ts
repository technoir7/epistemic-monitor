// Readings of the art trends (engine REFACTOR_SPEC D30) for the trends panel.

import type { Trend, TrendListName, TrendLists } from './types'

export function shares(t: TrendLists, trend: Trend): number[] {
  return trend.writers.map((n, i) => (t.all_writers[i] ? n / t.all_writers[i] : 0))
}

function pct(x: number): string {
  return x >= 0.1 ? `${Math.round(x * 100)}%` : `${(x * 100).toFixed(x >= 0.01 ? 0 : 1)}%`
}

/** What put the trend on the list, in a few characters. */
export function measure(t: TrendLists, list: TrendListName, trend: Trend): string {
  const s = shares(t, trend)
  const now = t.years.indexOf(t.year)
  const before = s.slice(now - t.before, now)
  if (list === 'new') return `${trend.writers[now]} writers`
  if (list === 'growing') {
    const avg = before.reduce((a, b) => a + b, 0) / t.before
    return avg ? `×${(s[now] / avg).toFixed(1)}` : 'new'
  }
  if (list === 'fading') return `${pct(Math.max(...before))} → ${pct(s[now])}`
  const [yes, no] = trend.verdicts
  return `${Math.round((100 * Math.min(yes, no)) / (yes + no))}% split`
}
