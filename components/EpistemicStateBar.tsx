'use client'

import useSWR from 'swr'
import type { Domain, PopulationStatus, ShiftsResponse } from '@/lib/types'
import { fetchPopulationShifts, fetchPopulationStatus } from '@/lib/api'

const POLL = 30_000

interface Props {
  domain: Domain
}

function EntropyColor(v: number) {
  if (v >= 0.7) return 'val-red'
  if (v >= 0.5) return 'val-amber'
  return ''
}

function ShiftsColor(v: number) {
  if (v >= 3) return 'val-red'
  if (v >= 1) return 'val-amber'
  return ''
}

function EntropyLabel(v: number) {
  if (v >= 0.7) return 'high uncertainty'
  if (v >= 0.5) return 'moderate uncertainty'
  return 'low uncertainty'
}

export default function EpistemicStateBar({ domain }: Props) {
  const { data, error } = useSWR<PopulationStatus>(
    ['population-status', domain],
    fetchPopulationStatus,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )
  const { data: shiftsData } = useSWR<ShiftsResponse>(
    ['population-shifts', domain],
    fetchPopulationShifts,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  // Visible API error — no silent fallback for domains without mock data
  if (error) {
    return (
      <div className="panel epistemic-state" style={{ padding: 0, gridColumn: '1/3' }}>
        <div className="state-metric" style={{ gridColumn: '1 / 6', padding: '20px 24px' }}>
          <div className="metric-label" style={{ color: 'var(--red)', marginBottom: 6 }}>
            engine_status · API ERROR
          </div>
          <div className="metric-sub" style={{ color: 'var(--red-dim)' }}>
            {String(error.message ?? 'failed to reach /v1/population/status')}
          </div>
        </div>
      </div>
    )
  }

  // Show skeleton if not yet loaded
  if (!data) {
    return (
      <div className="panel epistemic-state" style={{ padding: 0, gridColumn: '1/3' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="state-metric">
            <div className="metric-label">loading…</div>
            <div className="metric-value" style={{ opacity: 0.2 }}>--</div>
          </div>
        ))}
      </div>
    )
  }

  const totalShifts = shiftsData?.total_shifts

  return (
    <div className="panel epistemic-state" style={{ padding: 0, gridColumn: '1/3' }}>
      {/* structure_entropy */}
      <div className="state-metric has-tip">
        <div className="tip">Measures how spread out belief is across competing ontology candidates. 0 = all belief in one worldview. 1 = completely uncertain which worldview is correct. High entropy is epistemically honest.</div>
        <div className="metric-label">structure_entropy</div>
        <div className={`metric-value ${EntropyColor(data.structure_entropy)}`}>
          {data.structure_entropy.toFixed(2)}
        </div>
        <div className="metric-sub">{EntropyLabel(data.structure_entropy)}</div>
      </div>

      {/* active_candidates */}
      <div className="state-metric has-tip">
        <div className="tip">Number of competing belief structures currently active in the population. Each is a complete hypothesis about how this domain works. They compete for survival against incoming evidence.</div>
        <div className="metric-label">active_candidates</div>
        <div className="metric-value">{data.active_candidates}</div>
        <div className="metric-sub">
          of {data.max_candidates} max · gen {data.current_generation}
        </div>
      </div>

      {/* dominant_hypothesis */}
      <div className="state-metric has-tip">
        <div className="tip">The ontology candidate currently scoring highest against observed evidence. This is the system&apos;s best current worldview — the belief structure that has best survived contact with reality so far.</div>
        <div className="metric-label">dominant_hypothesis</div>
        <div className="metric-name">{data.dominant_hypothesis.name}</div>
        <div className="metric-sub">
          {data.dominant_hypothesis.candidate_id} · {data.dominant_hypothesis.generations_dominant} gen dominant
        </div>
      </div>

      {/* paradigm_shifts */}
      <div className="state-metric has-tip">
        <div className="tip">Total recorded number of times the dominant worldview has changed. Each shift is a Kuhnian paradigm change — the previously dominant belief structure lost enough ground that a different one took over.</div>
        <div className="metric-label">paradigm_shifts</div>
        <div className={`metric-value ${ShiftsColor(totalShifts ?? 0)}`}>
          {totalShifts ?? '--'}
        </div>
        <div className="metric-sub">total recorded</div>
      </div>

      {/* frontier_edges */}
      <div className="state-metric has-tip">
        <div className="tip">Relationships whose existence probability sits near 0.5 — the system genuinely does not yet know if they are real. These are the edges currently receiving elevated exploration attention.</div>
        <div className="metric-label">frontier_edges</div>
        <div className="metric-value val-cyan">{data.frontier_edge_count}</div>
        <div className="metric-sub">unresolved relationships</div>
      </div>
    </div>
  )
}
