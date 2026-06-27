import type {
  ActualResultsPayload,
  AppData,
  BracketsPayload,
  EntryProgressPayload,
  LeaderboardPayload,
} from "../types/leaderboard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isLeaderboardRow(value: unknown): value is LeaderboardPayload["leaderboard"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.rank === "number" &&
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    typeof value.totalPoints === "number" &&
    typeof value.projectedTotalPoints === "number" &&
    typeof value.projectedAdditionalPoints === "number" &&
    typeof value.groupStagePoints === "number" &&
    typeof value.knockoutPoints === "number"
  );
}

function isProgress(value: unknown): value is LeaderboardPayload["progress"] {
  return (
    isRecord(value) &&
    typeof value.groupsFinalized === "number" &&
    typeof value.roundOf16TeamsKnown === "number" &&
    typeof value.quarterfinalTeamsKnown === "number" &&
    typeof value.semifinalTeamsKnown === "number" &&
    typeof value.finalTeamsKnown === "number" &&
    typeof value.championKnown === "boolean"
  );
}

function isMetadata(value: unknown): value is LeaderboardPayload["metadata"] {
  return (
    isRecord(value) &&
    typeof value.generatedAt === "string" &&
    (typeof value.asOf === "string" || value.asOf === null) &&
    typeof value.entrants === "number" &&
    typeof value.scoringSystem === "string"
  );
}

function isLeaderboardPayload(value: unknown): value is LeaderboardPayload {
  return (
    isRecord(value) &&
    isMetadata(value.metadata) &&
    isProgress(value.progress) &&
    Array.isArray(value.leaderboard) &&
    value.leaderboard.every(isLeaderboardRow)
  );
}

function isKnockoutRoundBreakdown(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.points === "number" &&
    isStringArray(value.correctTeams) &&
    typeof value.predictedCount === "number" &&
    typeof value.actualKnownCount === "number"
  );
}

function isThirdPlaceQualifierBreakdown(value: unknown): boolean {
  return (
    isRecord(value) &&
    isStringArray(value.predictedTeams) &&
    isStringArray(value.actualTeams) &&
    isStringArray(value.correctTeams) &&
    typeof value.correctCount === "number" &&
    typeof value.points === "number" &&
    typeof value.scored === "boolean"
  );
}

function isEntryProgressPayload(value: unknown): value is EntryProgressPayload {
  if (!(isRecord(value) && isMetadata(value.metadata) && isProgress(value.progress) && Array.isArray(value.entries))) {
    return false;
  }

  return value.entries.every((entry) => {
    if (!isRecord(entry) || !isRecord(entry.points) || !isRecord(entry.groupStage) || !isRecord(entry.knockout)) {
      return false;
    }

    return (
      typeof entry.id === "string" &&
      typeof entry.displayName === "string" &&
      typeof entry.rank === "number" &&
      typeof entry.points.total === "number" &&
      typeof entry.points.groupStage === "number" &&
      typeof entry.points.knockout === "number" &&
      typeof entry.groupStage.points === "number" &&
      typeof entry.groupStage.correctPositions === "number" &&
      Array.isArray(entry.groupStage.perfectGroups) &&
      entry.groupStage.perfectGroups.every((group) => typeof group === "string") &&
      typeof entry.groupStage.finalizedGroupsScored === "number" &&
      isRecord(entry.groupStage.correctPositionsByGroup) &&
      Object.values(entry.groupStage.correctPositionsByGroup).every((count) => typeof count === "number") &&
      isRecord(entry.groupStage.pointsByGroup) &&
      Object.values(entry.groupStage.pointsByGroup).every((count) => typeof count === "number") &&
      isThirdPlaceQualifierBreakdown(entry.groupStage.thirdPlaceQualifiers) &&
      isKnockoutRoundBreakdown(entry.knockout.roundOf16) &&
      isKnockoutRoundBreakdown(entry.knockout.quarterfinal) &&
      isKnockoutRoundBreakdown(entry.knockout.semifinal) &&
      isKnockoutRoundBreakdown(entry.knockout.final) &&
      isRecord(entry.knockout.champion) &&
      typeof entry.knockout.champion.points === "number" &&
      (typeof entry.knockout.champion.predictedTeam === "string" ||
        entry.knockout.champion.predictedTeam === null) &&
      (typeof entry.knockout.champion.actualTeam === "string" || entry.knockout.champion.actualTeam === null) &&
      typeof entry.knockout.champion.correct === "boolean" &&
      typeof entry.knockout.points === "number"
    );
  });
}

