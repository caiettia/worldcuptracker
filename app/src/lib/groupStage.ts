import type {
  ActualResultsPayload,
  BracketEntry,
  EntryProgressRow,
} from "../types/leaderboard";
import { normalizeTeamName, teamNamesMatch } from "./teamNames";

export type ComparisonRow = {
  pos: number;
  actualTeam: string | null;
  predictedTeam: string | null;
  ok: boolean;
};

export type GroupForPlayer = {
  groupId: string;
  finalized: boolean;
  points: number | null; // null => not yet scored (group pending)
  exact: number;
  perfect: boolean;
  rows: ComparisonRow[];
};

export function groupKeys(actualResults: ActualResultsPayload): string[] {
  return Object.keys(actualResults.groupStage.groups).sort();
}

function buildRows(actualStandings: string[], predictedStandings: string[]): ComparisonRow[] {
  const size = Math.max(actualStandings.length, predictedStandings.length);
  const rows: ComparisonRow[] = [];
  for (let i = 0; i < size; i += 1) {
    const actualTeam = normalizeTeamName(actualStandings[i] ?? null);
    const predictedTeam = normalizeTeamName(predictedStandings[i] ?? null);
    rows.push({
      pos: i + 1,
      actualTeam,
      predictedTeam,
      ok: teamNamesMatch(actualTeam, predictedTeam),
    });
  }
  return rows;
}

export function groupForPlayer(
  groupId: string,
  actualResults: ActualResultsPayload,
  bracketEntry: BracketEntry | undefined,
  progressEntry: EntryProgressRow | undefined,
): GroupForPlayer {
  const actualGroup = actualResults.groupStage.groups[groupId];
  const actualStandings = actualGroup?.standings ?? [];
  const predictedStandings = bracketEntry?.groupStage.groups[groupId] ?? [];
  const finalized = actualGroup?.finalized ?? false;
  const rows = buildRows(actualStandings, predictedStandings);

  const liveExact = rows.filter((r) => r.ok).length;
  const exact = finalized
    ? progressEntry?.groupStage.correctPositionsByGroup[groupId] ?? liveExact
    : liveExact;
  const perfect = finalized
    ? progressEntry?.groupStage.perfectGroups.includes(groupId) ?? false
    : false;
  const points = finalized ? progressEntry?.groupStage.pointsByGroup[groupId] ?? 0 : null;

  return { groupId, finalized, points, exact, perfect, rows };
}
