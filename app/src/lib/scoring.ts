// Mirrors data/scoring-system.json (fifa-world-cup-2026-bracket-challenge).
// Used only for descriptive labels; the authoritative point totals are computed
// server-side and read from the generated JSON payloads.
export const SCORING = {
  groupStage: {
    correctPositionPerTeam: 50,
    perfectGroupBonus: 30,
  },
  knockout: {
    roundOf16: 20,
    quarterfinal: 30,
    semifinal: 40,
    final: 75,
    champion: 100,
  },
} as const;
