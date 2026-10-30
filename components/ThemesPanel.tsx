'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Domain, MainKindName, SuccessResponse, ThemeTest } from '@/lib/types'
import { fetchSuccess } from '@/lib/api'
import { themeRecord } from '@/lib/success'
import DomainReport from '@/components/DomainReport'

const ORDER: MainKindName[] = ['approve', 'press', 'museum', 'market']
const SHOWN = 6

// Which themes help each kind of success (abductive_engine ART-PLAN §14): a
// theme's track record, learned from earlier years only, tested on top of
// what already predicts that kind.
export default function ThemesPanel({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<SuccessResponse>(['success', domain], fetchSuccess, { revalidateOnFocus: false })
  const [reading, setReading] = useState(false)
  const s = data?.success
  const year = s ? Object.values(s.themes ?? {})[0]?.year : undefined
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        themes · which_help{year ? ` · records for ${year}` : ''}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Each theme critics write in gets a track record for each kind of success, from earlier years only: how many
          artists written about in it had that success the next year, against how many would have among artists with
          the same amount of it so far. Claims in good-record and poor-record themes are then tested on top of what
          already predicts that kind. Where the record adds nothing, its best and worst themes describe the past only.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/success unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : !s?.themes || Object.keys(s.themes).length === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no theme tests for this domain</div>
      ) : (
        <>
          <div className="cases-list-title">
            <button className="trend-more" onClick={() => setReading(r => !r)} aria-pressed={reading}>
              {reading ? '[ close report ]' : '[ read report ]'}
            </button>
          </div>
          <div className="trends-columns">
            {ORDER.map(k => <Column key={k} title={s.kinds[k].title} test={s.themes[k]} />)}
          </div>
          {reading && (
            <div className="trend-report">
              <DomainReport domain={domain} sub={{ section: 'success', name: 'themes' }} title="Which themes help" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Column({ title, test }: { title: string; test: ThemeTest }) {
  const v = themeRecord(test)
  // Where the record adds nothing its themes describe the past only, so they are not coloured as advice.
  const good = v.leads ? 'var(--green-dim)' : 'var(--text-faint)'
  const poor = v.leads ? 'var(--red-dim)' : 'var(--text-faint)'
  return (
    <div>
      <div className="cases-list-title">{title}</div>
      <div className="cases-row" style={{ color: v.leads ? 'var(--green)' : 'var(--text-faint)' }}>
        <span className="cases-name">{v.leads ? 'record leads' : 'record adds nothing'}</span>
        {v.leads && <span>+{v.over.toFixed(0)} nats</span>}
      </div>
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}><span className="cases-name">best records</span></div>
      {test.best.slice(0, SHOWN).map(([name]) => (
        <div key={name} className="cases-row"><span className="cases-name" style={{ color: good }}>{name}</span></div>
      ))}
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}><span className="cases-name">worst records</span></div>
      {test.worst.slice(0, SHOWN).map(([name]) => (
        <div key={name} className="cases-row"><span className="cases-name" style={{ color: poor }}>{name}</span></div>
      ))}
    </div>
  )
}
