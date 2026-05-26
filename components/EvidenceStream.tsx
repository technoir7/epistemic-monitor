'use client'

import useSWR from 'swr'
import type { Domain, EvidenceResponse, EvidenceRecord } from '@/lib/types'
import { fetchRecentEvidence } from '@/lib/api'

const POLL = 30_000

interface Props {
  domain: Domain
}

function impactLabel(delta: number): string {
  if (delta === 0) return '+0.00'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(2)}`
}

function rowClass(s: EvidenceRecord['strength']): string {
  if (s === 'strong') return 'ev-strong'
  if (s === 'shift')  return 'ev-shift'
  return 'ev-weak'
}

export default function EvidenceStream({ domain }: Props) {
  const { data } = useSWR<EvidenceResponse>(
    ['evidence-recent', domain],
    fetchRecentEvidence,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const records = data?.records ?? []

  return (
    <div className="panel evidence-panel">
      <div className="panel-label has-tip">
        evidence_stream · last {records.length || 8} records
        <div className="tip" style={{ left: 0, transform: 'none' }}>Incoming observations from NOAA and EIA data sources, mapped to domain variables and ingested as evidence records. The impact column shows the net change to the dominant candidate&apos;s log score from that record.</div>
      </div>
      <div className="ev-stream">
        {records.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}
        {records.map((r) => (
          <div key={r.id} className={`ev-row ${rowClass(r.strength)}`}>
            <span className="ev-time">{r.timestamp}</span>
            <span className="ev-desc">{r.description}</span>
            <span className="ev-impact">{impactLabel(r.impact_delta)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
