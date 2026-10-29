import type {
  Domain,
  PopulationStatus,
  CandidatesResponse,
  QueryRequest,
  InferenceResponse,
  ShiftsResponse,
  EvidenceResponse,
  EntropyDebugResponse,
  DomainReport,
  DomainReportEmpty,
  CasesResponse,
  TrendsResponse,
  TrendListName,
} from './types'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

// ─── Transport ───────────────────────────────────────────────────────────────
// Every failure throws. Panels render SWR's error state; a fallback value here
// would show made-up numbers as if they were the engine's.

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} · ${path}`)
  return (await res.json()) as T
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    // A Content-Type on a bodyless POST would force a CORS preflight for nothing.
    headers: body === undefined
      ? { Accept: 'application/json' }
      : { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().then(b => b?.detail, () => undefined)
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status} · ${path}`)
  }
  return (await res.json()) as T
}

const q = encodeURIComponent

// ─── SWR fetchers ────────────────────────────────────────────────────────────
// Each takes the SWR key tuple [name, domain].

export async function triggerIngest(domain: Domain): Promise<void> {
  await post(`/v1/ingest/trigger?domain=${q(domain)}`)
}

export async function fetchPopulationStatus(
  [, domain]: [string, Domain],
): Promise<PopulationStatus> {
  return get(`/v1/population/status?domain=${q(domain)}`)
}

export async function fetchCandidates(
  [, domain]: [string, Domain],
): Promise<CandidatesResponse> {
  return get(`/v1/population/candidates?domain=${q(domain)}`)
}

export async function fetchInferenceQuery(
  [, req]: [string, QueryRequest],
): Promise<InferenceResponse> {
  return queryInference(req)
}

/** One posterior query: a POST that runs inference on the engine. */
export async function queryInference(req: QueryRequest): Promise<InferenceResponse> {
  return post('/v1/inference/query', req)
}

export async function fetchPopulationShifts(
  [, domain]: [string, Domain],
): Promise<ShiftsResponse> {
  return get(`/v1/population/shifts?domain=${q(domain)}`)
}

export async function fetchRecentEvidence(
  [, domain]: [string, Domain],
): Promise<EvidenceResponse> {
  return get(`/v1/evidence/recent?domain=${q(domain)}`)
}

export async function fetchEntropyDebug(domain: Domain): Promise<EntropyDebugResponse> {
  return get(`/v1/debug/entropy?domain=${q(domain)}`)
}

export async function fetchCases(
  [, domain]: [string, Domain],
): Promise<CasesResponse> {
  return get(`/v1/cases?domain=${q(domain)}`)
}

export async function fetchTrends(
  [, domain]: [string, Domain],
): Promise<TrendsResponse> {
  return get(`/v1/trends?domain=${q(domain)}`)
}

// ─── Reports ─────────────────────────────────────────────────────────────────

// A domain's report, or with LIST one of its trend lists' reports (engine D30).
function reportPath(domain: Domain, list?: TrendListName): string {
  return list ? `/v1/trends/${q(domain)}/${q(list)}/report` : `/v1/report/${q(domain)}`
}

export async function fetchCachedReport(
  [, domain, list]: [string, Domain, TrendListName?],
): Promise<DomainReport | DomainReportEmpty> {
  // The engine answers {found: false} when nothing is cached yet.
  return get(reportPath(domain, list))
}

export async function refreshReport(domain: Domain, list?: TrendListName): Promise<DomainReport> {
  return post(`${reportPath(domain, list)}/refresh`)
}
