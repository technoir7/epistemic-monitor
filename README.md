# Epistemic State Monitor

Next.js 14 frontend dashboard for the probabilistic ontology engine.
Hacker-terminal aesthetic — CRT scanlines, VT323 headers, #00ff41 on #030a03.

---

## Local development

### Prerequisites
- Node 20+
- npm 10+
- (Optional) A running instance of `probabilistic-ontology-engine` at port 8000

### Setup

```bash
git clone <this-repo>
cd epistemic-monitor

npm install

# Copy the env template and edit if needed
cp .env.local.example .env.local
# NEXT_PUBLIC_API_BASE_URL defaults to http://localhost:8000 if unset

npm run dev
# → http://localhost:3000
```

If the backend is not running the dashboard still works — every endpoint falls
back to realistic mock data automatically (see `MISSING_ENDPOINTS.md`).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Base URL of the POE backend |

---

## Architecture

```
app/
  layout.tsx          Root layout — loads VT323 + Share Tech Mono fonts
  globals.css         Full design token set + component CSS (ported from HTML reference)
  page.tsx            Dashboard page — domain switcher, always-on dual polling

components/
  EpistemicStateBar.tsx     5-metric status row — GET /v1/population/status
  BeliefGraph.tsx           D3 force-directed belief graph — POST /v1/inference/query
  OntologyPopulation.tsx    Candidate list with bars — GET /v1/population/candidates
  EdgeExistencePanel.tsx    Edge probability bars — POST /v1/inference/query
  EvidenceStream.tsx        Scrolling evidence feed — GET /v1/evidence/recent
  ParadigmShiftTimeline.tsx Horizontal shift history — GET /v1/population/lineage/{id}
  ExplorationFrontier.tsx   Unresolved edge chips — POST /v1/inference/query
  PromptLine.tsx            Bottom prompt decoration

lib/
  types.ts     TypeScript interfaces for all API shapes
  api.ts       SWR-compatible fetchers with mock fallback
  mockData.ts  Realistic NG + ZC mock data
```

### Polling

All components use SWR with `refreshInterval: 30_000` (30 s).

Both domain panels (NG, ZC) are **always mounted** — they use
`display: contents` / `display: none` to toggle visibility.
This means SWR polls both tabs in the background simultaneously,
preserving independent polling state when you switch tabs.

---

## Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Set the environment variable in the Vercel dashboard:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://your-poe-backend.railway.app
   ```
4. Deploy. Vercel auto-detects Next.js 14 — no build config needed.

### Notes for the Railway backend

- The POE backend should accept CORS from the Vercel domain.
- The `NEXT_PUBLIC_API_BASE_URL` must be set **before** the Vercel build runs,
  as it is inlined at build time (`NEXT_PUBLIC_*` prefix).

---

## Design tokens

| Token | Value |
|-------|-------|
| Background | `#030a03` |
| Primary green | `#00ff41` |
| Dim green | `#00882a` |
| Header font | VT323 |
| Body/data font | Share Tech Mono |
| CRT scanlines | `repeating-linear-gradient` overlay, z-index 999 |
| Prompt line | fixed at bottom of main grid |
# epistemic-monitor
