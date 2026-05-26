'use client'

import type { Domain } from '@/lib/types'

interface Props {
  domain: Domain
}

const QUERY: Record<Domain, string> = {
  mr: 'query --domain mr --target AIRiskOn --condition YieldCurveInverted=true --aggregation weighted_avg',
  ng: 'query --domain ng --target price_up --condition temp_anom=true --aggregation weighted_avg',
  zc: 'query --domain zc --target price_up --condition precip_anom=true --aggregation weighted_avg',
  zs: 'query --domain zs --target SoyPriceUp --condition PlantingDelayed=true --aggregation weighted_avg',
}

export default function PromptLine({ domain }: Props) {
  return (
    <div className="prompt-line" style={{ gridColumn: '1/-1' }}>
      <span className="prompt-prefix">poe@engine:~$</span>
      <span>{QUERY[domain]}</span>
      <span className="prompt-cursor" />
    </div>
  )
}
