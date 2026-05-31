'use client'

import type { Domain } from '@/lib/types'

interface Props {
  domain: Domain
}

const QUERY: Record<Domain, string> = {
  mr: 'query --domain mr --target AIRiskOn --condition YieldCurveInverted=true --aggregation weighted_avg',
  ai: 'query --domain ai --target SemiconductorMomentum --condition HyperscalerCapexAccelerating=true --aggregation weighted_avg',
  ng: 'query --domain ng --target price_up --condition temp_anom=true --aggregation weighted_avg',
  sd: 'query --domain sd --target USYieldSpiking --condition SpreadWidening=true --aggregation weighted_avg',
  cc: 'query --domain cc --target HYSpreadElevated --condition BankLendingTightening=true --aggregation weighted_avg',
  er: 'query --domain er --target OilPriceSurge --condition OPECSupplyConstraint=true --aggregation weighted_avg',
  lm: 'query --domain lm --target UnemploymentRising --condition LayoffCycleBeginning=true --aggregation weighted_avg',
  cr: 'query --domain cr --target BTCMomentumPositive --condition StablecoinFlowPositive=true --aggregation weighted_avg',
  gp: 'query --domain gp --target ConflictIntensityElevated --condition TradeDisruptionRisk=true --aggregation weighted_avg',
  sf: 'query --domain sf --target TechHiringAccelerating --condition StartupFormationRising=true --aggregation weighted_avg',
  art: 'query --domain art --target CraftPrestigeRising --condition AIImageSaturation=true --aggregation weighted_avg',
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
