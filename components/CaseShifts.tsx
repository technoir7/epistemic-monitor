'use client'

import useSWR from 'swr'
import type { CasesResponse, Domain } from '@/lib/types'
import { fetchCases } from '@/lib/api'
import { mechanismLabel } from '@/lib/labels'

// Each change of the case engine's belief, dated by the first year the new
// leader predicted (a shift is made on a year's evidence and used the year after).
export default function CaseShifts({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, { revalidateOnFocus: false })
  return (
    <div className="frontier-panel">
      <div className="panel-label has-tip">
        belief_changes
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          When the case engine changed its mind, and to what. It starts believing each case&apos;s own past alone and
          changes only when a rival is ahead by strong evidence (3 nats, decaying with a 5-year half-life).
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/cases unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : (
        data.case_sets.map(s => (
          <div key={s.key} className="cases-shift-line" title={s.title}>
            <span style={{ color: 'var(--text-faint)' }}>{s.title.toLowerCase()}:</span>{' '}
            {s.shifts.length === 0 ? 'own past alone throughout'
              : s.shifts.map((x, i) => (
                <span key={x.year} style={{ color: i === s.shifts.length - 1 ? 'var(--amber)' : 'var(--text-dim)' }}>
                  {i > 0 && ' → '}{x.year + 1} {mechanismLabel(x.to)}
                </span>
              ))}
          </div>
        ))
      )}
    </div>
  )
}
