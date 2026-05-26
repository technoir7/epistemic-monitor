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

// ─── ZC (corn) ───────────────────────────────────────────────────────────────

export const ZC_STATUS: PopulationStatus = {
  domain: 'corn',
  structure_entropy: 0.43,
  active_candidates: 5,
  max_candidates: 10,
  current_generation: 8,
  dominant_hypothesis: {
    name: 'weather-yield',
    candidate_id: 'cand-003',
    generations_dominant: 4,
  },
  paradigm_shifts_this_window: 1,
  frontier_edge_count: 3,
  last_evidence_cycle_ago: '2h',
  engine_status: 'online',
}

export const ZC_CANDIDATES: CandidatesResponse = {
  domain: 'corn',
  generation: 8,
  candidates: [
    {
      id: 'cand-003',
      name: 'weather-yield',
      log_score: -8.2,
      evidence_count: 642,
      generation_introduced: 4,
      edge_count: 4,
      status: 'dominant',
      score_normalized: 0.91,
    },
    {
      id: 'cand-005',
      name: 'weather + export',
      log_score: -11.3,
      evidence_count: 189,
      generation_introduced: 1,
      edge_count: 5,
      status: 'rising',
      score_normalized: 0.72,
    },
    {
      id: 'cand-002',
      name: 'export-demand',
      log_score: -16.4,
      evidence_count: 892,
      generation_introduced: 7,
      edge_count: 3,
      status: 'neutral',
      score_normalized: 0.41,
    },
    {
      id: 'cand-001',
      name: 'fuel-ethanol',
      log_score: -21.8,
      evidence_count: 1101,
      generation_introduced: 6,
      edge_count: 2,
      status: 'falling',
      score_normalized: 0.21,
    },
    {
      id: 'cand-000',
      name: 'null — minimal',
      log_score: -29.1,
      evidence_count: 642,
      generation_introduced: 8,
      edge_count: 1,
      status: 'neutral',
      score_normalized: 0.06,
    },
  ],
}

export const ZC_INFERENCE: InferenceResponse = {
  candidate_id: 'cand-003',
  target_variable: 'price_up',
  target_probability: 0.68,
  nodes: [
    { id: 'precip_anom', label: 'PRECIP_ANOM', status: 'established', observation: '−1.4σ' },
    { id: 'usda_export',  label: 'USDA_EXPORT',  status: 'exploring' },
    { id: 'yield_est',   label: 'YIELD_EST',   status: 'established', probability: 0.79 },
    { id: 'ethanol_dem', label: 'ETHANOL_DEM', status: 'weak',        probability: 0.31 },
    { id: 'price_up',    label: 'PRICE_UP',    status: 'target',      probability: 0.68 },
  ],
  edges: [
    { source: 'precip_anom', target: 'yield_est',   probability: 0.89, status: 'strong' },
    { source: 'yield_est',   target: 'price_up',    probability: 0.83, status: 'strong' },
    { source: 'usda_export',  target: 'price_up',    probability: 0.54, status: 'explore' },
    { source: 'ethanol_dem', target: 'price_up',    probability: 0.31, status: 'weak' },
  ],
  frontier_edges: [
    { relation: 'usda_export → price_up',    source: 'usda_export',  target: 'price_up',  probability: 0.54, note: 'high explore weight',  explore_weight: 0.7 },
    { relation: 'brazil_crop → yield_est',   source: 'brazil_crop',  target: 'yield_est', probability: 0.41, note: 'proposed gen 7' },
    { relation: 'ethanol_policy → ethanol_dem', source: 'ethanol_policy', target: 'ethanol_dem', probability: 0.36, note: 'mutual info trigger' },
  ],
}

