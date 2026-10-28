'use client'

import useSWR from 'swr'
import type { CasesResponse, Domain } from '@/lib/types'
import { fetchCases } from '@/lib/api'
import { mechanismLabel } from '@/lib/labels'
import { caseGraph, type EdgeTone } from '@/lib/caseGraph'

const W = 520
const H = 300
const LABEL_AT = 0.22

const STROKE: Record<EdgeTone, string> = {
  leader: 'var(--amber)',
  helps: 'var(--green-dark)',
  fails: 'var(--red-dim)',
}

// Splits an outcome into lines of at most ~20 characters for the right-hand label.
function lines(text: string): string[] {
  const out: string[] = []
  for (const word of text.split(' ')) {
    const last = out[out.length - 1]
    if (last && (last + ' ' + word).length <= 20) out[out.length - 1] = `${last} ${word}`
    else out.push(word)
  }
  return out
}

// Art's graph: what the case engine judged, not links between monthly totals,
// which the engine found carry none (engine evals, replays 15–16).
export default function CaseGraph({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<CasesResponse>(['cases', domain], fetchCases, { revalidateOnFocus: false })
  return (
    <div className="panel belief-graph-panel">
      <div className="panel-label has-tip">
        case_mechanisms_graph
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Each line is a mechanism the engine judged across thousands of cases: does a case in this
          state this year tend to the outcome next year? Thickness is the evidence for it beyond each
          case&apos;s own past, over 2001–2024. Amber: the engine&apos;s current belief. Green: helps,
          but less. Red dashed: predicts worse than own past.
        </div>
      </div>
      <div className="graph-canvas">
        {error ? (
          <div style={{ color: 'var(--red-dim)', fontSize: 10, padding: 8 }}>
            API ERROR · {String(error.message ?? '/v1/cases unreachable')}
          </div>
        ) : !data ? (
          <div style={{ color: 'var(--text-faint)', fontSize: 10, padding: 8 }}>loading…</div>
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="case mechanisms">
            {caseGraph(data.case_sets, W, H).bands.map((band, i) => (
              <g key={band.key}>
                {i > 0 && <line x1={8} x2={W - 8} y1={band.top} y2={band.top} stroke="var(--green-faint)" />}
                <text x={8} y={band.top + 13} fontSize={10} fill="var(--text-faint)" letterSpacing="0.12em">
                  {band.title.toUpperCase()}
                </text>
                {band.edges.map(e => (
                  <g key={e.feature}>
                    <line
                      x1={e.x1 + 6} y1={e.y1} x2={e.x2 - 6} y2={e.y2}
                      stroke={STROKE[e.tone]} strokeWidth={e.width}
                      strokeDasharray={e.tone === 'fails' ? '3 3' : undefined}
                      strokeLinecap="round"
                    />
                    <circle cx={e.x1} cy={e.y1} r={4} fill={STROKE[e.tone]} />
                    <text x={e.x1 - 10} y={e.y1 + 4} fontSize={11} textAnchor="end"
                      fill={e.tone === 'fails' ? 'var(--text-faint)' : 'var(--text-dim)'}>
                      {mechanismLabel([e.feature])}
                    </text>
                    {/* Near the left end: towards the outcome the lines converge. */}
                    <text x={e.x1 + LABEL_AT * (e.x2 - e.x1)} y={e.y1 + LABEL_AT * (e.y2 - e.y1) - 5}
                      fontSize={10} textAnchor="middle"
                      fill={STROKE[e.tone]}>
                      {e.gainText}
                    </text>
                  </g>
                ))}
                <circle cx={band.outcomeX} cy={band.outcomeY} r={5} fill="var(--green)" />
                <text x={band.outcomeX + 10} y={band.outcomeY - 4} fontSize={11} fill="var(--text)">
                  {lines(band.outcome).map((l, j) => (
                    <tspan key={j} x={band.outcomeX + 10} dy={j === 0 ? 0 : 13}>{l}</tspan>
                  ))}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
