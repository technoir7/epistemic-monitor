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

// Variants are named by the one edge they add to or remove from their parent.
const VARIANT = /^variant_(add|remove)_(.+)->(.+)$/

/**
 * "variant_add_A_prev->B" → "+ A t-1 → B", "variant_remove_A->B" → "− A → B".
 * Seed hypotheses ("T_persistence: …") are already readable and pass through.
 */
export function hypothesisLabel(name: string): string {
  const m = VARIANT.exec(name)
  if (!m) return name
  const [, op, source, target] = m
  return `${op === 'add' ? '+' : '−'} ${variableLabel(source)} → ${variableLabel(target)}`
}

/** hypothesisLabel without a seed's description: "T_persistence: …" → "T_persistence". */
export function hypothesisShortLabel(name: string): string {
  return VARIANT.test(name) ? hypothesisLabel(name) : name.split(':')[0]
}

/** Enough of a UUID to tell candidates apart at a glance. */
export function shortId(id: string): string {
  return id.slice(0, 8)
}
