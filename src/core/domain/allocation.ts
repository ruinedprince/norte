// Target-allocation comparison (the escopo Fase 4 rules example: "fora da alocação
// alvo"). Descriptive — the gap is a fact about a plan YOU defined, never a
// recommendation of what to buy. Pure and framework-agnostic.

export interface AllocationTargetRow {
  key: string;
  /** Current share of the portfolio, in percent (0..100). */
  currentPct: number;
  /** Target share you defined, in percent (0..100). */
  targetPct: number;
  /** currentPct − targetPct, in percentage points (positive = over target). */
  gapPp: number;
}

/**
 * Compare the current allocation (fractions 0..1 by key) against target
 * percentages (0..100 by key). Returns one row per key that has a target or a
 * holding, ordered by target (then current) descending.
 */
export function allocationVsTarget(
  current: { key: string; fraction: number }[],
  targets: Record<string, number>,
): AllocationTargetRow[] {
  const currentByKey = new Map(current.map((c) => [c.key, c.fraction]));
  const keys = new Set<string>([...currentByKey.keys(), ...Object.keys(targets)]);

  return [...keys]
    .map((key) => {
      const currentPct = (currentByKey.get(key) ?? 0) * 100;
      const targetPct = targets[key] ?? 0;
      return { key, currentPct, targetPct, gapPp: currentPct - targetPct };
    })
    .filter((row) => row.currentPct > 0 || row.targetPct > 0)
    .sort((a, b) => b.targetPct - a.targetPct || b.currentPct - a.currentPct);
}
