import type {
  PopulationStatus,
  CandidatesResponse,
  InferenceResponse,
  LineageResponse,
  EvidenceResponse,
} from './types'

// ─── NG (natural_gas) ────────────────────────────────────────────────────────

export const NG_STATUS: PopulationStatus = {
  domain: 'natural_gas',
  structure_entropy: 0.61,
  active_candidates: 7,
  max_candidates: 10,
  current_generation: 12,
  dominant_hypothesis: {
    name: 'storage-temperature',
    candidate_id: 'cand-004',
    generations_dominant: 3,
  },
  paradigm_shifts_this_window: 2,
  frontier_edge_count: 4,
  last_evidence_cycle_ago: '14m',
  engine_status: 'online',
}

export const NG_CANDIDATES: CandidatesResponse = {
  domain: 'natural_gas',
  generation: 12,
  candidates: [
    {
      id: 'cand-004',
      name: 'storage-temperature',
      log_score: -12.4,
      evidence_count: 847,
      generation_introduced: 3,
      edge_count: 5,
      status: 'dominant',
      score_normalized: 0.88,
    },
    {
      id: 'cand-007',
      name: 'storage-temp + wind',
      log_score: -14.1,
      evidence_count: 214,
      generation_introduced: 1,
      edge_count: 6,
      status: 'rising',
      score_normalized: 0.65,
    },
    {
      id: 'cand-002',
      name: 'demand-only',
      log_score: -18.7,
      evidence_count: 1203,
      generation_introduced: 9,
      edge_count: 3,
      status: 'neutral',
      score_normalized: 0.38,
    },
    {
      id: 'cand-001',
      name: 'lng-export-driven',
      log_score: -24.3,
      evidence_count: 1847,
      generation_introduced: 11,
      edge_count: 4,
      status: 'falling',
      score_normalized: 0.18,
    },
    {
      id: 'cand-000',
      name: 'null — minimal',
      log_score: -31.0,
      evidence_count: 847,
      generation_introduced: 12,
      edge_count: 1,
      status: 'neutral',
      score_normalized: 0.08,
    },
  ],
}

export const NG_INFERENCE: InferenceResponse = {
  candidate_id: 'cand-004',
  target_variable: 'price_up',
  target_probability: 0.74,
  nodes: [
    { id: 'temp_anom', label: 'TEMP_ANOM', status: 'established', observation: '↓2.1σ' },
    { id: 'wind_gen',  label: 'WIND_GEN',  status: 'exploring' },
    { id: 'heat_dem',  label: 'HEAT_DEM',  status: 'established', probability: 0.88 },
    { id: 'stor_draw', label: 'STOR_DRAW', status: 'established', probability: 0.81 },
    { id: 'lng_exp',   label: 'LNG_EXP',   status: 'weak',        probability: 0.24 },
    { id: 'price_up',  label: 'PRICE_UP',  status: 'target',      probability: 0.74 },
  ],
  edges: [
    { source: 'temp_anom', target: 'heat_dem',  probability: 0.92, status: 'strong' },
    { source: 'temp_anom', target: 'stor_draw', probability: 0.81, status: 'strong' },
    { source: 'heat_dem',  target: 'price_up',  probability: 0.88, status: 'strong' },
    { source: 'stor_draw', target: 'price_up',  probability: 0.94, status: 'strong' },
    { source: 'wind_gen',  target: 'price_up',  probability: 0.51, status: 'explore' },
    { source: 'lng_exp',   target: 'stor_draw', probability: 0.24, status: 'weak' },
  ],
  frontier_edges: [
    { relation: 'wind_gen → price_up',      source: 'wind_gen',      target: 'price_up',  probability: 0.51, note: 'high explore weight',  explore_weight: 0.8 },
    { relation: 'production_vol → stor_draw', source: 'production_vol', target: 'stor_draw', probability: 0.44, note: 'proposed gen 11' },
    { relation: 'industrial_dem → price_up', source: 'industrial_dem', target: 'price_up',  probability: 0.39, note: 'mutual info trigger' },
    { relation: 'pipeline_cap → heat_dem',  source: 'pipeline_cap',  target: 'heat_dem',  probability: 0.33, note: 'residual driven' },
  ],
}

export const NG_LINEAGE: LineageResponse = {
  domain: 'natural_gas',
  candidate_id: 'cand-004',
  events: [
    { generation: 1,  event_type: 'shift',     description: 'lng-export\ndominant',    dominant_after: 'lng-export' },
    { generation: 3,  event_type: 'milestone', description: 'demand-only\nrises' },
    { generation: 5,  event_type: 'shift',     description: 'shift →\ndemand-only',    dominant_after: 'demand-only' },
    { generation: 7,  event_type: 'introduce', description: 'stor-temp\nintroduced' },
    { generation: 9,  event_type: 'shift',     description: 'shift →\nstor-temp',      dominant_after: 'storage-temperature' },
    { generation: 11, event_type: 'introduce', description: 'wind variant\nintroduced' },
    { generation: 12, event_type: 'current',   description: 'now\nwatching wind' },
  ],
}

export const NG_EVIDENCE: EvidenceResponse = {
  domain: 'natural_gas',
  records: [
    { id: 'ev-1', timestamp: '14:22', description: 'EIA storage: −142 Bcf draw vs −118 expected',      impact_delta:  0.09, strength: 'strong' },
    { id: 'ev-2', timestamp: '14:22', description: 'NOAA 6-10d outlook: below normal temps 78%',        impact_delta:  0.06, strength: 'strong' },
    { id: 'ev-3', timestamp: '12:00', description: 'wind gen 34% below 7d avg · frontier activated',    impact_delta:  0.04, strength: 'shift' },
    { id: 'ev-4', timestamp: '09:30', description: 'LNG export: 13.2 Bcf/d (in range)',                 impact_delta: -0.01, strength: 'weak' },
    { id: 'ev-5', timestamp: '08:00', description: 'residential demand: 42.1 Bcf/d above forecast',     impact_delta:  0.02, strength: 'weak' },
    { id: 'ev-6', timestamp: 'prev',  description: 'NOAA actual: −2.1σ deviation confirmed',            impact_delta:  0.07, strength: 'strong' },
    { id: 'ev-7', timestamp: 'prev',  description: 'production: 102.4 Bcf/d within normal range',       impact_delta:  0.00, strength: 'weak' },
    { id: 'ev-8', timestamp: 'prev',  description: 'pipeline maintenance: minor, no capacity impact',   impact_delta:  0.00, strength: 'weak' },
  ],
}

// ─── Domain → Mock map ───────────────────────────────────────────────────────
export const MOCK = {
  ng: {
    status: NG_STATUS,
    candidates: NG_CANDIDATES,
    inference: NG_INFERENCE,
    lineage: NG_LINEAGE,
    evidence: NG_EVIDENCE,
  },
} as const
