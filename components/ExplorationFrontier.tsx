'use client'

import useSWR from 'swr'
import type { Domain, CandidatesResponse, InferenceResponse, QueryRequest } from '@/lib/types'
import { fetchCandidates, fetchInferenceQuery } from '@/lib/api'
import { MOCK } from '@/lib/mockData'

const POLL = 30_000

const TARGET_VARIABLE_BY_DOMAIN: Record<Domain, string> = {
  mr: 'YieldCurveInverted',
  ai: 'SemiconductorMomentum',
  ng: 'PriceUp',
  sd: 'USYieldSpiking',
  cc: 'HYSpreadElevated',
  er: 'OilPriceSurge',
  lm: 'UnemploymentRising',
}

interface Props {
  domain: Domain
}

export default function ExplorationFrontier({ domain }: Props) {
  const mock = (MOCK as Record<string, typeof MOCK[keyof typeof MOCK] | undefined>)[domain]

  const { data: candidatesData } = useSWR<CandidatesResponse>(
    ['candidates', domain],
    fetchCandidates,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const dominantId =
    candidatesData?.candidates.find(c => c.status === 'dominant')?.id ??
    candidatesData?.candidates[0]?.id ??
    mock?.status.dominant_hypothesis.candidate_id

  const req: QueryRequest | null = dominantId
    ? {
        domain,
        target_variable: TARGET_VARIABLE_BY_DOMAIN[domain],
        candidate_id: dominantId,
        aggregation: 'weighted_avg',
      }
    : null

  const { data, error } = useSWR<InferenceResponse>(
    req ? ['inference-query', req] : null,
    fetchInferenceQuery,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const frontier = data?.frontier_edges ?? []

  return (
    <div className="frontier-panel" style={{ gridColumn: '1/3' }}>
      <div className="panel-label has-tip">
        exploration_frontier · unresolved edges
        <div className="tip" style={{ left: 0, transform: 'none' }}>Candidate relationships whose existence probability sits near 0.5 — the boundary of the system&apos;s knowledge. These edges are receiving elevated exploration attention. As evidence accumulates they will converge toward established or pruned.</div>
      </div>
      <div className="frontier-chips">
        {error ? (
          <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>
            API ERROR · {String(error.message ?? '/v1/inference/query unreachable')}
          </div>
        ) : !data && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}
        {data && frontier.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no unresolved edges</div>
        )}
        {frontier.map((f, i) => (
          <div key={i} className="frontier-chip has-tip">
            <div className="tip">Unresolved edge — existence probability near 0.5. Receiving elevated exploration attention. Will converge toward established or pruned as evidence accumulates.</div>
            <span className="chip-rel">{f.relation}</span>
            <span className="chip-prob">{f.probability.toFixed(2)}</span>
            <span className="chip-note">{f.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
