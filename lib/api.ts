import type {
  Domain,
  OntologyMode,
  PopulationStatus,
  CandidatesResponse,
  QueryRequest,
  InferenceResponse,
  LineageResponse,
  ShiftsResponse,
  EvidenceResponse,
  EntropyDebugResponse,
  MrEvidenceResponse,
} from './types'
import { MOCK } from './mockData'

// ─── Mock-lookup helper ───────────────────────────────────────────────────────
// Returns the mock entry for ng; undefined for any domain without a mock.
// All fetchers branch on this: if no mock, use getRequired so
// that API failures surface as visible errors rather than silently falling back.
type MockKey = keyof typeof MOCK
function mockFor(domain: Domain) {
  return (MOCK as Record<string, typeof MOCK[MockKey] | undefined>)[domain]
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

// ─── Generic helpers ─────────────────────────────────────────────────────────

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

async function postWithoutBody(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

async function getRequired<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

// ─── Domain-keyed fetchers (used as SWR fetchers) ────────────────────────────
// Each function is the SWR key — SWR will call it as fetcher([key, domain]).

export async function triggerIngest(domain: Domain): Promise<void> {
  return postWithoutBody(`/v1/ingest/trigger?domain=${encodeURIComponent(domain)}`)
}

export async function fetchPopulationStatus(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<PopulationStatus> {
  const m = mockFor(domain)
  return m
    ? get(`/v1/population/status?domain=${domain}&ontology_mode=${mode}`, m.status)
    : getRequired(`/v1/population/status?domain=${domain}&ontology_mode=${mode}`)
}

export async function fetchCandidates(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<CandidatesResponse> {
  const m = mockFor(domain)
  return m
    ? get(`/v1/population/candidates?domain=${domain}&ontology_mode=${mode}`, m.candidates)
    : getRequired(`/v1/population/candidates?domain=${domain}&ontology_mode=${mode}`)
}

export async function fetchInferenceQuery(
  [, req]: [string, QueryRequest],
): Promise<InferenceResponse> {
  const m = mockFor(req.domain as Domain)
  return m
    ? post('/v1/inference/query', req, m.inference)
    : (async () => {
        const res = await fetch(`${API_BASE}/v1/inference/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(req),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as InferenceResponse
      })()
}

export async function fetchLineage(
  [, domain, candidateId, mode]: [string, Domain, string, OntologyMode],
): Promise<LineageResponse> {
  const m = mockFor(domain)
  return m
    ? get(`/v1/population/lineage/${encodeURIComponent(candidateId)}?domain=${domain}&ontology_mode=${mode}`, m.lineage)
    : getRequired(`/v1/population/lineage/${encodeURIComponent(candidateId)}?domain=${domain}&ontology_mode=${mode}`)
}

export async function fetchPopulationShifts(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<ShiftsResponse> {
  return getRequired(`/v1/population/shifts?domain=${encodeURIComponent(domain)}&ontology_mode=${mode}`)
}

export async function fetchRecentEvidence(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<EvidenceResponse> {
  const m = mockFor(domain)
  return m
    ? get(`/v1/evidence/recent?domain=${domain}&ontology_mode=${mode}`, m.evidence)
    : getRequired(`/v1/evidence/recent?domain=${domain}&ontology_mode=${mode}`)
}

// ─── MR-specific: regime state (no mock — errors surface visibly) ─────────────
export async function fetchMrRegimeState(
  [, domain, mode]: [string, Domain, OntologyMode],
): Promise<MrEvidenceResponse> {
  return getRequired(`/v1/evidence/recent?domain=${domain}&ontology_mode=${mode}`)
}

export async function fetchEntropyDebug(domain: Domain): Promise<EntropyDebugResponse> {
  return getRequired(`/v1/debug/entropy?domain=${encodeURIComponent(domain)}`)
}
