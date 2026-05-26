'use client'

import useSWR from 'swr'
import type { Domain, ShiftsResponse } from '@/lib/types'
import { fetchPopulationShifts } from '@/lib/api'

const POLL = 30_000

interface Props {
  domain: Domain
}

export default function ParadigmShiftTimeline({ domain }: Props) {
  const { data, error } = useSWR<ShiftsResponse>(
    ['population-shifts', domain],
    fetchPopulationShifts,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const events = data?.events ?? []

  return (
    <div className="panel shift-panel" style={{ gridColumn: '1/3', position: 'relative' }}>
      <div className="panel-label has-tip">
        paradigm_shift_history
        <div className="tip" style={{ left: 0, transform: 'none' }}>The intellectual history of this domain. Each gold marker is a moment when the dominant worldview changed — when one belief structure accumulated enough evidence against it that another took over. Analogous to a Kuhnian paradigm shift, encoded in data.</div>
      </div>
      {error ? (
        <div style={{ color: 'var(--red-dim)', fontSize: 10 }}>
          API ERROR · {String(error.message ?? '/v1/population/shifts unreachable')}
        </div>
      ) : !data ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
      ) : events.length === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>no shifts recorded</div>
      ) : (
        <div className="timeline">
          <div className="timeline-track" />
          {events.map((e, i) => (
            <div key={e.shift_id || i} className="shift-event">
              <div className="shift-dot is-shift" />
              <div className="shift-label sl-shift">
                gen {e.generation}
                {'\n'}
                {e.previous_dominant_name} → {e.new_dominant_name}
                {'\n'}
                {e.timestamp}
                {'\n'}
                evidence {e.evidence_count_at_shift}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
