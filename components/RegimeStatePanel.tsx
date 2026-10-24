'use client'

import useSWR from 'swr'
import type { Domain } from '@/lib/types'
import { queryInference } from '@/lib/api'

const POLL = 30_000

// The regime variables each domain shows, in display order, with the short
// label for the row. Art has its own panel: grouped variables, nullable values.
const REGIMES = {
  mr: {
    name: 'Macro',
    variables: [
      ['YieldCurveInverted', 'YIELD_CURVE_INV'],
      ['InflationShock',     'INFLATION_SHOCK'],
      ['LiquidityStress',    'LIQUIDITY_STRESS'],
      ['CreditSpreadStress', 'CREDIT_SPREAD'],
      ['VolatilityShock',    'VOLATILITY_SHOCK'],
      ['DollarStrength',     'DOLLAR_STRENGTH'],
      ['EquityRiskOn',       'EQUITY_RISK_ON'],
      ['AIRiskOn',           'AI_RISK_ON'],
    ],
  },
  ai: {
    name: 'AI',
    variables: [
      ['SemiconductorMomentum',        'SEMICON_MOMENTUM'],
      ['MarketConcentrationExtreme',   'MKT_CONCENTRATION'],
      ['HyperscalerCapexAccelerating', 'HYPERSCALER_CAPEX'],
      ['TechValuationDetached',        'TECH_VAL_DETACHED'],
      ['IPInvestmentRising',           'IP_INVEST_RISING'],
      ['LaborProductivityImproving',   'LABOR_PROD_IMPROV'],
      ['BroadEconomicLift',            'BROAD_ECON_LIFT'],
      ['AIRiskPremiumCompressed',      'AI_RISK_COMPRESSED'],
    ],
  },
  sd: {
    name: 'Sovereign debt',
    variables: [
      ['USYieldSpiking',             'US_YIELD_SPIKING'],
      ['SpreadWidening',             'SPREAD_WIDENING'],
      ['DollarStrengthening',        'DOLLAR_STRENGTH'],
      ['FedBalanceSheetShrinking',   'FED_BS_SHRINKING'],
      ['EMStressElevated',           'EM_STRESS_ELEV'],
      ['FiscalDominanceRisk',        'FISCAL_DOM_RISK'],
      ['CreditDefaultRisk',          'CREDIT_DEFAULT'],
      ['GlobalLiquidityContracting', 'GLOBAL_LIQ_CONT'],
    ],
  },
  cc: {
    name: 'Credit cycle',
    variables: [
      ['HYSpreadElevated',         'HY_SPREAD_ELEV'],
      ['LeveragedLoanStress',      'LEV_LOAN_STRESS'],
      ['CorporateDefaultRisk',     'CORP_DEFAULT_RISK'],
      ['CreditImpulseNegative',    'CREDIT_IMP_NEG'],
      ['BankLendingTightening',    'BANK_LEND_TIGHT'],
      ['InvestmentGradeSpread',    'IG_SPREAD'],
      ['HighYieldIssuanceFalling', 'HY_ISSUE_FALLING'],
      ['RefinancingStress',        'REFI_STRESS'],
    ],
  },
  er: {
    name: 'Energy',
    variables: [
      ['OilPriceSurge',             'OIL_PRICE_SURGE'],
      ['NatGasPriceSurge',          'NATGAS_SURGE'],
      ['EnergyEquityMomentum',      'ENERGY_EQ_MOM'],
      ['OPECSupplyConstraint',      'OPEC_SUPPLY_CNST'],
      ['RenewablesDisplacement',    'RENEW_DISPLACE'],
      ['EnergyInflationPersistent', 'ENERGY_INF_PERS'],
      ['GeopoliticalRiskElevated',  'GEO_RISK_ELEV'],
      ['DemandDestructionRisk',     'DEMAND_DESTR'],
    ],
  },
  lm: {
    name: 'Labor market',
    variables: [
      ['UnemploymentRising',       'UNEMPLOYMENT_RISE'],
      ['WageInflationPersistent',  'WAGE_INF_PERS'],
      ['JobOpeningsFalling',       'JOB_OPEN_FALLING'],
      ['LayoffCycleBeginning',     'LAYOFF_CYCLE_BEG'],
      ['LaborProductivityWeak',    'LABOR_PROD_WEAK'],
      ['ParticipationRateFalling', 'PARTIC_RATE_FALL'],
      ['RealWageGrowthPositive',   'REAL_WAGE_POS'],
      ['TightLaborMarket',         'TIGHT_LABOR_MKT'],
    ],
  },
  cr: {
    name: 'Crypto',
    variables: [
      ['BTCMomentumPositive',       'BTC_MOMENTUM_POS'],
      ['AltcoinSeasonActive',       'ALTCOIN_SEASON'],
      ['OnChainActivityElevated',   'ONCHAIN_ACTIVITY'],
      ['StablecoinFlowPositive',    'STABLECOIN_FLOW'],
      ['CryptoVolatilityShock',     'CRYPTO_VOL_SHOCK'],
      ['RiskAssetCorrelation',      'RISK_ASSET_CORR'],
      ['NarrativeMomentum',         'NARRATIVE_MOMO'],
      ['DollarDebasementNarrative', 'USD_DEBASE_NARR'],
    ],
  },
  gp: {
    name: 'Geopolitical',
    variables: [
      ['ConflictIntensityElevated', 'CONFLICT_INTENS'],
      ['TradeDisruptionRisk',       'TRADE_DISRUPT'],
      ['SanctionsPressureElevated', 'SANCTIONS_PRESS'],
      ['DiplomaticTensionHigh',     'DIPLOMATIC_TENS'],
      ['SupplyChainStress',         'SUPPLY_CHN_STRSS'],
      ['CurrencyWarSignal',         'CURRENCY_WAR'],
      ['EnergyWeaponizationRisk',   'ENERGY_WEAPON'],
      ['GlobalTradeVolumeWeak',     'TRADE_VOL_WEAK'],
    ],
  },
  sf: {
    name: 'SF urban',
    variables: [
      ['TechHiringAccelerating', 'TECH_HIRING_ACC'],
      ['OfficeVacancyFalling',   'OFFICE_VAC_FALL'],
      ['RetailClosureElevated',  'RETAIL_CLOSURE'],
      ['PermitActivityRising',   'PERMIT_ACTIVITY'],
      ['CrimeIndexElevated',     'CRIME_INDEX_ELV'],
      ['StartupFormationRising', 'STARTUP_FORM_RIS'],
      ['FootTrafficRecovering',  'FOOT_TRAFFIC_REC'],
      ['PopulationFlowPositive', 'POP_FLOW_POS'],
    ],
  },
} satisfies Partial<Record<Domain, { name: string; variables: [string, string][] }>>

