'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Domain, Rewarded, SuccessKind, SuccessKindName, SuccessResponse } from '@/lib/types'
import { fetchSuccess } from '@/lib/api'
import { mechanismLabel } from '@/lib/labels'
import { adds, pushes, rewardedBy } from '@/lib/success'
import DomainReport from '@/components/DomainReport'

const ORDER: SuccessKindName[] = ['approve', 'press', 'museum', 'market']
const PUSHES = 5
const REWARDED = 8

// What predicts an artist's success next year, four ways (engine D31), and
// what critics rewarded this year. Judged offline over every artist-year.
export default function SuccessPanel({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<SuccessResponse>(['success', domain], fetchSuccess, { revalidateOnFocus: false })
  const [reading, setReading] = useState<SuccessKindName | null>(null)
  const s = data?.success
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        success · what_predicts_it{s ? ` · forecast for ${s.forecast_for}` : ''}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Every artist Chicago or Cleveland ever acquired, year by year. Each set of features of an artist&apos;s
          coverage that year (claims in new, growing, fading or argued trends; medium tags; NYT coverage) is judged
          on how well it predicts next year&apos;s success beyond the artist&apos;s own past, using only earlier years.
          Pushes: which way the leading features move the odds (above 0 helps). Adds: nats lost when that feature is
          dealt out at random among the year&apos;s artists. Year after: the same test with next year&apos;s features; if it
          scores as well, the coverage comes with success rather than before it (no test for approval and press,
          whose year-after features count the same claims and articles). Market is Artprice&apos;s Top 500 by auction
          turnover, so only the top of the market, in the years it published.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/success unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : !s ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no success analysis for this domain</div>
      ) : (
        <>
          <div className="trends-columns">
            {ORDER.map(k => (
              <Kind key={k} kind={s.kinds[k]} reading={reading === k} onRead={() => setReading(r => (r === k ? null : k))} />
            ))}
          </div>
          <div className="trends-columns" style={{ marginTop: 12 }}>
            <RewardedList title={`critics_rewarded · media · ${s.year}`} rows={rewardedBy(s.rewarded, 'medium')} />
            <RewardedList title="most_approved · themes" rows={rewardedBy(s.rewarded, 'trend').slice(0, REWARDED)} />
            <RewardedList title="least_approved · themes" rows={rewardedBy(s.rewarded, 'trend').reverse().slice(0, REWARDED)} />
          </div>
          {reading && (
            <div className="trend-report">
              <DomainReport key={reading} domain={domain} sub={{ section: 'success', name: reading }} title={s.kinds[reading].title} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Kind({ kind, reading, onRead }: { kind: SuccessKind; reading: boolean; onRead: () => void }) {
  return (
    <div>
      <div className="cases-list-title" title={kind.outcome}>
        {kind.title}{' '}
        <button className="trend-more" onClick={onRead} aria-pressed={reading}>
          {reading ? '[ close report ]' : '[ read report ]'}
        </button>
      </div>
      <div className="cases-row"><span className="cases-name">{mechanismLabel(kind.leader)}</span>
        <span>{kind.gain >= 0 ? '+' : ''}{kind.gain.toFixed(0)} nats</span></div>
      {pushes(kind, PUSHES).map(p => (
        <div key={p.label} className="cases-row">
          <span className="cases-name" style={{ color: 'var(--text-faint)' }}>{p.label}</span>
          <span style={{ color: p.push >= 0 ? 'var(--green-dim)' : 'var(--red-dim)' }}>{p.push >= 0 ? '↑' : '↓'} {Math.abs(p.push).toFixed(2)}</span>
        </div>
      ))}
      {adds(kind).map(a => (
        <div key={a.label} className="cases-row" style={{ color: 'var(--text-faint)' }}>
          <span className="cases-name">adds · {a.label}</span>
          <span>{a.adds >= 0 ? '+' : ''}{a.adds.toFixed(0)}</span>
        </div>
      ))}
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}>
        <span className="cases-name">features from the year after</span>
        <span>{kind.placebo_fair ? `${kind.placebo >= 0 ? '+' : ''}${kind.placebo.toFixed(0)}` : (
          <span title="Next year's claims and articles are part of next year's success, so this control proves nothing here">n/a</span>
        )}</span>
      </div>
    </div>
  )
}

function RewardedList({ title, rows }: { title: string; rows: (Rewarded & { share: number })[] }) {
  return (
    <div>
      <div className="cases-list-title">{title}</div>
      {rows.map(r => (
        <div key={r.name} className="cases-row" title={[...r.approved.map(c => `+ ${c}`), ...r.disapproved.map(c => `− ${c}`)].join('\n')}>
          <span className="cases-name">{r.name}</span>
          <span style={{ color: 'var(--text-faint)' }}>{r.approvals}–{r.disapprovals}</span>
          <span>{Math.round(r.share * 100)}%</span>
        </div>
      ))}
    </div>
  )
}
