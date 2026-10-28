'use client'

import useSWR from 'swr'
import type { CaseForecast, CaseSet, CasesResponse, Domain } from '@/lib/types'
import { fetchCases } from '@/lib/api'
import { anyChance, mechanismLabel } from '@/lib/labels'

interface Props {
  domain: Domain
}

const ROWS = 8

// Case sets are snapshots rebuilt once a year, so this fetches once and never polls.
export default function CaseMechanisms({ domain }: Props) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, {
    revalidateOnFocus: false,
  })
  if (error) {
    return (
      <div className="panel cases-panel">
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>
          API ERROR · {String(error.message ?? '/v1/cases unreachable')}
        </div>
      </div>
    )
  }
  // A domain of one economy or city has no cases: nothing to show.
  if (!data || data.case_sets.length === 0) return null
  return (
    <div className="panel cases-panel">
      <div className="panel-label has-tip">
        case_mechanisms
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Many small histories judged together. Each artist or concept is a case. The engine tries every
          combination of mechanisms as a rival explanation of what happens to a case next year, and
          predicts each year only from the years before. It keeps the one that predicts best beyond each
          case&apos;s own past, and changes its mind only on strong evidence (3 nats).
        </div>
      </div>
      <div className="cases-sets">
        {data.case_sets.map(s => <CaseSetView key={s.key} set={s} />)}
      </div>
    </div>
  )
}

function CaseSetView({ set }: { set: CaseSet }) {
  const first = set.years[0]?.year
  const last = set.years[set.years.length - 1]?.year
  const lastShift = set.shifts[set.shifts.length - 1]
  const leader = mechanismLabel(set.leader)
  return (
    <div className="cases-set">
      <div className="cases-title">{set.title}</div>
      <div className="cases-line">
        <span style={{ color: 'var(--text-faint)' }}>outcome</span> {set.outcome}
      </div>
      <div className="cases-line">
        <span style={{ color: 'var(--text-faint)' }}>leader</span>{' '}
        <span style={{ color: 'var(--amber)' }}>{leader}</span>
        {lastShift && <> since {lastShift.year + 1}</>}
        {' · '}
        <span style={{ color: set.gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {set.gain >= 0 ? '+' : ''}{set.gain.toFixed(0)} nats
        </span>{' '}
        over own past, {first}–{last}
      </div>
      <GainBars set={set} />
      {set.shifts.length > 0 && (
        <div className="cases-line" style={{ color: 'var(--text-faint)' }}>
          leaders:{' '}
          {set.shifts.map(s => `from ${s.year + 1}, ${mechanismLabel(s.to)}`).join(' · ')}
        </div>
      )}
      {set.forecast_year !== null && (
        <div className="cases-forecasts">
          <ForecastList
            title={`raised most by ${leader}, ${set.forecast_year + 1}`}
            rows={set.most_raised}
            empty="the leader is own past: it raises no one"
          />
          <ForecastList
            title={`likeliest, ${set.forecast_year + 1} (mostly own past)`}
            rows={set.likeliest}
            empty="none"
          />
        </div>
      )}
    </div>
  )
}

// A shift is made on a year's evidence and its leader first predicts the year
// after, so every year shown here is the first year a leader was used.

// Each scored year: how much better the leader (chosen before the year) predicted than own past.
function GainBars({ set }: { set: CaseSet }) {
  const gains = set.years.map(y => y.engine - y.own_past)
  const top = Math.max(1, ...gains.map(Math.abs))
  return (
    <div className="cases-bars" aria-label="nats over own past, each year">
      {set.years.map((y, i) => {
        const g = gains[i]
        return (
          <div key={y.year} className="cases-bar-slot" title={`${y.year}: ${g >= 0 ? '+' : ''}${g.toFixed(1)} nats`}>
            <div
              className="cases-bar"
              style={{
                height: `${(Math.abs(g) / top) * 50}%`,
                [g >= 0 ? 'bottom' : 'top']: '50%',
                background: g >= 0 ? 'var(--green-dark)' : 'var(--red-dim)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

function ForecastList({ title, rows, empty }: { title: string; rows: CaseForecast[]; empty: string }) {
  return (
    <div>
      <div className="cases-list-title">{title}</div>
      {rows.length === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>{empty}</div>
      ) : (
        rows.slice(0, ROWS).map(r => (
          <div key={r.case} className="cases-row">
            <span className="cases-name" title={r.label}>{r.label}</span>
            <span style={{ color: 'var(--text-faint)' }}>{anyChance(r.own_past)}</span>
            <span>→ {anyChance(r.with_leader)}</span>
          </div>
        ))
      )}
    </div>
  )
}
