## Context
The project map is `../probabilistic_ontology_engine/SNAPSHOT.md` (also on
GitHub in that repo): what the engine is, how it works, what is open.

## Design
Design tokens are the `:root` custom properties in app/globals.css.
Font stack: VT323 (headers/large numbers), Share Tech Mono (body/data).
Primary: #00ff41. Dim: #00882a. Background: #030a03.
Do not substitute. Do not soften the aesthetic.

## Data
Every panel reads the live engine (lib/api.ts). Fetch failures throw and the
panel shows an error state; never fall back to placeholder data.
Display names for engine identifiers live in lib/labels.ts.

## Checks
npx tsc --noEmit, npm run lint, npm test, npm run build.