export type RegimeDomain = keyof typeof REGIMES

type RegimeProbabilityMap = Record<string, number>

async function fetchVariableProbabilities(
  [, domain]: [string, RegimeDomain],
): Promise<RegimeProbabilityMap> {
  const entries = await Promise.all(
    REGIMES[domain].variables.map(async ([name]) => {
      const json = await queryInference({ domain, target_variable: name })
      if (typeof json.target_probability !== 'number') {
        throw new Error(`missing target_probability for ${name}`)
      }

      return [name, json.target_probability] as const
    }),
  )

  return Object.fromEntries(entries)
}

interface Props {
  domain: RegimeDomain
}

export default function RegimeStatePanel({ domain }: Props) {
  const { data, error } = useSWR<RegimeProbabilityMap>(
    ['regime-probabilities', domain],
    fetchVariableProbabilities,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  if (error) {
    return (
      <div className="panel regime-panel">
        <div className="panel-label" style={{ color: 'var(--red)' }}>
          regime_state · API ERROR
        </div>
        <div style={{ color: 'var(--red-dim)', fontSize: 10, padding: '4px 0' }}>
          {String(error.message ?? '/v1/inference/query unreachable')}
        </div>
      </div>
    )
  }

  return (
    <div className="panel regime-panel">
      <div className="panel-label has-tip">
        regime_state{data ? ' · current' : ' · loading…'}
        <div className="tip" style={{ left: 0, transform: 'none' }}>
          {REGIMES[domain].name} regime variables for the current evidence cycle. Each variable
          shows the system&apos;s posterior state (TRUE/FALSE) and the probability
          assigned to that state. Variables near 0.50 are genuinely uncertain.
        </div>
      </div>

      <div className="regime-var-list">
        {!data && (
          <div style={{ color: 'var(--text-faint)', fontSize: 10 }}>loading…</div>
        )}

        {data && REGIMES[domain].variables.map(([name, label]) => {
          const prob = data[name]
          const state = prob >= 0.5

          // Colour-code by state and confidence
          const stateClass = state ? 'state-true' : 'state-false'
          const isHighConf = prob >= 0.70
          const fillClass  = state
            ? (isHighConf ? 'regime-prob-fill--true-hi' : 'regime-prob-fill--true-lo')
            : 'regime-prob-fill--false'
          const probColor  = state
            ? (isHighConf ? 'var(--green)' : 'var(--text-mid)')
            : 'var(--text-faint)'

          return (
            <div key={name} className="regime-var-row">
              <div className="regime-var-name">{label}</div>

              <div className={`regime-var-badge ${stateClass}`}>
                {state ? 'TRUE' : 'FALSE'}
              </div>

              <div className="regime-var-prob-wrap">
                <div className="regime-prob-track">
                  <div
                    className={`regime-prob-fill ${fillClass}`}
                    style={{ width: `${(prob * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="regime-prob-num" style={{ color: probColor }}>
                  {prob.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
