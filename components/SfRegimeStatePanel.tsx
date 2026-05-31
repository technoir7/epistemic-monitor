'use client'

import useSWR from 'swr'
import type { Domain, OntologyMode, SfVariableName } from '@/lib/types'

const POLL = 30_000
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

const VAR_LABELS: Record<SfVariableName, string> = {
  TechHiringAccelerating: 'TECH_HIRING_ACC',
  OfficeVacancyFalling:   'OFFICE_VAC_FALL',
  RetailClosureElevated:  'RETAIL_CLOSURE',
  PermitActivityRising:   'PERMIT_ACTIVITY',
  CrimeIndexElevated:     'CRIME_INDEX_ELV',
  StartupFormationRising: 'STARTUP_FORM_RIS',
  FootTrafficRecovering:  'FOOT_TRAFFIC_REC',
  PopulationFlowPositive: 'POP_FLOW_POS',
}

const VAR_ORDER: SfVariableName[] = [
  'TechHiringAccelerating',
  'OfficeVacancyFalling',
  'RetailClosureElevated',
  'PermitActivityRising',
  'CrimeIndexElevated',
  'StartupFormationRising',
  'FootTrafficRecovering',
  'PopulationFlowPositive',
]

type SfRegimeProbabilityMap = Record<SfVariableName, number>

interface VariableProbabilityResponse {
  target_variable: string
  target_probability: number
}

async function fetchSfVariableProbabilities(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<SfRegimeProbabilityMap> {
  const entries = await Promise.all(
    VAR_ORDER.map(async name => {
      const res = await fetch(`${API_BASE}/v1/inference/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ domain, target_variable: name, ontology_mode: mode }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = (await res.json()) as VariableProbabilityResponse
      if (typeof json.target_probability !== 'number') {
        throw new Error(`missing target_probability for ${name}`)
      }

      return [name, json.target_probability] as const
    }),
  )

  return Object.fromEntries(entries) as SfRegimeProbabilityMap
}

interface Props {
  domain: Domain
  ontologyMode: OntologyMode
}

export default function SfRegimeStatePanel({ domain, ontologyMode }: Props) {
  const { data, error } = useSWR<SfRegimeProbabilityMap>(
    ['sf-regime-probabilities', domain, ontologyMode],
    fetchSfVariableProbabilities,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  if (error) {
    return (
      <div className="panel regime-panel">
        <div className="panel-label" style={{ color: 'var(--red)' }}>
          regime_state · API ERROR
        </div>
        <div style={{ color: 'var(--red-dim)', fontSize: 10, padding: '4px 0' }}>
          {String(error.message ?? '/v1/inference/query unreachable')}
        </div>
      </div>
    )
  }

  return (
    <div className="panel regime-panel">
      <div className="panel-label has-tip">
        regime_state{data ? ' · current' : ' · loading…'}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          SF urban regime variables for the current evidence cycle. Each variable
          shows the system&apos;s posterior state (TRUE/FALSE) and the probability
          assigned to that state. Variables near 0.50 are genuinely uncertain.
        </div>
      </div>

      <div className="regime-var-list">
        {!data && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}

        {data && VAR_ORDER.map(name => {
          const prob = data[name]
          const state = prob >= 0.5

          const stateClass = state ? 'state-true' : 'state-false'
          const isHighConf = prob >= 0.70
          const fillClass  = state
            ? (isHighConf ? 'regime-prob-fill--true-hi' : 'regime-prob-fill--true-lo')
            : 'regime-prob-fill--false'
          const probColor  = state
            ? (isHighConf ? 'var(--green)' : 'var(--text-mid)')
            : 'var(--text-faint)'

          return (
            <div key={name} className="regime-var-row">
              <div className="regime-var-name">{VAR_LABELS[name]}</div>

              <div className={`regime-var-badge ${stateClass}`}>
                {state ? 'TRUE' : 'FALSE'}
              </div>

              <div className="regime-var-prob-wrap">
                <div className="regime-prob-track">
                  <div
                    className={`regime-prob-fill ${fillClass}`}
                    style={{ width: `${(prob * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="regime-prob-num" style={{ color: probColor }}>
                  {prob.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
