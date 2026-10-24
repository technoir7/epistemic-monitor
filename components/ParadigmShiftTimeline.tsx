'use client'

import useSWR from 'swr'
import type { Domain, ShiftEvent, ShiftsResponse } from '@/lib/types'
import { fetchPopulationShifts } from '@/lib/api'
import { hypothesisLabel } from '@/lib/labels'

const POLL = 30_000

interface Props {
  domain: Domain
}

type ShiftKind = 'worldview' | 'revision' | 'unknown'

// A variant overtaking its own programme revises a worldview; a different
// programme taking the lead replaces it. Older rows carry no programme.
function shiftKind(e: ShiftEvent): ShiftKind {
  if (!e.previous_programme || !e.new_programme) return 'unknown'
  return e.previous_programme === e.new_programme ? 'revision' : 'worldview'
}

// The evidence date says when the world changed; the server timestamp only
// says when the engine got round to processing it.
function shiftDate(e: ShiftEvent): string {
  return e.evidence_date ?? e.timestamp.slice(0, 10)
}

const KIND_TEXT: Record<ShiftKind, string | null> = {
  worldview: 'worldview change',
  revision: 'revision',
  unknown: null,
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
        <div className="tip" style={{ left: 0, transform: 'none' }}>Every time the leading hypothesis changed, dated by the evidence that caused it. Gold markers are worldview changes: a hypothesis from a different research programme took the lead, a Kuhnian paradigm shift encoded in data. Dim markers are revisions: a variant overtook its own programme, refining the worldview rather than replacing it.</div>
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
        <div className="timeline-scroll">
          <div className="timeline">
            <div className="timeline-track" />
            {events.map((e, i) => {
              const kind = shiftKind(e)
              const kindText = KIND_TEXT[kind]
              return (
                <div key={e.shift_id || i} className={`shift-event shift-${kind}`}>
                  <div className="shift-dot" />
                  <div className="shift-label">
                    {kindText && <div className="shift-kind">{kindText}</div>}
                    <div className="shift-date">{shiftDate(e)}</div>
                    <div className="shift-from" title={e.previous_dominant_name}>
                      {hypothesisLabel(e.previous_dominant_name)}
                    </div>
                    <div className="shift-to" title={e.new_dominant_name}>
                      → {hypothesisLabel(e.new_dominant_name)}
                    </div>
                    <div className="shift-meta">
                      gen {e.generation} · evidence {e.evidence_count_at_shift}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
