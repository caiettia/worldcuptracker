import { SCORING } from "./scoring";
import { normalizeTeamName } from "./teamNames";
import type { BracketEntry, EntryProgressRow, KnockoutRoundBreakdown } from "../types/leaderboard";

export type MatchTeam = { name: string; advanced: boolean };

export type KnockoutMatch = {
  id: string;
  teams: MatchTeam[];
  winnerName: string | null;
  status: "pending" | "correct" | "wrong";
};

export type KnockoutRound = {
  name: string;
  pointsPerMatch: number;
  pointsEarned: number;
  matches: KnockoutMatch[];
};

function pairUp(teams: string[]): string[][] {
  const pairs: string[][] = [];
  for (let i = 0; i < teams.length; i += 2) {
    pairs.push(teams.slice(i, i + 2));
  }
  return pairs;
}

// Reconstruct matchups from the set-based knockout data. Within each round the
// competitors are the teams predicted to reach it; consecutive pairs are the
// actual matchups, and the predicted winner is whichever team also appears in
// the next round's list. Correctness is read from the scored breakdown for the
// round the winner advances into.
function buildRound(
  name: string,
  competitors: string[],
  winners: string[],
  pointsPerMatch: number,
  breakdown: { correctTeams: string[]; actualKnownCount: number; points: number },
): KnockoutRound {
  const winnerSet = new Set(winners);
  const correctSet = new Set(breakdown.correctTeams.map(normalizeTeamName));
  const known = breakdown.actualKnownCount > 0;

  const matches = pairUp(competitors).map((pair, index) => {
    const winnerName = pair.find((team) => winnerSet.has(team)) ?? null;
    const teams: MatchTeam[] = pair.map((teamName) => ({
      name: teamName,
      advanced: teamName === winnerName,
    }));
    let status: KnockoutMatch["status"] = "pending";
    if (known && winnerName) {
      status = correctSet.has(normalizeTeamName(winnerName)) ? "correct" : "wrong";
    }
    return { id: `${name}-${index}`, teams, winnerName, status };
  });

  return { name, pointsPerMatch, pointsEarned: breakdown.points, matches };
}

export function knockoutRounds(entry: BracketEntry, progress: EntryProgressRow): KnockoutRound[] {
  const k = entry.knockout;
  const ko = progress.knockout;

  // The Final's winner is the champion, scored by the champion breakdown.
  const championBreakdown: KnockoutRoundBreakdown = {
    points: ko.champion.points,
    correctTeams: ko.champion.correct && ko.champion.actualTeam ? [ko.champion.actualTeam] : [],
    predictedCount: ko.champion.predictedTeam ? 1 : 0,
    actualKnownCount: ko.champion.actualTeam ? 1 : 0,
  };

  return [
    buildRound("Round of 16", k.roundOf32Winners, k.roundOf16Winners, SCORING.knockout.quarterfinal, ko.quarterfinal),
    buildRound("Quarterfinals", k.roundOf16Winners, k.quarterfinalWinners, SCORING.knockout.semifinal, ko.semifinal),
    buildRound("Semifinals", k.quarterfinalWinners, k.semifinalWinners, SCORING.knockout.final, ko.final),
    buildRound("Final", k.semifinalWinners, k.champion ? [k.champion] : [], SCORING.knockout.champion, championBreakdown),
  ];
}

export function totalMatches(rounds: KnockoutRound[]): number {
  return rounds.reduce((sum, round) => sum + round.matches.length, 0);
}
