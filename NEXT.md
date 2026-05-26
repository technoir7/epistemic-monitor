# NEXT — remaining work

## Priority 1 — backend integration

- [ ] Deploy `probabilistic-ontology-engine` to Railway
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in Vercel env
- [ ] Validate all five endpoint shapes against `lib/types.ts`
- [ ] Add CORS header to backend for Vercel domain
- [ ] Cross-check mock data assumptions with real SPEC.md Section 14

## Priority 2 — real-time evidence

- [ ] Switch `EvidenceStream` from polling to WebSocket/SSE when backend supports push
- [ ] Animate new rows sliding in from top (extend `fadeIn` keyframe + translateY)
- [ ] Cap stream at 12 rows with FIFO eviction (matching the HTML reference script)

## Priority 3 — interactivity

- [ ] Clicking a candidate row in `OntologyPopulation` should:
  - Switch `BeliefGraph` and `EdgeExistencePanel` to show that candidate's graph
  - Highlight the selected row
  - Trigger a new inference query with `candidate_id` set
- [ ] BeliefGraph: hover a node → show tooltip with full variable name + probability
- [ ] BeliefGraph: click an edge → open EdgeExistencePanel detail for that edge
- [ ] Prompt line: make it an actual functional query input (POST to inference)

## Priority 4 — UX polish

- [ ] Responsive layout for smaller viewports (collapse sidebar, stack panels)
- [ ] Loading skeleton that matches the panel geometry (not just "loading…" text)
- [ ] Error state indicator when API returns non-2xx (distinguish from mock)
- [ ] `EpistemicStateBar`: animate value changes with a brief flash/highlight
- [ ] `BeliefGraph`: smooth node transition when data refreshes (don't re-init simulation from scratch)

## Priority 5 — ops / deployment

- [ ] Add `vercel.json` with framework preset if auto-detection issues arise
- [ ] Set up Vercel preview deploys with a staging `NEXT_PUBLIC_API_BASE_URL`
- [ ] Add health check: `GET /v1/health` → status indicator in header
- [ ] Error boundary around each panel so one failing component doesn't crash the page
- [ ] Add Sentry or equivalent for client-side error tracking

## Priority 6 — additional domains

- [ ] Backend `/v1/domains` endpoint → populate tab list dynamically
- [ ] Remove hardcoded `['ng', 'zc']` domain list
- [ ] Support adding domains via the `+` tab (modal / form)

## Technical debt

- [ ] `display: contents` visibility trick has edge cases in some browsers — audit
- [ ] `lib/api.ts`: catch-and-mock strategy silently swallows real API errors; add error reporting
- [ ] SWR key for `fetchInferenceQuery` serialises the full `QueryRequest` object — consider stable string key
- [ ] Tailwind `preflight: false` means some browser defaults leak through — audit
