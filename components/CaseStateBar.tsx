'use client'

import useSWR from 'swr'
import type { CaseSet, CasesResponse, Domain, PopulationStatus } from '@/lib/types'
import { fetchCases, fetchPopulationStatus } from '@/lib/api'
import { mechanismLabel } from '@/lib/labels'
import { leaderSince } from '@/lib/cases'

const POLL = 30_000

// The case engine's state for a domain judged by cases (art), in the slot the
// epistemic state bar holds for the others.
export default function CaseStateBar({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, { revalidateOnFocus: false })
  const { data: monthly, error: monthlyError } = useSWR<PopulationStatus>(
    ['population-status', domain], fetchPopulationStatus, { refreshInterval: POLL, revalidateOnFocus: false },
  )
  if (error) {
    return (
      <div className="panel epistemic-state" style={{ padding: '20px 24px' }}>
        <div className="metric-label" style={{ color: 'var(--red)' }}>case_engine · API ERROR</div>
        <div className="metric-sub" style={{ color: 'var(--red-dim)' }}>{String(error.message ?? '/v1/cases unreachable')}</div>
      </div>
    )
  }
  const sets = data?.case_sets ?? []
  const forecastYear = sets.find(s => s.forecast_year !== null)?.forecast_year
  return (
    <div className="panel epistemic-state" style={{ padding: 0 }}>
      {sets.length === 0
        ? <div className="state-metric"><div className="metric-label">loading…</div></div>
        : sets.map(s => <LeaderCell key={s.key} set={s} />)}
      <div className="state-metric has-tip">
        <div className="tip">Every case in every year, each predicted only from the years before it.</div>
        <div className="metric-label">case_years_judged</div>
        <div className="metric-value">
          {sets.length ? (sets.reduce((n, s) => n + s.years.reduce((m, y) => m + y.cases, 0), 0) / 1000).toFixed(0) + 'k' : '--'}
        </div>
        <div className="metric-sub">{sets.map(s => s.title.toLowerCase()).join(' + ')}</div>
      </div>
      <div className="state-metric has-tip">
        <div className="tip">The usual engine, run on the monthly totals (each paper&apos;s share of art articles by topic, market figures, acquisitions). It looks for links between them; for art it has found none, so the case engine above is the reading that says something.</div>
        <div className="metric-label">monthly_totals</div>
        <div className="metric-name">
          {monthlyError ? 'API ERROR' : !monthly ? '--'
            : monthly.dominant_hypothesis.name.startsWith('unconnected') ? 'no links found' : 'links under trial'}
        </div>
        <div className="metric-sub">the usual engine, for comparison</div>
      </div>
      <div className="state-metric has-tip">
        <div className="tip">Forecasts are made from the last complete year for the year after it, by the current leader and by each case&apos;s own past alone.</div>
        <div className="metric-label">forecast_for</div>
        <div className="metric-value">{forecastYear != null ? forecastYear + 1 : '--'}</div>
        <div className="metric-sub">{forecastYear != null ? `from data through ${forecastYear}` : ''}</div>
      </div>
    </div>
  )
}

function LeaderCell({ set }: { set: CaseSet }) {
  return (
    <div className="state-metric has-tip">
      <div className="tip">
        What the case engine currently believes drives {set.title.toLowerCase()}: of every combination of mechanisms, the one
        that has best predicted {set.outcome} beyond each case&apos;s own past. It changes only on strong evidence.
      </div>
      <div className="metric-label">{set.key}_leader</div>
      <div className="metric-name" style={{ color: 'var(--amber)' }}>{mechanismLabel(set.leader)}</div>
      <div className="metric-sub">
        since {leaderSince(set)} · {set.gain >= 0 ? '+' : ''}{set.gain.toFixed(0)} nats
      </div>
    </div>
  )
}
