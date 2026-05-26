// ─── Shared ──────────────────────────────────────────────────────────────────
export type Domain = 'ng' | 'zc' | 'zs' | 'mr' | 'ai'

// ─── GET /v1/population/status → EpistemicStateBar ───────────────────────────
export interface PopulationStatus {
  domain: string
  structure_entropy: number
  active_candidates: number
  max_candidates: number
  current_generation: number
  dominant_hypothesis: {
    name: string
    candidate_id: string
    generations_dominant: number
  }
  paradigm_shifts_this_window: number
  frontier_edge_count: number
  last_evidence_cycle_ago: string
  engine_status: 'online' | 'degraded' | 'offline'
}

// ─── GET /v1/population/candidates → OntologyPopulation ──────────────────────
export interface Candidate {
  id: string
  name: string
  log_score: number
  evidence_count: number
  generation_introduced: number
  edge_count: number
  status: 'dominant' | 'rising' | 'falling' | 'neutral'
  /** Normalised 0–1 for bar width rendering */
  score_normalized: number
}

export interface CandidatesResponse {
  domain: string
  generation: number
  candidates: Candidate[]
}

// ─── POST /v1/inference/query → BeliefGraph + EdgeExistencePanel ──────────────
export interface QueryRequest {
  domain: string
  target_variable: string
  candidate_id?: string
  conditions?: Record<string, unknown>
  aggregation?: 'weighted_avg' | 'map' | 'marginal'
}

export interface GraphNode {
  id: string
  label: string
  probability?: number
  /** For observed/given nodes (e.g. "↓2.1σ") */
  observation?: string
  status: 'established' | 'exploring' | 'weak' | 'target'
}

export interface GraphEdge {
  source: string
  target: string
  probability: number
  status: 'strong' | 'explore' | 'weak'
}

export interface FrontierEdge {
  relation: string
  source: string
  target: string
  probability: number
  note: string
  explore_weight?: number
}

export interface InferenceResponse {
  candidate_id: string
  target_variable: string
  target_probability: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  frontier_edges: FrontierEdge[]
}

// ─── GET /v1/population/lineage/{id} → ParadigmShiftTimeline ─────────────────
export interface LineageEvent {
  generation: number
  event_type: 'shift' | 'introduce' | 'milestone' | 'current'
  description: string
  dominant_after?: string
}

export interface LineageResponse {
  domain: string
  candidate_id: string
  events: LineageEvent[]
}

// ─── GET /v1/population/shifts → ParadigmShiftTimeline ──────────────────────
export interface ShiftEvent {
  shift_id: string
  generation: number
  timestamp: string
  previous_dominant_name: string
  new_dominant_name: string
  evidence_count_at_shift: number
}

export interface ShiftsResponse {
  domain: string
  total_shifts: number
  events: ShiftEvent[]
}

// ─── GET /v1/evidence/recent → EvidenceStream ────────────────────────────────
export interface EvidenceRecord {
  id: string
  timestamp: string
  description: string
  impact_delta: number
  strength: 'strong' | 'shift' | 'weak'
  variables_updated?: number
}

export interface EvidenceResponse {
  domain: string
  records: EvidenceRecord[]
}

// ─── GET /v1/evidence/recent?domain=mr → RegimeStatePanel ────────────────────
export type MrVariableName =
  | 'YieldCurveInverted'
  | 'InflationShock'
  | 'LiquidityStress'
  | 'CreditSpreadStress'
  | 'VolatilityShock'
  | 'DollarStrength'
  | 'EquityRiskOn'
  | 'AIRiskOn'

export interface MrRegimeVariable {
  state: boolean
  probability: number
}

export interface MrEvidenceRecord {
  id: string
  timestamp: string
  variables: Partial<Record<MrVariableName, MrRegimeVariable>>
}

export interface MrEvidenceResponse {
  domain: string
  records: MrEvidenceRecord[]
}

// ─── GET /v1/evidence/recent?domain=ai → AiRegimeStatePanel ──────────────────
export type AiVariableName =
  | 'SemiconductorMomentum'
  | 'MarketConcentrationExtreme'
  | 'HyperscalerCapexAccelerating'
  | 'TechValuationDetached'
  | 'IPInvestmentRising'
  | 'LaborProductivityImproving'
  | 'BroadEconomicLift'
  | 'AIRiskPremiumCompressed'

// ─── GET /v1/debug/entropy → console diagnostics ────────────────────────────
export interface VariableEntropyDebug {
  value_counts: Record<string, number>
  observed_count: number
  missing_count: number
  entropy: number
}

export interface ObservedPatternDebug {
  pattern: Record<string, unknown>
  count: number
}

export interface PairwiseMutualInformationDebug {
  variable_x: string
  variable_y: string
  joint_observed_count: number
  mutual_information: number
}

export interface EntropyDebugResponse {
  domain: string
  domain_key: Domain
  domain_module_id: string
  total_evidence_rows: number
  variables: Record<string, VariableEntropyDebug>
  unique_observed_patterns: ObservedPatternDebug[]
  pairwise_mutual_information: PairwiseMutualInformationDebug[]
}
