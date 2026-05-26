'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import type { Domain } from '@/lib/types'
import { fetchEntropyDebug, triggerIngest } from '@/lib/api'
import EpistemicStateBar   from '@/components/EpistemicStateBar'
import BeliefGraph         from '@/components/BeliefGraph'
import OntologyPopulation  from '@/components/OntologyPopulation'
import EdgeExistencePanel  from '@/components/EdgeExistencePanel'
import EvidenceStream      from '@/components/EvidenceStream'
import ParadigmShiftTimeline from '@/components/ParadigmShiftTimeline'
import ExplorationFrontier from '@/components/ExplorationFrontier'
import PromptLine          from '@/components/PromptLine'
import RegimeStatePanel    from '@/components/RegimeStatePanel'
import AiRegimeStatePanel  from '@/components/AiRegimeStatePanel'

const DOMAINS: { key: Domain; ticker: string; label: string }[] = [
  { key: 'mr', ticker: 'MR', label: 'macro_regime' },
  { key: 'ai', ticker: 'AI', label: 'ai_regime' },
  { key: 'ng', ticker: 'NG', label: 'natural_gas' },
  { key: 'zc', ticker: 'ZC', label: 'corn' },
  { key: 'zs', ticker: 'ZS', label: 'soybeans' },
]

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

const SNAPSHOT_PROMPT = `You are interpreting the output of a probabilistic system that tracks 
which economic story best fits recent financial data.

Write a clear, plain-English interpretation (3-5 paragraphs) for a 
senior business strategist. No jargon, no math, no system mechanics. 
Explain what is actually happening in the economy right now, what the 
data suggests is causing it, how certain we are, and what alternative 
explanations still exist.

Rules:
- Never mention Bayesian, entropy, log score, ontology, or any 
  technical term without immediately explaining it in plain English
- When describing causal chains (A → B → C), explain each link in 
  one plain sentence: what A is, why it leads to B, why B leads to C
- Ground abstract variables in concrete real-world terms:
  "YieldCurveInverted" = short-term borrowing costs more than long-term, 
  historically signals recession fear
  "LiquidityStress" = the Fed is shrinking its balance sheet, pulling 
  money out of the financial system
  "InflationShock" = inflation is running meaningfully above normal levels
  "CreditSpreadStress" = corporate bonds are paying much higher rates 
  than Treasuries, signaling default fear
  "VolatilityShock" = markets are unusually fearful and uncertain
  "DollarStrength" = the US dollar is strong relative to other currencies, 
  tightening global financial conditions
  "EquityRiskOn" = investors are willing to take on risk, buying stocks
  "AIRiskOn" = tech and AI stocks are leading the market, growth 
  narrative is dominant
- Be direct about what this means for business conditions
- Write like you are briefing someone who reads the Wall Street Journal 
  but not academic papers — intelligent, experienced, no patience for 
  abstraction

Additional context to consider in your interpretation:

The AI investment cycle has several structural dynamics that may not 
be fully captured in the quantitative data. When interpreting this 
snapshot, consider whether the current regime is consistent with any 
of the following:

- Open-source model capability closing the gap with frontier models: 
  this would typically manifest as compressed risk premiums, falling 
  market concentration, and divergence between semiconductor momentum 
  and hyperscaler capex growth — infrastructure spending continues 
  while the moat narrows.

- Falling inference costs democratizing AI access: consistent with 
  broad economic lift without proportional hyperscaler revenue growth, 
  and with AI tooling spreading into sectors beyond tech.

- Non-frontier application companies beginning to capture value: 
  would show up as declining market concentration even as IP investment 
  and labor productivity continue rising — the value is spreading out 
  of the infrastructure layer.

- Infrastructure monopolies historically do not capture all long-term 
  value: the current capex acceleration may be building capacity that 
  benefits the broader economy more than the infrastructure builders 
  themselves. Consider whether the data is consistent with this 
  historical pattern.

These are structural interpretive lenses, not additional data points. 
Use them to enrich your analysis where the quantitative signals are 
ambiguous or incomplete.

SNAPSHOT:`

declare global {
  interface Window {
    fetchEntropyDebug?: (domain?: Domain) => Promise<unknown>
  }
}

function Clock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toUTCString().split(' ')[4] ?? '--:--:--'
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])

  return <div className="clock">{time || '--:--:--'}</div>
}

// Each commodity domain's full panel set — always rendered for independent polling.
// CSS display toggles visibility rather than unmounting, so SWR keeps polling both.
function DomainPanels({ domain, visible }: { domain: Domain; visible: boolean }) {
  return (
    <div style={{ display: visible ? 'contents' : 'none' }}>
      <EpistemicStateBar   domain={domain} />
      <BeliefGraph         domain={domain} />
      <OntologyPopulation  domain={domain} />
      <EdgeExistencePanel  domain={domain} />
      <EvidenceStream      domain={domain} />
      <ParadigmShiftTimeline domain={domain} />
      <ExplorationFrontier domain={domain} />
      <PromptLine          domain={domain} />
    </div>
  )
}

