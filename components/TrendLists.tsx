'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Domain, Trend, TrendListName, TrendLists as Lists, TrendsResponse } from '@/lib/types'
import { fetchTrends } from '@/lib/api'
import { measure, shares } from '@/lib/trends'
import { TREND_LIST } from '@/lib/labels'
import DomainReport from '@/components/DomainReport'

const ORDER: TrendListName[] = ['new', 'growing', 'fading', 'argued']
const ROWS = 12

// This year's trends in the press (engine D30): what critics write about,
// grouped by meaning. A description of the present, not a forecast.
export default function TrendLists({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<TrendsResponse>(['trends', domain], fetchTrends, { revalidateOnFocus: false })
  const t = data?.trends
  const [reading, setReading] = useState<TrendListName | null>(null)
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        trends · {t ? `october ${t.year - 1} – september ${t.year}` : 'this_year'}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Every claim critics made in the Guardian and the New York Times, grouped by the idea it carries (names of
          people, shows and places left out), and followed year by year. A trend needs many writers and many
          subjects. Names are a local model&apos;s, checked against the claims; only particular themes are listed,
          not art in general. Lines: share of critics writing on it each year since 2010. Click a trend for its
          claims. These describe the present: in the case engine above, nothing in how critics write about a
          trend has predicted whether it grows.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/trends unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : !t ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no trends for this domain</div>
      ) : (
        <div className="trends-columns">
          {ORDER.map(key => (
            <Column key={key} lists={t} list={key} reading={reading === key}
              onRead={() => setReading(r => (r === key ? null : key))} />
          ))}
        </div>
      )}
      {t && reading && (
        <div className="trend-report">
          <DomainReport key={reading} domain={domain} sub={{ section: 'trends', name: reading }} title={TREND_LIST[reading][0]} />
        </div>
      )}
    </div>
  )
}

function Column({ lists, list, reading, onRead }: {
  lists: Lists; list: TrendListName; reading: boolean; onRead: () => void
}) {
  const [all, setAll] = useState(false)
  const keys = lists.lists[list]
  return (
    <div>
      <div className="cases-list-title" title={TREND_LIST[list][1]}>
        {TREND_LIST[list][0]} · {keys.length}{' '}
        <button className="trend-more" onClick={onRead} aria-pressed={reading}>
          {reading ? '[ close report ]' : '[ read report ]'}
        </button>
      </div>
      {(all ? keys : keys.slice(0, ROWS)).map(k => <Row key={k} lists={lists} list={list} trend={lists.trends[k]} />)}
      {keys.length > ROWS && (
        <button className="trend-more" onClick={() => setAll(a => !a)}>
          {all ? 'fewer' : `+${keys.length - ROWS} more`}
        </button>
      )}
    </div>
  )
}

function Row({ lists, list, trend }: { lists: Lists; list: TrendListName; trend: Trend }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="trend-row">
      <button className="trend-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="cases-name">{trend.name}</span>
        <Spark values={shares(lists, trend)} />
        <span className="trend-measure">{measure(lists, list, trend)}</span>
      </button>
      {open && (
        <div className="trend-detail">
          <div>broad since {trend.start} · {trend.papers.join(' + ') || 'neither paper'} this year · {trend.verdicts[0]} for, {trend.verdicts[1]} against</div>
          <div style={{ color: 'var(--text-faint)' }}>{trend.words.join(' · ')}</div>
          {trend.sample.map((c, i) => <div key={i} className="trend-claim">“{c}”</div>)}
        </div>
      )}
    </div>
  )
}

function Spark({ values }: { values: number[] }) {
  const W = 44, H = 12
  const top = Math.max(...values, 1e-9)
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * W},${H - (v / top) * H}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--green-dim)" strokeWidth="1" />
    </svg>
  )
}