function isBracketsPayload(value: unknown): value is BracketsPayload {
  if (!(isRecord(value) && Array.isArray(value.entries))) {
    return false;
  }

  return value.entries.every((entry) => {
    if (
      !isRecord(entry) ||
      !isRecord(entry.sourceImages) ||
      !isRecord(entry.groupStage) ||
      !isRecord(entry.groupStage.groups) ||
      !isRecord(entry.knockout)
    ) {
      return false;
    }

    return (
      typeof entry.id === "string" &&
      typeof entry.displayName === "string" &&
      typeof entry.sourceImages.groupStage === "string" &&
      typeof entry.sourceImages.knockouts === "string" &&
      Object.values(entry.groupStage.groups).every(isStringArray) &&
      Array.isArray(entry.groupStage.bestThirdCandidates) &&
      entry.groupStage.bestThirdCandidates.every(
        (candidate) =>
          isRecord(candidate) &&
          typeof candidate.team === "string" &&
          typeof candidate.selected === "boolean",
      ) &&
      isStringArray(entry.groupStage.selectedBestThirdPlacedTeams) &&
      isStringArray(entry.knockout.roundOf32Winners) &&
      isStringArray(entry.knockout.roundOf16Winners) &&
      isStringArray(entry.knockout.quarterfinalWinners) &&
      isStringArray(entry.knockout.semifinalWinners) &&
      (typeof entry.knockout.runnerUp === "string" || entry.knockout.runnerUp === null) &&
      (typeof entry.knockout.champion === "string" || entry.knockout.champion === null)
    );
  });
}

function isActualResultsPayload(value: unknown): value is ActualResultsPayload {
  if (
    !(
      isRecord(value) &&
      isRecord(value.metadata) &&
      isRecord(value.groupStage) &&
      isRecord(value.groupStage.groups) &&
      isRecord(value.knockout)
    )
  ) {
    return false;
  }

  return (
    typeof value.metadata.tournament === "string" &&
    (typeof value.metadata.asOf === "string" || value.metadata.asOf === null) &&
    typeof value.metadata.notes === "string" &&
    typeof value.metadata.provider === "string" &&
    (typeof value.metadata.providerFetchedAt === "string" || value.metadata.providerFetchedAt === null) &&
    Object.values(value.groupStage.groups).every(
      (group) =>
        isRecord(group) && typeof group.finalized === "boolean" && isStringArray(group.standings),
    ) &&
    isStringArray(value.groupStage.bestThirdPlacedTeams) &&
    isStringArray(value.knockout.roundOf16Teams) &&
    isStringArray(value.knockout.quarterfinalTeams) &&
    isStringArray(value.knockout.semifinalTeams) &&
    isStringArray(value.knockout.finalTeams) &&
    (typeof value.knockout.champion === "string" || value.knockout.champion === null)
  );
}

async function loadJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path} (${response.status})`);
  }

  return response.json();
}

export async function loadAppData(): Promise<AppData> {
  const [leaderboard, entryProgress, brackets, actualResults] = await Promise.all([
    loadJson("/data/leaderboard.json"),
    loadJson("/data/entry-progress.json"),
    loadJson("/data/brackets.json"),
    loadJson("/data/actual-results.json"),
  ]);

  if (!isLeaderboardPayload(leaderboard)) {
    throw new Error("Invalid leaderboard payload");
  }

  if (!isEntryProgressPayload(entryProgress)) {
    throw new Error("Invalid entry progress payload");
  }

  if (!isBracketsPayload(brackets)) {
    throw new Error("Invalid brackets payload");
  }

  if (!isActualResultsPayload(actualResults)) {
    throw new Error("Invalid actual results payload");
  }

  return {
    leaderboard,
    entryProgress,
    brackets,
    actualResults,
  };
}
