// Auto-categorization (escopo §3 Fase 0 [Should]): match a transaction
// description against user-defined rules. Framework-agnostic and pure so it can
// be unit-tested and reused (e.g. a future mobile app).

/** The fields the matcher needs from a CategorizationRule. */
export interface CategorizationRuleLike {
  /** Substring matched case-insensitively against the description. */
  matcher: string;
  categoryId: string;
  /** Higher wins when several rules match the same description. */
  priority: number;
}

/**
 * Pick the category id for a description, or null when no rule matches.
 * Case-insensitive substring match; highest `priority` wins, first-seen breaks
 * ties. Blank matchers are ignored.
 */
export function pickCategoryId(
  description: string,
  rules: CategorizationRuleLike[],
): string | null {
  const text = description.toLowerCase();
  let best: CategorizationRuleLike | null = null;

  for (const rule of rules) {
    const matcher = rule.matcher.trim().toLowerCase();
    if (matcher.length === 0 || !text.includes(matcher)) continue;
    if (best === null || rule.priority > best.priority) {
      best = rule;
    }
  }

  return best?.categoryId ?? null;
}
