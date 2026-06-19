// Descriptive trend helpers (escopo Fase 3). These summarize a numeric series
// as it WAS over the period — never a forecast (escopo §3 forbids prediction).

/**
 * Trailing simple moving average over `window` points. Returns an array the same
 * length as `values`; entries before the window is full are null (there is no
 * average to show yet). A `window` below 1 yields all nulls.
 */
export function movingAverage(values: number[], window: number): (number | null)[] {
  if (window < 1) return values.map(() => null);
  return values.map((_, i) => {
    if (i + 1 < window) return null;
    let sum = 0;
    for (let j = i + 1 - window; j <= i; j += 1) sum += values[j];
    return sum / window;
  });
}

/**
 * Least-squares slope of `values` against their index (0, 1, 2, …). With monthly
 * points the unit is "per month". Returns null with fewer than two points. It
 * describes the period's direction — it is not extrapolated into the future.
 */
export function linearTrendSlope(values: number[]): number | null {
  const n = values.length;
  if (n < 2) return null;

  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, v) => sum + v, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX;
    numerator += dx * (values[i] - meanY);
    denominator += dx * dx;
  }
  return denominator === 0 ? null : numerator / denominator;
}
