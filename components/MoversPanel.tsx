'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Domain, SuccessResponse } from '@/lib/types'
import { fetchSuccess } from '@/lib/api'
import DomainReport from '@/components/DomainReport'
import { Kind } from '@/components/SuccessPanel'

// Who moves up Artprice's Top 500 next year (abductive_engine ART-PLAN §13),
// judged like the four kinds of success but shown on its own.
export default function MoversPanel({ domain }: { domain: Domain }) {
  const { data, error } = useSWR<SuccessResponse>(['success', domain], fetchSuccess, { revalidateOnFocus: false })
  const [reading, setReading] = useState(false)
  const movers = data?.success?.kinds.movers
  return (
    <div className="panel shift-panel">
      <div className="panel-label has-tip">
        market_movers · who_moves_up
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          Artprice&apos;s Top 500 by auction turnover, cut into bands: not listed, 251–500, 101–250, 26–100, 1–25.
          Each set of features of an artist&apos;s coverage is judged on how well it predicts a move up the bands next
          year, beyond the artist&apos;s band now and best band before, using only earlier years. Read as the success
          panel. Year after: if next year&apos;s features score better, coverage moves with a rise rather than ahead of it.
        </div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>API ERROR · {String(error.message ?? '/v1/success unreachable')}</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : !movers ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no market movers analysis for this domain</div>
      ) : (
        <>
          <div className="trends-columns">
            <Kind kind={movers} reading={reading} onRead={() => setReading(r => !r)} />
          </div>
          {reading && (
            <div className="trend-report">
              <DomainReport domain={domain} sub={{ section: 'success', name: 'movers' }} title={movers.title} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
