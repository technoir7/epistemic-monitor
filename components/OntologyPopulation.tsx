'use client'

import useSWR from 'swr'
import type { Domain, CandidatesResponse, Candidate } from '@/lib/types'
import { fetchCandidates } from '@/lib/api'

const POLL = 30_000

interface Props {
  domain: Domain
}

function statusClass(s: Candidate['status']) {
  switch (s) {
    case 'dominant': return 'dominant'
    case 'rising':   return 'rising'
    case 'falling':  return 'falling'
    default:         return 'neutral'
  }
}

function barClass(s: Candidate['status']) {
  switch (s) {
    case 'dominant': return 'fill-green'
    case 'rising':   return 'fill-cyan'
    case 'falling':  return 'fill-red'
    default:         return 'fill-dim'
  }
}

function tagClass(s: Candidate['status']) {
  switch (s) {
    case 'dominant': return 't-dominant'
    case 'rising':   return 't-rising'
    case 'falling':  return 't-pruning'
    default:         return ''
  }
}

function tagLabel(s: Candidate['status']) {
  switch (s) {
    case 'dominant': return 'dominant'
    case 'rising':   return 'rising'
    case 'falling':  return 'pruning'
    default:         return 'stable'
  }
}

function fmtScore(n: number) {
  return n.toFixed(1)
}

export default function OntologyPopulation({ domain }: Props) {
  const { data, error } = useSWR<CandidatesResponse>(
    ['candidates', domain],
    fetchCandidates,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  if (error) {
    return (
      <div className="panel population-panel">
        <div className="panel-label">ontology_population · error</div>
        <div style={{ color: 'var(--red-dim)', fontSize: 10, padding: '8px 0' }}>
          API ERROR · {String(error.message ?? '/v1/population/candidates unreachable')}
        </div>
      </div>
    )
  }

  const gen = data?.generation ?? '—'
  const candidates = data?.candidates ?? []

  return (
    <div className="panel population-panel">
      <div className="panel-label has-tip">
        ontology_population · gen {gen}
        <div className="tip" style={{ left: 0, transform: 'none' }}>Competing belief structures scored against evidence. Each candidate is a complete hypothesis about how this domain works. The dominant candidate is the system&apos;s current best worldview. Low-scoring candidates are pruned; variants of survivors are introduced each generation.</div>
      </div>
      <div className="candidate-list">
        {candidates.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}
        {candidates.map((c) => (
          <div key={c.id} className={`candidate-row ${statusClass(c.status)} has-tip`}>
            <div className="tip" style={{ left: 0, transform: 'none' }}>
              {c.status === 'dominant' && 'Dominant worldview — the belief structure currently scoring highest against observed evidence. Has survived the most selection events and best explains incoming data.'}
              {c.status === 'rising'   && 'Rising candidate — score is improving relative to other competitors. May challenge the dominant worldview if evidence continues to support it. Currently being evaluated.'}
              {c.status === 'falling'  && 'Declining candidate — score is worsening relative to competitors. Evidence has consistently contradicted this worldview. Will be removed next cycle.'}
              {c.status !== 'dominant' && c.status !== 'rising' && c.status !== 'falling' && 'Stable candidate — neither gaining nor losing significantly against competitors. Maintains a position in the population but is not currently challenging for dominance.'}
            </div>
            <div className="cand-header">
              <div className="cand-name">
                <strong>{c.name}</strong>
                {c.id} · {c.evidence_count} ev · gen {c.generation_introduced}
              </div>
              <div className="cand-score">
                {fmtScore(c.log_score)}
                <span>log_score</span>
              </div>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill ${barClass(c.status)}`}
                style={{ width: `${(c.score_normalized * 100).toFixed(0)}%` }}
              />
            </div>
            <div className="cand-tags">
              <span className={`tag ${tagClass(c.status)}`}>{tagLabel(c.status)}</span>
              <span className="tag">{c.edge_count} edges</span>
              {c.status === 'rising' && <span className="tag t-new">new</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
