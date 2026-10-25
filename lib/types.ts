// ─── Shared ──────────────────────────────────────────────────────────────────
export type Domain =
  | 'mr'
  | 'ai'
  | 'ng'
  | 'sd'
  | 'cc'
  | 'er'
  | 'lm'
  | 'cr'
  | 'gp'
  | 'sf'
  | 'art'

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
    /** Null when the engine's shift log cannot say when the leader took over. */
    generations_dominant: number | null
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
  /** The target's degree, 0 to 1: P(True) for a yes/no, mean level for a graded signal. */
  degree?: number | null
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
  /** Most likely value: a level (low/mid/high) or "True"/"False" for a yes/no. */
  target_level: string | null
  /** 0 to 1: P(True) for a yes/no, mean position from low to high for levels (engine D25). */
  target_degree: number | null
  target_distribution: Record<string, number>
  nodes: GraphNode[]
  edges: GraphEdge[]
  frontier_edges: FrontierEdge[]
}

// ─── GET /v1/population/shifts → ParadigmShiftTimeline ──────────────────────
export interface ShiftEvent {
  shift_id: string
  generation: number
  /** When the engine recorded the shift (server clock, ISO). */
  timestamp: string
  previous_dominant_name: string
  new_dominant_name: string
  evidence_count_at_shift: number
  // The fields below are absent from older engines and null on shifts
  // recorded before the engine kept them.
  /** YYYY-MM-DD of the evidence that caused the shift. */
  evidence_date?: string | null
  /** Research programme of each leader: the pair it was founded on, e.g. "InflationShock_prev–InflationShock". */
  previous_programme?: string | null
  new_programme?: string | null
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

// ─── POST /v1/inference/query → ArtRegimeStatePanel ──────────────────────────
export type ArtVariableName =
  | 'InstitutionalRiskAversion'
  | 'MuseumFigurativeAcceptance'
  | 'ConceptualDominance'
  | 'AIArtInstitutionalAcceptance'
  | 'CuratorialMaterialityShift'
  | 'CraftPrestigeRising'
  | 'PrestigeFragmentation'
  | 'RegionalSceneMomentum'
  | 'BlueChipInstitutionalCapture'
  | 'BiennialFatigue'
  | 'MuseumAcquisitionMomentum'
  | 'BlueChipConcentration'
  | 'AuctionSpeculationElevated'
  | 'CollectorFlightToSafety'
  | 'FigurativeAuctionMomentum'
  | 'EmergingMarketLiquidity'
  | 'MarketPolarization'
  | 'MarketUncertainty'
  | 'RitualAuraPremium'
  | 'EmbodimentDiscourseRising'
  | 'AntiDigitalSentiment'
  | 'AIImageSaturation'
  | 'AuthenticityPremium'
  | 'NeoAcademicResurgence'
  | 'AttentionFragmentation'

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

// ─── GET /v1/report/{domain} and POST /v1/report/{domain}/refresh ────────────
export interface DomainReport {
  found: true
  domain: string
  generated_at: string
  snapshot_hash: string
  report: string
  cached: boolean
  regenerated: boolean
  stale: boolean
}

export interface DomainReportEmpty {
  found: false
  domain: string
}

