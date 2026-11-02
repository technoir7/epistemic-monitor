# Epistemic State Monitor

[![CI](https://github.com/technoir7/epistemic-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/technoir7/epistemic-monitor/actions/workflows/ci.yml)

A live dashboard for the
[Probabilistic Ontology Engine](https://github.com/technoir7/probabilistic_ontology_engine),
a system that keeps several rival explanations of a domain (the macro economy,
credit, energy, crypto and seven others), scores each against public data as it
arrives week by week, and changes which one it believes when the evidence says
to. This dashboard shows that state of belief: which explanation leads, how sure
the engine is, what it is still unsure about, and when it changed its mind.
Art has its own engine and its own panels ([below](#art)).

**Live:** https://epistemic-monitor-production.up.railway.app

![The macro domain: status bar, belief graph, regime variables, competing hypotheses and shift history](docs/dashboard.png)

## What the panels show

Every domain except art:

- **Status bar** — how evenly belief is spread across the rival explanations
  (structure entropy), how many are competing, which one leads and for how
  long, how often the leader has changed, and how many links are unresolved.
- **Belief graph** — the leading explanation drawn as cause-and-effect links
  between signals. Each arrow carries the probability that the link is real;
  amber dashed links are ones the engine is still testing. "X t-1" means
  last week's value of X.
- **Regime state** — the engine's current probability for each signal in the
  domain (is the yield curve inverted, is credit stressed, …).
- **Ontology population** — every competing explanation, best first. Variants
  are named by the one link they add (+) or remove (−) from their parent.
  The number shown is total fit over all evidence; the order uses recent fit
  minus a penalty for complexity.
- **Paradigm shift history** — each time the leader changed, dated by the
  evidence that caused it. Gold marks a change of worldview (a different family
  of explanation took over); a dim mark is a revision within one.
- **Exploration frontier** — links whose probability is near 0.5, which the
  engine is actively gathering evidence on.
- **Report** — a cached plain-English reading of the current state, written by
  an LLM and regenerated only when you press "update report" and the state has
  changed.

Natural gas, the first domain, also shows per-edge probabilities and the raw
evidence feed.

### Art

![The art tab: case mechanisms, rival explanations, graded signals and this year's trend lists](docs/art.png)

Art's monthly totals (each paper's share of art articles by topic, market
figures, museum buys) form no links, so the art tab shows the engine's *case
mode* instead: every artist, concept and trend is a case, and a mechanism
("a case in this state this year tends to this outcome next year") is judged
across all of them at once, each year predicted only from the years before,
against each case's own past.

- **Status bar** — how many case-years were judged, whether the monthly totals
  found any links, and which year the forecasts are for.
- **Case mechanisms graph** and **rival mechanisms** — every combination of
  mechanisms is a rival explanation; the number is its evidence over each
  case's own past, in nats. The leader is drawn in amber.
- **Trends** — every claim critics made in the Guardian and the New York Times,
  grouped by idea and followed year by year: new, growing, fading and argued
  over. Each list has its own written report.
- **Success** — what predicts that an artist succeeds next year, for four kinds
  kept apart: critics approve, more press, a museum buys, a place in Artprice's
  Top 500. Each kind has a report, which ends with an imagined artist who had
  that success: a short life, a wall text, an artist statement and an image
  prompt, each built from what critics said.
- **Market movers** — who moves up Artprice's Top 500, with its own report.
- **Which themes help** — each theme's track record for each kind of success,
  from earlier years only, tested on top of what already predicts it.
- **Lives** — which stories about an artist's life critics told most and least
  about the artists who had each kind of success, and which go together. A
  description, not a cause.
- **Forecasts** and **belief changes** — the cases the leading mechanism raises
  most for next year, and when the case engine changed its mind.

## Stack

Next.js 14 (app router) · TypeScript · SWR (polls every 30 s) · D3 force layout
for the graph · hand-written CSS. Only the selected domain's panels are mounted,
so the page polls one domain at a time. When the engine cannot be reached, each
panel says so; nothing falls back to placeholder data.

The page itself is rendered on every visit (`dynamic = 'force-dynamic'` in
`app/layout.tsx`), so a copy saved to a phone's Home Screen picks up new builds;
the code and styles it loads have hashed names and stay cached. The domain tabs
wrap onto a second row in narrow windows and scroll sideways on phones.

## Run locally

Needs Node 18.17+ to run, and 22.18+ for `npm test` (it uses Node's built-in TypeScript support).

```bash
git clone https://github.com/technoir7/epistemic-monitor.git
cd epistemic-monitor
npm install
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to an engine: the live one at
`https://epistemic-monitor-suite-production.up.railway.app`, or
`http://localhost:8000` (the default) if you run the engine yourself. Then:

```bash
npm run dev        # http://localhost:3000
```

Checks: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## Deployment

Hosted on Railway, which builds and deploys `main` automatically
(`railway.toml`). `NEXT_PUBLIC_API_BASE_URL` is inlined at build time, so it
must be set in the Railway service before the build runs.
