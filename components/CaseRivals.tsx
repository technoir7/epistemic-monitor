'use client'

import useSWR from 'swr'
import type { CasesResponse, Domain } from '@/lib/types'
import { fetchCases } from '@/lib/api'
import { rivalRows } from '@/lib/cases'

// The case engine's population: every combination of mechanisms, a rival
// explanation, with its evidence over each case's own past.
export default function CaseRivals({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, { revalidateOnFocus: false })
  return (
    <div className="panel population-panel">
      <div className="panel-label has-tip">
        rival_mechanisms
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Every combination of mechanisms is a rival explanation, judged on every case each year before the year is seen.
          The number is its evidence over each case&apos;s own past, 2001–2024, in nats (3 is strong). The leader
          (amber) is the one the engine believes now.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/cases unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : (
        data.case_sets.map(s => (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <div className="cases-list-title">{s.title} → {s.outcome}</div>
            {rivalRows(s).map(r => (
              <div key={r.label} className="rival-row" title={r.label}>
                <span className="cases-name" style={{ color: r.leader ? 'var(--amber)' : r.gain > 0 ? 'var(--text-dim)' : 'var(--text-faint)' }}>
                  {r.label}
                </span>
                <span className="rival-bar">
                  <span style={{
                    width: `${Math.abs(r.bar) * 50}%`,
                    [r.bar >= 0 ? 'left' : 'right']: '50%',
                    background: r.leader ? 'var(--amber)' : r.bar >= 0 ? 'var(--green-dark)' : 'var(--red-dim)',
                  }} />
                </span>
                <span style={{ color: r.gain >= 0 ? 'var(--green-dim)' : 'var(--red)', textAlign: 'right' }}>
                  {r.gain >= 0 ? '+' : '−'}{Math.abs(r.gain).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
