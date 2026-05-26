# Frontend Snapshot — 2026-05-24

## Status: initial scaffold complete

All seven components built, wired to SWR, mock data in place.
Dashboard renders with full CRT aesthetic. D3 force graph live.

---

## What is built

### Pages
- `/` — single dashboard page with NG / ZC domain switcher
  - Both tabs poll independently (always-mounted, CSS visibility toggled)
  - 30-second SWR refresh interval on all data hooks
  - Live UTC clock in header

### Components

| Component | File | Data source | Notes |
|-----------|------|-------------|-------|
| EpistemicStateBar | `components/EpistemicStateBar.tsx` | GET /v1/population/status | 5 metrics row spanning 2 cols |
| BeliefGraph | `components/BeliefGraph.tsx` | POST /v1/inference/query | D3 force-directed, lazy-loaded |
| OntologyPopulation | `components/OntologyPopulation.tsx` | GET /v1/population/candidates | Right sidebar, rows 1–4 |
| EdgeExistencePanel | `components/EdgeExistencePanel.tsx` | POST /v1/inference/query | Shares SWR key with BeliefGraph |
| EvidenceStream | `components/EvidenceStream.tsx` | GET /v1/evidence/recent | Scrollable, fade-in animation |
| ParadigmShiftTimeline | `components/ParadigmShiftTimeline.tsx` | GET /v1/population/lineage/{id} | Horizontal dots timeline |
| ExplorationFrontier | `components/ExplorationFrontier.tsx` | POST /v1/inference/query | Chip array of unresolved edges |
| PromptLine | `components/PromptLine.tsx` | static | Bottom decoration, blink cursor |

### Infrastructure
- Next.js 14 app router, TypeScript strict mode
- Tailwind CSS (preflight disabled to avoid conflicts with hand-rolled CSS)
- Google Fonts loaded via `next/font/google`: VT323 + Share Tech Mono
- SWR 2.x for all polling
- D3 v7 lazy-imported inside `useEffect` (avoids SSR issues)
- All API calls proxied through `NEXT_PUBLIC_API_BASE_URL`
- Mock fallback for every endpoint (see `lib/mockData.ts`)

### Design fidelity
- CSS custom properties match the HTML reference exactly
- CRT scanline overlay (z-index 999, pointer-events: none)
- Radial vignette overlay
- VT323 for all large numbers and headers
- Share Tech Mono for body/data text
- Blinking cursor animation
- Pulsing "now" dot on timeline
- Bar fills with correct glow on dominant candidate

---

## Mock data domains

- **NG (natural_gas)**: storage-temperature dominant, gen 12, 7 candidates, 4 frontier edges
- **ZC (corn)**: weather-yield dominant, gen 8, 5 candidates, 3 frontier edges

---

## Known gaps / see NEXT.md

- Backend not yet deployed — all data is mock
- No real-time evidence stream push (polling only)
- No click-through from candidate rows to detail views
- No mobile responsive layout
- No authentication
