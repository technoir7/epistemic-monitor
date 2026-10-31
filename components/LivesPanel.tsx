'use client'

import useSWR from 'swr'
import type { Domain, LifeTest, SuccessKindName, SuccessResponse } from '@/lib/types'
import { fetchSuccess } from '@/lib/api'

const ORDER: SuccessKindName[] = ['approve', 'press', 'museum', 'market', 'movers']
const SHOWN = 6

const VERDICT: Record<LifeTest['verdict'], string> = {
  untested: 'forecast: not tested',
  nothing: 'forecast: life adds nothing',
  with: 'forecast: comes with success',
  predicts: 'forecast: life predicts',
}

// Which life stories are told about the artists who had each kind of success
// (abductive_engine ART-PLAN 15.12, 15.4 revised): description, not a cause,
// so nothing is coloured as help or harm. The forecast verdict is the engine's.
export default function LivesPanel({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<SuccessResponse>(['success', domain], fetchSuccess, { revalidateOnFocus: false })
  const s = data?.success
  const lives = s?.lives ?? {}
  const kinds = ORDER.filter(k => lives[k] && s?.kinds[k as keyof typeof s.kinds])
  const year = kinds.length ? lives[kinds[0]]?.told_year : undefined
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        lives · told_of_the_championed{year ? ` · ${year}` : ''}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          A life block is a theme critics write in, counting only claims about an artist&apos;s life (a model read every
          claim as about a life or about the work). For each kind of success, the blocks told most and least about the
          artists who had it that year, against their share of all life talk that year. This describes what was said
          about the championed; it is not a cause. The first line says whether life stories help forecast the kind at all.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/success unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : !s || kinds.length === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no life tests for this domain</div>
      ) : (
        <div className="trends-columns">
          {kinds.map(k => <Column key={k} title={s.kinds[k as keyof typeof s.kinds]!.title} test={lives[k]!} />)}
        </div>
      )}
    </div>
  )
}

function Column({ title, test }: { title: string; test: LifeTest }) {
  return (
    <div>
      <div className="cases-list-title">{title}</div>
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}>
        <span className="cases-name">{VERDICT[test.verdict]}</span>
      </div>
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}><span className="cases-name">told most</span></div>
      {test.told_most.slice(0, SHOWN).map(([name]) => (
        <div key={name} className="cases-row"><span className="cases-name">{name}</span></div>
      ))}
      <div className="cases-row" style={{ color: 'var(--text-faint)' }}><span className="cases-name">told least</span></div>
      {test.told_least.slice(0, SHOWN).map(([name]) => (
        <div key={name} className="cases-row"><span className="cases-name" style={{ color: 'var(--text-faint)' }}>{name}</span></div>
      ))}
    </div>
  )
}
