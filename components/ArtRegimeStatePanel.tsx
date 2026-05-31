'use client'

import useSWR from 'swr'
import type { ArtVariableName, Domain, OntologyMode } from '@/lib/types'

const POLL = 30_000
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

const REGIME_LABELS = [
  'H1 CraftAuraBacklash',
  'H2 AINormalization',
  'H3 DefensiveBlueChipConsolidation',
  'H4 PrestigeFragmentation',
  'H5 NeoAcademicResurgence',
] as const

const VARIABLE_GROUPS: {
  label: string
  variables: ArtVariableName[]
}[] = [
  {
    label: 'institutional',
    variables: [
      'InstitutionalRiskAversion',
      'MuseumFigurativeAcceptance',
      'ConceptualDominance',
      'AIArtInstitutionalAcceptance',
      'CuratorialMaterialityShift',
      'CraftPrestigeRising',
      'PrestigeFragmentation',
      'RegionalSceneMomentum',
      'BlueChipInstitutionalCapture',
      'BiennialFatigue',
      'MuseumAcquisitionMomentum',
    ],
  },
  {
    label: 'market',
    variables: [
      'BlueChipConcentration',
      'AuctionSpeculationElevated',
      'CollectorFlightToSafety',
      'FigurativeAuctionMomentum',
      'EmergingMarketLiquidity',
      'MarketPolarization',
      'MarketUncertainty',
    ],
  },
  {
    label: 'cultural',
    variables: [
      'RitualAuraPremium',
      'EmbodimentDiscourseRising',
      'AntiDigitalSentiment',
      'AIImageSaturation',
      'AuthenticityPremium',
      'NeoAcademicResurgence',
      'AttentionFragmentation',
    ],
  },
]

const VAR_ORDER = VARIABLE_GROUPS.flatMap(group => group.variables)

const AUCTION_VARIABLES = new Set<ArtVariableName>([
  'BlueChipConcentration',
  'AuctionSpeculationElevated',
  'CollectorFlightToSafety',
  'FigurativeAuctionMomentum',
  'EmergingMarketLiquidity',
  'MarketPolarization',
  'MarketUncertainty',
])

const VAR_LABELS: Record<ArtVariableName, string> = {
  InstitutionalRiskAversion:      'INST_RISK_AVERSION',
  MuseumFigurativeAcceptance:     'MUSEUM_FIG_ACCEPT',
  ConceptualDominance:            'CONCEPTUAL_DOM',
  AIArtInstitutionalAcceptance:   'AI_ART_INST_ACCEPT',
  CuratorialMaterialityShift:     'CURATOR_MATERIAL',
  CraftPrestigeRising:            'CRAFT_PRESTIGE',
  PrestigeFragmentation:          'PRESTIGE_FRAGMENT',
  RegionalSceneMomentum:          'REGIONAL_MOMENTUM',
  BlueChipInstitutionalCapture:   'BLUECHIP_CAPTURE',
  BiennialFatigue:                'BIENNIAL_FATIGUE',
  MuseumAcquisitionMomentum:      'MUSEUM_ACQ_MOM',
  BlueChipConcentration:          'BLUECHIP_CONC',
  AuctionSpeculationElevated:     'AUCTION_SPEC_ELEV',
  CollectorFlightToSafety:        'COLLECTOR_SAFETY',
  FigurativeAuctionMomentum:      'FIG_AUCTION_MOM',
  EmergingMarketLiquidity:        'EMERGING_LIQUID',
  MarketPolarization:             'MARKET_POLAR',
  MarketUncertainty:              'MARKET_UNCERT',
  RitualAuraPremium:              'RITUAL_AURA_PREM',
  EmbodimentDiscourseRising:      'EMBODIMENT_DISC',
  AntiDigitalSentiment:           'ANTI_DIGITAL_SENT',
  AIImageSaturation:              'AI_IMAGE_SAT',
  AuthenticityPremium:            'AUTHENTIC_PREM',
  NeoAcademicResurgence:          'NEO_ACADEMIC',
  AttentionFragmentation:         'ATTN_FRAGMENT',
}

type ArtRegimeProbabilityMap = Record<ArtVariableName, number | null>

interface VariableProbabilityResponse {
  target_variable: string
  target_probability?: number | null
}

interface ArtRegimeState {
  probabilities: ArtRegimeProbabilityMap
  missingVariables: ArtVariableName[]
}

