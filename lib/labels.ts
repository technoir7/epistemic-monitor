// Display names for the engine's identifiers. The engine names things for
// machines (variant_add_X_prev->Y, UUIDs); these turn them into what a reader
// should see, in one place so every panel says the same thing.

const LAG_SUFFIX = '_prev'

/** A variable holding a signal's value one period earlier ("X_prev"). */
export function isLagged(variable: string): boolean {
  return variable.endsWith(LAG_SUFFIX)
}

/** "CreditSpreadStress_prev" → "CreditSpreadStress t-1" */
export function variableLabel(variable: string): string {
  return isLagged(variable) ? `${variable.slice(0, -LAG_SUFFIX.length)} t-1` : variable
}

// A hypothesis is named by the one edge it changes in its parent: one the
// evidence prompted (added or turned round), a blind variant (added or
// removed), a rival's connection, put in place of the leader's core, or the
// leader's core, which a trial goes without.
const CHANGE = /^(?:(?:prompted|variant)_(add|remove|reverse)|(rival|trial))_(.+)->(.+)$/
const SYMBOL: Record<string, string> = { add: '+', remove: '−', reverse: '⇄', rival: 'rival:', trial: 'without:' }

/**
 * "variant_add_A_prev->B" → "+ A t-1 → B", "variant_remove_A->B" → "− A → B",
 * "prompted_reverse_A->C" → "⇄ A → C". The starting structure
 * ("unconnected: …") is already readable and passes through.
 */
export function hypothesisLabel(name: string): string {
  const m = CHANGE.exec(name)
  if (!m) return name
  const [, change, challenger, source, target] = m
  return `${SYMBOL[change ?? challenger]} ${variableLabel(source)} → ${variableLabel(target)}`
}

/** hypothesisLabel without a description: "unconnected: …" → "unconnected". */
export function hypothesisShortLabel(name: string): string {
  return CHANGE.test(name) ? hypothesisLabel(name) : name.split(':')[0]
}

/** Enough of a UUID to tell candidates apart at a glance. */
export function shortId(id: string): string {
  return id.slice(0, 8)
}

export type LevelTone = 'high' | 'mid' | 'low'
const LEVEL_TONES: readonly string[] = ['high', 'mid', 'low']

/**
 * A graded signal's most likely level (engine D25: low, mid or high, how far
 * the measure lies from the line that names it) as a badge. Anything else is
 * a contract break, not a level to guess at.
 */
export function levelBadge(level: string): { text: string; tone: LevelTone } {
  if (!LEVEL_TONES.includes(level)) throw new Error(`not a level: ${level}`)
  return { text: level.toUpperCase(), tone: level as LevelTone }
}

// Case mechanisms (engine REFACTOR_SPEC D29): each is something true of a
// case in a year, which the engine judges as a cause of next year's outcome.
const MECHANISM: Record<string, string> = {
  nyt: 'NYT coverage',
  guardian: 'Guardian coverage',
  approval: "critics' approval",
  contested: 'contested',
  both_papers: 'in both papers',
  modality: 'predictions or doubts',
}

/** ['nyt', 'contested'] → "NYT coverage + contested"; [] → "own past alone". */
export function mechanismLabel(features: string[]): string {
  return features.length === 0 ? 'own past alone' : features.map(f => MECHANISM[f] ?? f).join(' + ')
}

/** Chance of none, one, several → the chance of one or more, as a percent. */
export function anyChance(p: number[]): string {
  const any = 1 - p[0]
  // Never round a forecast to certainty either way.
  if (any >= 0.995) return '>99%'
  if (any < 0.005) return '<1%'
  return `${Math.round(any * 100)}%`
}
