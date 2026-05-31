'use client'

import useSWR from 'swr'
import type { Domain, OntologyMode, InferenceResponse, QueryRequest } from '@/lib/types'
import { fetchInferenceQuery } from '@/lib/api'
import { MOCK } from '@/lib/mockData'

const POLL = 30_000

interface Props {
  domain: Domain
  ontologyMode: OntologyMode
}

function edgeFillClass(status: string) {
  if (status === 'strong')  return 'ef-strong'
  if (status === 'explore') return 'ef-explore'
  return 'ef-weak'
}

function edgeProbClass(status: string) {
  if (status === 'strong')  return 'ep-strong'
  if (status === 'explore') return 'ep-explore'
  return 'ep-weak'
}

function badgeLabel(status: string) {
  if (status === 'explore') return '● exploring'
  if (status === 'weak')    return '● weak'
  return null
}

function badgeColor(status: string) {
  if (status === 'weak') return 'var(--red)'
  return undefined
}

export default function EdgeExistencePanel({ domain, ontologyMode }: Props) {
  const dominantId = MOCK[domain as keyof typeof MOCK].status.dominant_hypothesis.candidate_id
  const req: QueryRequest = {
    domain,
    target_variable: 'price_up',
    candidate_id: dominantId,
    aggregation: 'weighted_avg',
    ontology_mode: ontologyMode,
  }

  const { data } = useSWR<InferenceResponse>(
    ['inference-query', req],
    fetchInferenceQuery,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const edges = data?.edges ?? []
  const candidateId = data?.candidate_id ?? dominantId

  return (
    <div className="panel edge-panel">
      <div className="panel-label has-tip">
        edge_existence_probabilities · {candidateId}
        <div className="tip" style={{ left: 0, transform: 'none' }}>Probability that each relationship actually exists, learned from evidence. Not assumed — the system starts uncertain and updates toward 0 or 1 as evidence accumulates. Near 0.5 means genuinely unresolved.</div>
      </div>
      <div className="edge-list">
        {edges.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}
        {edges.map((e, i) => {
          const badge = badgeLabel(e.status)
          const edgeTip =
            e.status === 'strong'  ? 'Well-established relationship — evidence has consistently confirmed this edge exists. Probability approaching 1 indicates high confidence.' :
            e.status === 'explore' ? 'Currently unresolved. The system is actively gathering evidence for this relationship. Near 0.5 probability indicates maximum uncertainty — not enough evidence to confirm or reject.' :
            'Weak and declining — evidence has consistently failed to support this relationship. Probability trending toward 0; likely to be pruned.'
          return (
            <div key={i} className="edge-item has-tip">
              <div className="tip" style={{ left: 0, transform: 'none' }}>{edgeTip}</div>
              <div>
                <div className="edge-relation">
                  {e.source}
                  <span className="edge-arrow">→</span>
                  {e.target}
                  {badge && (
                    <span
                      className="edge-badge"
                      style={badgeColor(e.status) ? { color: badgeColor(e.status) } : undefined}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <div className="edge-track">
                  <div
                    className={`edge-fill ${edgeFillClass(e.status)}`}
                    style={{ width: `${(e.probability * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
              <div className={`edge-prob ${edgeProbClass(e.status)}`}>
                {e.probability.toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
