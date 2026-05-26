# Missing / Unverified Endpoints

The backend repository (`../probabilistic-ontology-engine`) was not present at
build time. All five wired endpoints are therefore **stubbed** — the frontend
falls back to realistic mock data (see `lib/mockData.ts`) whenever the API
returns an error or is unreachable.

| Endpoint | Component(s) | Status |
|----------|-------------|--------|
| `GET /v1/population/status` | `EpistemicStateBar` | ⚠ stubbed — mock used |
| `GET /v1/population/candidates` | `OntologyPopulation` | ⚠ stubbed — mock used |
| `POST /v1/inference/query` | `BeliefGraph`, `EdgeExistencePanel`, `ExplorationFrontier` | ⚠ stubbed — mock used |
| `GET /v1/population/lineage/{id}` | `ParadigmShiftTimeline` | ⚠ stubbed — mock used |
| `GET /v1/evidence/recent` | `EvidenceStream` | ⚠ stubbed — mock used |

## Expected query parameters

The frontend appends `?domain=ng` or `?domain=zc` to every GET endpoint.
Confirm the backend honours this query param (or adapt `lib/api.ts` to use a
path prefix instead).

## POST /v1/inference/query — expected request body

```json
{
  "domain": "ng",
  "target_variable": "price_up",
  "candidate_id": "cand-004",
  "conditions": {},
  "aggregation": "weighted_avg"
}
```

## Expected response shapes

See `lib/types.ts` for the full TypeScript interface definitions that the
frontend expects. The mock data in `lib/mockData.ts` is canonical sample data
matching those shapes.

## When the backend ships

1. Deploy the backend to Railway and set `NEXT_PUBLIC_API_BASE_URL` in Vercel.
2. Remove mock fallbacks from `lib/api.ts` once all endpoints are live (or
   keep them — they serve as a safe offline-mode fallback).
3. Cross-check the actual response JSON keys against `lib/types.ts` and
   update the types if needed.