export const ZC_LINEAGE: LineageResponse = {
  domain: 'corn',
  candidate_id: 'cand-003',
  events: [
    { generation: 1, event_type: 'shift',     description: 'fuel-ethanol\ndominant',   dominant_after: 'fuel-ethanol' },
    { generation: 3, event_type: 'milestone', description: 'export-demand\nrises' },
    { generation: 5, event_type: 'shift',     description: 'shift →\nexport-demand',   dominant_after: 'export-demand' },
    { generation: 6, event_type: 'introduce', description: 'weather-yield\nintroduced' },
    { generation: 7, event_type: 'shift',     description: 'shift →\nweather-yield',   dominant_after: 'weather-yield' },
    { generation: 8, event_type: 'current',   description: 'now\nwatching exports' },
  ],
}

export const ZC_EVIDENCE: EvidenceResponse = {
  domain: 'corn',
  records: [
    { id: 'ev-1', timestamp: '10:30', description: 'USDA weekly export sales: 842k MT (above est)',      impact_delta:  0.05, strength: 'strong' },
    { id: 'ev-2', timestamp: '10:30', description: 'NOAA drought monitor: 34% of belt abnormally dry',   impact_delta:  0.04, strength: 'strong' },
    { id: 'ev-3', timestamp: '08:00', description: 'Brazil safrinha crop: −2.1% vs 30d forecast',        impact_delta:  0.03, strength: 'shift' },
    { id: 'ev-4', timestamp: '08:00', description: 'ethanol grind: 1.08M bbl/d (in range)',               impact_delta:  0.01, strength: 'weak' },
    { id: 'ev-5', timestamp: 'prev',  description: 'CFTC managed money: net long +4.2k contracts',        impact_delta:  0.02, strength: 'weak' },
    { id: 'ev-6', timestamp: 'prev',  description: 'USDA crop progress: 68% good/excellent vs 71% exp',  impact_delta:  0.06, strength: 'strong' },
    { id: 'ev-7', timestamp: 'prev',  description: 'basis: Gulf +12 HRW, in-line with model',             impact_delta:  0.00, strength: 'weak' },
  ],
}

// ─── ZS (soybeans) ──────────────────────────────────────────────────────────

export const ZS_STATUS: PopulationStatus = {
  domain: 'soybeans',
  structure_entropy: 0.49,
  active_candidates: 3,
  max_candidates: 10,
  current_generation: 6,
  dominant_hypothesis: {
    name: 'W*',
    candidate_id: 'cand-w',
    generations_dominant: 2,
  },
  paradigm_shifts_this_window: 1,
  frontier_edge_count: 3,
  last_evidence_cycle_ago: '45m',
  engine_status: 'online',
}

export const ZS_CANDIDATES: CandidatesResponse = {
  domain: 'soybeans',
  generation: 6,
  candidates: [
    {
      id: 'cand-w',
      name: 'W*',
      log_score: -9.6,
      evidence_count: 511,
      generation_introduced: 3,
      edge_count: 4,
      status: 'dominant',
      score_normalized: 0.87,
    },
    {
      id: 'cand-d',
      name: 'D*',
      log_score: -12.8,
      evidence_count: 276,
      generation_introduced: 5,
      edge_count: 4,
      status: 'rising',
      score_normalized: 0.66,
    },
    {
      id: 'cand-null',
      name: 'Null',
      log_score: -25.7,
      evidence_count: 511,
      generation_introduced: 6,
      edge_count: 1,
      status: 'neutral',
      score_normalized: 0.09,
    },
  ],
}

