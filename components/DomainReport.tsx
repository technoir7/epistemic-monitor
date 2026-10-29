'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Domain, DomainReport as DomainReportType, DomainReportEmpty, TrendListName } from '@/lib/types'
import { fetchCachedReport, refreshReport } from '@/lib/api'
import { reportBlocks } from '@/lib/report'
import { TREND_LIST } from '@/lib/labels'

interface Props {
  domain: Domain
  list?: TrendListName      // one of the domain's trend lists (engine D30), instead of the domain
}

function formatTs(iso: string): string {
  try {
    return new Date(iso).toUTCString()
  } catch {
    return iso
  }
}

function ReportBody({ text }: { text: string }) {
  return (
    <div className="report-body">
      {reportBlocks(text).map((block, i) => {
        if (block.kind === 'heading') {
          return <div key={i} className="report-heading">{block.text}</div>
        }
        const parts = block.text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
        return (
          <p key={i} className="report-para">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>
              if (part.startsWith('*') && part.endsWith('*')) return <em key={j}>{part.slice(1, -1)}</em>
              return part
            })}
          </p>
        )
      })}
    </div>
  )
}

export default function DomainReport({ domain, list }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  // Load cached report on mount. No polling — SWR key just fetches once
  // and we manually mutate after a successful refresh.
  const { data, error: loadError, mutate, isLoading } = useSWR<DomainReportType | DomainReportEmpty>(
    ['domain-report', domain, list],
    fetchCachedReport,
    { revalidateOnFocus: false, refreshInterval: 0 },
  )

  const report = data?.found ? (data as DomainReportType) : null

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    setRefreshError(null)
    try {
      const fresh = await refreshReport(domain, list)
      // Update SWR cache so the UI reflects the new report immediately.
      await mutate(fresh, { revalidate: false })
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err))
    } finally {
      setRefreshing(false)
    }
  }

  const btnLabel = refreshing ? '[ updating… ]' : '[ update report ]'

  return (
    <div className="report-panel">

      {/* Header row: label + metadata + button */}
      <div className="report-header">
        <div className="panel-label has-tip" style={{ flex: 1 }}>
          {list ? `trends_report · ${TREND_LIST[list][0]}` : 'epistemic_state_report'}
          {report && (
            <span className="report-meta">
              {report.stale && (
                <span className="report-badge stale">STALE</span>
              )}
              {!report.stale && report.regenerated && (
                <span className="report-badge generated">REGENERATED</span>
              )}
              {!report.stale && !report.regenerated && (
                <span className="report-badge cached">CACHED</span>
              )}
              <span className="report-ts">{formatTs(report.generated_at)}</span>
              <span className="report-hash">#{report.snapshot_hash.slice(0, 8)}</span>
            </span>
          )}
          <div className="tip" style={{ left: 0, transform: 'none' }}>
            Plain-English interpretation of the current epistemic state. Cached per
            snapshot hash — page loads never call the LLM. Click &quot;update report&quot;
            to regenerate when data has changed.
          </div>
        </div>

        <button
          className={`report-btn${refreshing ? ' loading' : ''}${refreshError ? ' failed' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {btnLabel}
        </button>
      </div>

      {/* Status / body */}
      {isLoading && !report && (
        <div className="report-loading">loading cached report…</div>
      )}

      {loadError && !report && (
        <div className="report-error">
          API ERROR · {String(loadError.message ?? 'report unreachable')}
        </div>
      )}

      {!isLoading && !loadError && !report && !refreshError && (
        <div className="report-empty">
          no report generated yet · click &quot;update report&quot; to generate
        </div>
      )}

      {refreshError && (
        <div className="report-error">
          update failed · {refreshError}
          {report && ' · showing previous cached report'}
        </div>
      )}

      {report?.stale && !refreshError && (
        <div className="report-warn">
          ⚠ stale · last generation failed — showing previous report
        </div>
      )}

      {report && <ReportBody text={report.report} />}

    </div>
  )
}