// MR (Macro Regime) panel set.
// Uses the same grid and reuses all existing components where possible.
// No mock fallback — API errors surface as visible error states.
function MrDomainPanels({ visible }: { visible: boolean }) {
  return (
    <div style={{ display: visible ? 'contents' : 'none' }}>
      {/* Row 1 (112px): engine status spanning cols 1-2 */}
      <EpistemicStateBar domain="mr" />
      {/* Col 1, rows 2-3: belief graph (8-node, smaller nodes via data-driven sizing) */}
      <BeliefGraph domain="mr" targetVariable="AIRiskOn" />
      {/* Col 2, rows 2-3: regime state (8 boolean variables + probabilities) */}
      <RegimeStatePanel domain="mr" />
      {/* Col 3, rows 1-4: ontology competition */}
      <OntologyPopulation domain="mr" />
      {/* Paradigm shift history — uses live dominant candidate_id from
          GET /v1/population/status?domain=mr; no mock needed */}
      <ParadigmShiftTimeline domain="mr" />
      <ExplorationFrontier domain="mr" />
      {/* Row 6: terminal prompt line */}
      <PromptLine domain="mr" />
    </div>
  )
}

// AI Regime panel set.
// Same layout as MrDomainPanels. No mock fallback — errors surface visibly.
function AiDomainPanels({ visible }: { visible: boolean }) {
  return (
    <div style={{ display: visible ? 'contents' : 'none' }}>
      {/* Row 1 (112px): engine status spanning cols 1-2 */}
      <EpistemicStateBar domain="ai" />
      {/* Col 1, rows 2-3: belief graph targeting SemiconductorMomentum */}
      <BeliefGraph domain="ai" targetVariable="SemiconductorMomentum" />
      {/* Col 2, rows 2-3: regime state (8 AI boolean variables + probabilities) */}
      <AiRegimeStatePanel domain="ai" />
      {/* Col 3, rows 1-4: ontology competition */}
      <OntologyPopulation domain="ai" />
      {/* Paradigm shift history */}
      <ParadigmShiftTimeline domain="ai" />
      <ExplorationFrontier domain="ai" />
      {/* Row: terminal prompt line */}
      <PromptLine domain="ai" />
    </div>
  )
}

type FetchState = 'idle' | 'fetching' | 'failed'
type ExportState = 'idle' | 'exporting' | 'failed'

function isActiveDomainPanelKey(key: unknown, domain: Domain): boolean {
  if (!Array.isArray(key)) return false

  const [, params] = key
  if (params === domain) return true
  if (typeof params !== 'object' || params === null) return false

  return 'domain' in params && params.domain === domain
}

