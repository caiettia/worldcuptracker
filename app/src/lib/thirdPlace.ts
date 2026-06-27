import type {
  ActualResultsPayload,
  ThirdPlaceQualifierBreakdown,
} from "../types/leaderboard";
import { normalizeTeamName } from "./teamNames";

// A group's third-placed team and whether it ended up among the best thirds that
// advance to the knockout stage.
export type ThirdPlaceTeam = {
  team: string;
  group: string;
  advanced: boolean;
};

export type ThirdPlaceRanking = {
  teams: ThirdPlaceTeam[];
  advanceCount: number; // how many third-placed teams advance (e.g. 8)
  totalSlots: number; // how many groups produce a third-placed team (e.g. 12)
  allFinalized: boolean; // every group that contributes a third has been finalized
};

// One row in the "how everyone scored" comparison: for a given team, what the
// tournament did (advanced or out) versus what the entrant called.
export type ThirdPlaceCallRow = {
  team: string;
  group: string | null;
  actualAdv: boolean;
  pickedAdv: boolean;
  ok: boolean;
};

function normalizedSet(teams: string[]): Set<string> {
  return new Set(teams.map((t) => normalizeTeamName(t)));
}

// Build the field of third-placed teams from the actual standings: each group's
// third-placed side (index 2), flagged with whether it made the best-thirds cut.
// Advancing teams sort to the top since the source data carries no finer rank.
export function actualThirdPlaceRanking(actualResults: ActualResultsPayload): ThirdPlaceRanking {
  const groups = actualResults.groupStage.groups;
  const bestThirds = normalizedSet(actualResults.groupStage.bestThirdPlacedTeams);

  let allFinalized = true;
  const teams: ThirdPlaceTeam[] = [];
  Object.keys(groups)
    .sort()
    .forEach((groupId) => {
      const group = groups[groupId];
      const team = group?.standings?.[2];
      if (!team) {
        return;
      }
      if (!group.finalized) {
        allFinalized = false;
      }
      teams.push({
        team,
        group: groupId,
        advanced: bestThirds.has(normalizeTeamName(team)),
      });
    });

  teams.sort((a, b) => {
    if (a.advanced !== b.advanced) {
      return a.advanced ? -1 : 1;
    }
    return a.group.localeCompare(b.group);
  });

  return {
    teams,
    advanceCount: actualResults.groupStage.bestThirdPlacedTeams.length,
    totalSlots: teams.length,
    allFinalized,
  };
}

// Project an entrant's set-based third-place picks onto an ADV/OUT call for every
// team in play: the union of the teams that actually advanced and the teams the
// entrant backed. A team the entrant picked that did not advance reads as a wrong
// ADV call; an advancing team they skipped reads as a missed call.
export function thirdPlaceCalls(
  qualifiers: ThirdPlaceQualifierBreakdown,
  ranking: ThirdPlaceRanking,
): ThirdPlaceCallRow[] {
  const actualAdvSet = normalizedSet(qualifiers.actualTeams);
  const pickedSet = normalizedSet(qualifiers.predictedTeams);
  const groupByTeam = new Map(ranking.teams.map((t) => [normalizeTeamName(t.team), t.group]));

  const order: string[] = [];
  const seen = new Set<string>();
  const add = (team: string) => {
    const key = normalizeTeamName(team);
    if (!seen.has(key)) {
      seen.add(key);
      order.push(team);
    }
  };
  qualifiers.actualTeams.forEach(add);
  qualifiers.predictedTeams.forEach(add);

  const rows = order.map((team) => {
    const key = normalizeTeamName(team);
    const actualAdv = actualAdvSet.has(key);
    const pickedAdv = pickedSet.has(key);
    return {
      team,
      group: groupByTeam.get(key) ?? null,
      actualAdv,
      pickedAdv,
      ok: actualAdv === pickedAdv,
    };
  });

  rows.sort((a, b) => {
    if (a.actualAdv !== b.actualAdv) {
      return a.actualAdv ? -1 : 1;
    }
    if (a.pickedAdv !== b.pickedAdv) {
      return a.pickedAdv ? -1 : 1;
    }
    return a.team.localeCompare(b.team);
  });

  return rows;
}
