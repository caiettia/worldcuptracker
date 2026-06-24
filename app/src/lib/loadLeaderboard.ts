import type { LeaderboardPayload } from "../types/leaderboard";

function isLeaderboardRow(value: unknown): value is LeaderboardPayload["leaderboard"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.rank === "number" &&
    typeof row.id === "string" &&
    typeof row.displayName === "string" &&
    typeof row.totalPoints === "number" &&
    typeof row.groupStagePoints === "number" &&
    typeof row.knockoutPoints === "number"
  );
}

function isLeaderboardPayload(value: unknown): value is LeaderboardPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const progress = payload.progress as Record<string, unknown> | undefined;

  return (
    !!metadata &&
    !!progress &&
    typeof metadata.generatedAt === "string" &&
    (typeof metadata.asOf === "string" || metadata.asOf === null) &&
    typeof metadata.entrants === "number" &&
    typeof metadata.scoringSystem === "string" &&
    typeof progress.groupsFinalized === "number" &&
    typeof progress.roundOf16TeamsKnown === "number" &&
    typeof progress.quarterfinalTeamsKnown === "number" &&
    typeof progress.semifinalTeamsKnown === "number" &&
    typeof progress.finalTeamsKnown === "number" &&
    typeof progress.championKnown === "boolean" &&
    Array.isArray(payload.leaderboard) &&
    payload.leaderboard.every(isLeaderboardRow)
  );
}

export async function loadLeaderboard(): Promise<LeaderboardPayload> {
  const response = await fetch("/data/leaderboard.json");
  if (!response.ok) {
    throw new Error(`Unable to load leaderboard data (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!isLeaderboardPayload(data)) {
    throw new Error("Invalid leaderboard payload");
  }

  return data;
}