export const ZS_INFERENCE: InferenceResponse = {
  candidate_id: 'cand-w',
  target_variable: 'SoyPriceUp',
  target_probability: 0.71,
  nodes: [
    { id: 'PlantingDelayed',   label: 'PlantingDelayed',   status: 'established', observation: '+1.2σ' },
    { id: 'DroughtIndex',      label: 'DroughtIndex',      status: 'exploring' },
    { id: 'YieldForecastDown', label: 'YieldForecastDown', status: 'established', probability: 0.76 },
    { id: 'ExportDemandHigh',  label: 'ExportDemandHigh',  status: 'weak',        probability: 0.34 },
    { id: 'SoyPriceUp',        label: 'SoyPriceUp',        status: 'target',      probability: 0.71 },
  ],
  edges: [
    { source: 'PlantingDelayed',   target: 'YieldForecastDown', probability: 0.82, status: 'strong' },
    { source: 'DroughtIndex',      target: 'YieldForecastDown', probability: 0.56, status: 'explore' },
    { source: 'YieldForecastDown', target: 'SoyPriceUp',        probability: 0.86, status: 'strong' },
    { source: 'ExportDemandHigh',  target: 'SoyPriceUp',        probability: 0.34, status: 'weak' },
  ],
  frontier_edges: [
    { relation: 'DroughtIndex → YieldForecastDown',     source: 'DroughtIndex',     target: 'YieldForecastDown', probability: 0.56, note: 'high explore weight', explore_weight: 0.72 },
    { relation: 'ExportDemandHigh → SoyPriceUp',        source: 'ExportDemandHigh', target: 'SoyPriceUp',        probability: 0.34, note: 'export residual' },
    { relation: 'PlantingDelayed → ExportDemandHigh',   source: 'PlantingDelayed',  target: 'ExportDemandHigh',  probability: 0.38, note: 'mutual info trigger' },
  ],
}

export const ZS_LINEAGE: LineageResponse = {
  domain: 'soybeans',
  candidate_id: 'cand-w',
  events: [
    { generation: 1, event_type: 'shift',     description: 'Null\ndominant', dominant_after: 'Null' },
    { generation: 2, event_type: 'introduce', description: 'D*\nintroduced' },
    { generation: 3, event_type: 'milestone', description: 'D*\nrises' },
    { generation: 4, event_type: 'introduce', description: 'W*\nintroduced' },
    { generation: 5, event_type: 'shift',     description: 'shift →\nW*',     dominant_after: 'W*' },
    { generation: 6, event_type: 'current',   description: 'now\nwatching drought' },
  ],
}

export const ZS_EVIDENCE: EvidenceResponse = {
  domain: 'soybeans',
  records: [
    { id: 'ev-1', timestamp: '11:00', description: 'USDA crop progress: PlantingDelayed +1.2σ vs 5y avg',      impact_delta:  0.06, strength: 'strong' },
    { id: 'ev-2', timestamp: '11:00', description: 'NOAA drought monitor: DroughtIndex rising in western belt', impact_delta:  0.04, strength: 'shift' },
    { id: 'ev-3', timestamp: '09:30', description: 'WASDE preview: YieldForecastDown probability increased',   impact_delta:  0.05, strength: 'strong' },
    { id: 'ev-4', timestamp: '08:00', description: 'weekly export inspections: ExportDemandHigh still weak',    impact_delta: -0.01, strength: 'weak' },
    { id: 'ev-5', timestamp: 'prev',  description: 'basis: Gulf soybeans steady, SoyPriceUp unchanged',         impact_delta:  0.00, strength: 'weak' },
    { id: 'ev-6', timestamp: 'prev',  description: 'private acreage survey: PlantingDelayed confirmed',         impact_delta:  0.03, strength: 'strong' },
    { id: 'ev-7', timestamp: 'prev',  description: 'meal demand in range; ExportDemandHigh not confirmed',      impact_delta:  0.00, strength: 'weak' },
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
  zc: {
    status: ZC_STATUS,
    candidates: ZC_CANDIDATES,
    inference: ZC_INFERENCE,
    lineage: ZC_LINEAGE,
    evidence: ZC_EVIDENCE,
  },
  zs: {
    status: ZS_STATUS,
    candidates: ZS_CANDIDATES,
    inference: ZS_INFERENCE,
    lineage: ZS_LINEAGE,
    evidence: ZS_EVIDENCE,
  },
} as const