async function fetchArtVariableProbabilities(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<ArtRegimeState> {
  const results = await Promise.allSettled(
    VAR_ORDER.map(async name => {
      const res = await fetch(`${API_BASE}/v1/inference/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ domain, target_variable: name, ontology_mode: mode }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = (await res.json()) as VariableProbabilityResponse
      const probability = json.target_probability

      return [
        name,
        typeof probability === 'number' && Number.isFinite(probability)
          ? probability
          : null,
      ] as const
    }),
  )

  const entries = results.map((result, index) => {
    const name = VAR_ORDER[index]
    if (result.status === 'fulfilled') return result.value
    return [name, null] as const
  })

  const missingVariables = entries
    .filter(([, probability]) => probability === null)
    .map(([name]) => name)

  if (missingVariables.length === VAR_ORDER.length) {
    throw new Error('/v1/inference/query returned no art variable probabilities')
  }

  return {
    probabilities: Object.fromEntries(entries) as ArtRegimeProbabilityMap,
    missingVariables,
  }
}

interface Props {
  domain: Domain
  ontologyMode: OntologyMode
}

export default function ArtRegimeStatePanel({ domain, ontologyMode }: Props) {
  const { data, error } = useSWR<ArtRegimeState>(
    ['art-regime-probabilities', domain, ontologyMode],
    fetchArtVariableProbabilities,
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

  const missingAuctionVariables =
    data?.missingVariables.filter(name => AUCTION_VARIABLES.has(name)) ?? []

  return (
    <div className="panel regime-panel">
      <div className="panel-label has-tip">
        regime_state{data ? ' · current' : ' · loading...'}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Art regime variables for the current evidence cycle. Each variable
          shows the system&apos;s posterior state (TRUE/FALSE) and the probability
          assigned to that state. Variables near 0.50 are genuinely uncertain.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          paddingBottom: 6,
        }}
      >
        {REGIME_LABELS.map(label => (
          <span
            key={label}
            style={{
              color: 'var(--text-dim)',
              border: '1px solid var(--border)',
              background: 'var(--black)',
              fontSize: 9,
              letterSpacing: '0.08em',
              padding: '2px 5px',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {missingAuctionVariables.length > 0 && (
        <div
          style={{
            color: 'var(--red-dim)',
            border: '1px solid var(--red-dim)',
            background: 'rgba(255, 61, 61, 0.08)',
            fontSize: 10,
            lineHeight: 1.4,
            marginBottom: 6,
            padding: '6px 8px',
          }}
        >
          data_quality_warning · auction-driven variables missing/null:{' '}
          {missingAuctionVariables.map(name => VAR_LABELS[name]).join(', ')}
        </div>
      )}

      <div className="regime-var-list">
        {!data && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading...</div>
        )}

        {data && VARIABLE_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'contents' }}>
            <div
              style={{
                color: 'var(--text-dark)',
                fontSize: 9,
                letterSpacing: '0.12em',
                padding: '5px 2px 2px',
                textTransform: 'uppercase',
              }}
            >
              {group.label}
            </div>

            {group.variables.map(name => {
              const prob = data.probabilities[name]
              const isMissing = prob === null
              const state = !isMissing && prob >= 0.5

              const stateClass = state ? 'state-true' : 'state-false'
              const isHighConf = !isMissing && prob >= 0.70
              const fillClass = state
                ? (isHighConf ? 'regime-prob-fill--true-hi' : 'regime-prob-fill--true-lo')
                : 'regime-prob-fill--false'
              const probColor = state
                ? (isHighConf ? 'var(--green)' : 'var(--text-mid)')
                : 'var(--text-faint)'

              return (
                <div key={name} className="regime-var-row">
                  <div className="regime-var-name">{VAR_LABELS[name]}</div>

                  <div className={`regime-var-badge ${stateClass}`}>
                    {isMissing ? 'NULL' : state ? 'TRUE' : 'FALSE'}
                  </div>

                  <div className="regime-var-prob-wrap">
                    <div className="regime-prob-track">
                      <div
                        className={`regime-prob-fill ${fillClass}`}
                        style={{ width: isMissing ? '0%' : `${(prob * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <div className="regime-prob-num" style={{ color: probColor }}>
                      {isMissing ? '--' : prob.toFixed(2)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
