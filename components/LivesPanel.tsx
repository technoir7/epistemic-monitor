'use client'

import useSWR from 'swr'
import type { Domain, LifeTest, SuccessKindName, SuccessResponse } from '@/lib/types'
import { fetchSuccess } from '@/lib/api'

const ORDER: SuccessKindName[] = ['approve', 'press', 'museum', 'market', 'movers']
const SHOWN = 6

const VERDICT: Record<LifeTest['verdict'], string> = {
  untested: 'not tested',
  nothing: 'life adds nothing',
  with: 'comes with success, not before',
  predicts: 'life predicts',
}

// Which life stories go with each kind of success (abductive_engine ART-PLAN
// 15.7, 15.4 as built). The verdict is the engine's, not judged here: a life
// feature can lead and still add nothing.
export default function LivesPanel({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<SuccessResponse>(['success', domain], fetchSuccess, { revalidateOnFocus: false })
  const s = data?.success
  const lives = s?.lives ?? {}
  const kinds = ORDER.filter(k => lives[k] && s?.kinds[k as keyof typeof s.kinds])
  const year = kinds.length ? lives[kinds[0]]?.year : undefined
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        lives · which_help{year ? ` · records for ${year}` : ''}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          A life block is a theme critics write in, counting only claims about an artist&apos;s life (a model read every
          claim as about a life or about the work). Each block gets a track record for each kind of success, from earlier
          years only. Claims in good-record and poor-record blocks are then tested on top of what already predicts that
          kind. Where they add nothing, the best and worst blocks describe the past only, and are not coloured.
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
  const predicts = test.verdict === 'predicts'
  const good = predicts ? 'var(--green-dim)' : 'var(--text-faint)'
  const poor = predicts ? 'var(--red-dim)' : 'var(--text-faint)'
  return (
    <div>
      <div className="cases-list-title">{title}</div>
      <div className="cases-row" style={{ color: predicts ? 'var(--green)' : 'var(--text-faint)' }}>
        <span className="cases-name">{VERDICT[test.verdict]}</span>
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
