'use client'

import useSWR from 'swr'
import type { CaseForecast, CaseSet, CasesResponse, Domain } from '@/lib/types'
import { fetchCases } from '@/lib/api'
import { anyChance, mechanismLabel } from '@/lib/labels'

const ROWS = 8

// Next year's cases whose chance the leader raises most over their own past:
// what the mechanisms add. The likeliest cases are mostly the big ones, which
// own past alone already names.
export default function CaseForecasts({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, { revalidateOnFocus: false })
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        forecasts · raised_most_by_the_leader
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          For each case, the chance of the outcome next year from its own past alone, then with the leading
          mechanism. Listed: the cases the mechanism raises most. Bars above: each year, how much better the
          leader predicted than own past (green) or worse (red).
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/cases unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : (
        <div className="cases-columns">
          {data.case_sets.map(s => <SetForecast key={s.key} set={s} />)}
        </div>
      )}
    </div>
  )
}

function SetForecast({ set }: { set: CaseSet }) {
  const gains = set.years.map(y => y.engine - y.own_past)
  const top = Math.max(1, ...gains.map(Math.abs))
  return (
    <div>
      <div className="cases-list-title">{set.title} · {set.years[0]?.year}–{set.years[set.years.length - 1]?.year}</div>
      <div className="cases-bars" aria-label="nats over own past, each year">
        {set.years.map((y, i) => (
          <div key={y.year} className="cases-bar-slot" title={`${y.year}: ${gains[i] >= 0 ? '+' : ''}${gains[i].toFixed(1)} nats`}>
            <div className="cases-bar" style={{
              height: `${(Math.abs(gains[i]) / top) * 50}%`,
              [gains[i] >= 0 ? 'bottom' : 'top']: '50%',
              background: gains[i] >= 0 ? 'var(--green-dark)' : 'var(--red-dim)',
            }} />
          </div>
        ))}
      </div>
      {set.forecast_year !== null && (
        <>
          <div className="cases-list-title">
            {set.outcome}, {set.forecast_year + 1}: own past → with {mechanismLabel(set.leader)}
          </div>
          <Rows rows={set.most_raised} />
        </>
      )}
    </div>
  )
}

function Rows({ rows }: { rows: CaseForecast[] }) {
  if (rows.length === 0) {
    return <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>the leader is own past: it raises no one</div>
  }
  return (
    <>
      {rows.slice(0, ROWS).map(r => (
        <div key={r.case} className="cases-row">
          <span className="cases-name" title={r.label}>{r.label}</span>
          <span style={{ color: 'var(--text-faint)' }}>{anyChance(r.own_past)}</span>
          <span>→ {anyChance(r.with_leader)}</span>
        </div>
      ))}
    </>
  )
}
