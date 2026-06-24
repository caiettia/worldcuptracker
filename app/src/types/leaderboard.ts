export type LeaderboardRow = {
  rank: number;
  id: string;
  displayName: string;
  totalPoints: number;
  groupStagePoints: number;
  knockoutPoints: number;
};

export type LeaderboardProgress = {
  groupsFinalized: number;
  roundOf16TeamsKnown: number;
  quarterfinalTeamsKnown: number;
  semifinalTeamsKnown: number;
  finalTeamsKnown: number;
  championKnown: boolean;
};

export type LeaderboardMetadata = {
  generatedAt: string;
  asOf: string | null;
  entrants: number;
  scoringSystem: string;
};

export type LeaderboardPayload = {
  metadata: LeaderboardMetadata;
  progress: LeaderboardProgress;
  leaderboard: LeaderboardRow[];
};