export default function Dashboard() {
  const [active, setActive] = useState<Domain>('mr')
  const [explainOpen, setExplainOpen] = useState(false)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [exportState, setExportState] = useState<ExportState>('idle')
  const resetFetchStateRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetFetchStateRef.current) clearTimeout(resetFetchStateRef.current)
    }
  }, [])

  useEffect(() => {
    window.fetchEntropyDebug = (domain = active) => fetchEntropyDebug(domain)
    return () => {
      delete window.fetchEntropyDebug
    }
  }, [active])

  async function handleFetchNow() {
    if (fetchState === 'fetching') return

    if (resetFetchStateRef.current) clearTimeout(resetFetchStateRef.current)
    setFetchState('fetching')

    try {
      await triggerIngest(active)
      await mutate(
        key => isActiveDomainPanelKey(key, active),
        undefined,
        { revalidate: true },
      )
      setFetchState('idle')
    } catch {
      setFetchState('failed')
      resetFetchStateRef.current = setTimeout(() => {
        setFetchState('idle')
        resetFetchStateRef.current = null
      }, 1800)
    }
  }

  async function handleExportSnapshot(domain: Domain) {
    if (exportState === 'exporting') return

    setExportState('exporting')

    try {
      const res = await fetch(`${API_BASE}/v1/export/narrative-snapshot?domain=${domain}`, {
        headers: { Accept: 'application/json' },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const snapshot = await res.json()
      const timestamp = new Date().toISOString()
      const contents = `${SNAPSHOT_PROMPT}\n${JSON.stringify(snapshot, null, 2)}\n`
      const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `${domain}-snapshot-${timestamp}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setExportState('idle')
    } catch {
      setExportState('failed')
    }
  }

  const fetchLabel =
    fetchState === 'fetching' ? '[ fetching... ]' :
    fetchState === 'failed' ? '[ fetch failed ]' :
    '[ fetch now ]'

  const exportLabel =
    exportState === 'exporting' ? '[ exporting... ]' :
    exportState === 'failed' ? '[ export failed ]' :
    '[ EXPORT SNAPSHOT ]'

  return (
    <div className="shell">
      {/* ── Header ── */}
      <header>
        <div className="header-left">
          <h1>
            PROBABILISTIC ONTOLOGY ENGINE
            <span className="blink">_</span>
          </h1>
          <div className="subtitle">
            <span className="subtitle-label">EPISTEMIC STATE MONITOR</span>
            <span className="subtitle-separator">·</span>
            <span className="status-ok">engine online</span>
            <span className="subtitle-separator">·</span>
            <span className="status-ok">evidence cycle active</span>
            <span className="subtitle-separator">·</span>
            <span className="status-warn">frontier unresolved</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`explain-btn${explainOpen ? ' active' : ''}`}
            onClick={() => setExplainOpen(v => !v)}
          >
            {explainOpen ? '[ × ] close explanation' : '[ ? ] what is this'}
          </button>
          <button
            className={`fetch-btn${fetchState === 'failed' ? ' failed' : ''}`}
            onClick={handleFetchNow}
            disabled={fetchState === 'fetching'}
          >
            {fetchLabel}
          </button>
          <button
            className={`fetch-btn${exportState === 'failed' ? ' failed' : ''}`}
            onClick={() => handleExportSnapshot(active)}
            disabled={exportState === 'exporting'}
          >
            {exportLabel}
          </button>
          <Clock />
        </div>
      </header>

      {/* ── Explanation overlay ── */}
      <div className={`explanation-overlay${explainOpen ? ' visible' : ''}`}>
        <div className="exp-title">WHAT IS THIS SYSTEM</div>
        <div className="exp-grid">

          <div className="exp-section">
            <h3>The epistemological project</h3>
            <p>This system is a computational encoding of epistemology — a formal model of how beliefs form, update, and compete when confronted with evidence. It is not primarily a prediction engine. The goal is to make the structure of belief visible and inspectable.</p>
            <p style={{ marginTop: 8 }}>The philosophical foundation is Bayesian: beliefs are probability distributions, and rational belief update means conditioning on evidence. Every number on this dashboard is a belief, not a fact.</p>
          </div>

          <div className="exp-section">
            <h3>Three levels of belief</h3>
            <div className="exp-label">Level 1 — parameters</div>
            <div className="exp-term">
              <span className="exp-term-key">edge strength</span>
              <span className="exp-term-val">How strongly does a known relationship hold? Updated continuously from evidence.</span>
            </div>
            <div className="exp-label">Level 2 — edge existence</div>
            <div className="exp-term">
              <span className="exp-term-key">P(edge exists)</span>
              <span className="exp-term-val">Does this relationship exist at all? Not assumed — learned. Near 0.5 means genuinely uncertain.</span>
            </div>
            <div className="exp-label">Level 3 — structure</div>
            <div className="exp-term">
              <span className="exp-term-key">ontology population</span>
              <span className="exp-term-val">Competing whole worldviews. Each is a complete belief structure. Evidence scores them. Weak ones are discarded.</span>
            </div>
          </div>

          <div className="exp-section">
            <h3>Reading the dashboard</h3>
            <div className="exp-term">
              <span className="exp-term-key">structure_entropy</span>
              <span className="exp-term-val">How spread out is belief across competing worldviews? High = genuinely uncertain which model is right.</span>
            </div>
            <div className="exp-term">
              <span className="exp-term-key">paradigm_shifts</span>
              <span className="exp-term-val">How many times has the dominant worldview changed? A Kuhnian shift encoded in data.</span>
            </div>
            <div className="exp-term">
              <span className="exp-term-key">frontier_edges</span>
              <span className="exp-term-val">Relationships the system hasn&apos;t yet resolved. The boundary of what it knows.</span>
            </div>
            <div className="exp-term">
              <span className="exp-term-key">log_score</span>
              <span className="exp-term-val">Cumulative fit of a worldview against observed evidence. More negative = worse fit.</span>
            </div>
            <div className="exp-term">
              <span className="exp-term-key">exploring (amber)</span>
              <span className="exp-term-val">This edge&apos;s existence is unresolved. The system is allocating attention to learn whether it&apos;s real.</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Domain tabs ── */}
      <div className="domain-tabs">
        {DOMAINS.map(d => (
          <div
            key={d.key}
            className={`domain-tab ${active === d.key ? 'active' : ''}`}
            onClick={() => setActive(d.key)}
          >
            <span className="tab-ticker">{d.ticker}</span>
            {d.label}
          </div>
        ))}
        <div className="domain-tab" style={{ opacity: 0.3, cursor: 'not-allowed' }}>
          <span className="tab-ticker">+</span>
          add_domain
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="main-grid">
        {/*
          All domain panels are always mounted so SWR polls them independently.
          `display: contents` passes grid children through; `display: none` hides.
          MR uses its own panel set; commodity domains share DomainPanels.
        */}
        <MrDomainPanels visible={active === 'mr'} />
        <AiDomainPanels visible={active === 'ai'} />
        {DOMAINS.filter(d => d.key !== 'mr' && d.key !== 'ai').map(d => (
          <DomainPanels key={d.key} domain={d.key} visible={active === d.key} />
        ))}
      </div>
    </div>
  )
}
