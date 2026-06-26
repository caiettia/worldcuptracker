// Predictions (brackets.json) and actual results (actual-results.json) can
// spell the same nation differently -- for example the brackets list
// "Bosnia-Herzegovina" while the FIFA-sourced standings use the canonical
// "Bosnia and Herzegovina". Normalize known aliases to their canonical name so
// outcomes are compared by identity rather than by exact string. Keep this in
// sync with TEAM_NAME_ALIASES in worldcup_tracker/scoring.py.
const TEAM_NAME_ALIASES: Record<string, string> = {
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
};

export function normalizeTeamName<T extends string | null | undefined>(name: T): T {
  if (name == null) {
    return name;
  }
  return (TEAM_NAME_ALIASES[name] ?? name) as T;
}

export function teamNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a == null || b == null) {
    return false;
  }
  return normalizeTeamName(a) === normalizeTeamName(b);
}
