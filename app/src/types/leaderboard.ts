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

export type GroupPredictions = Record<string, string[]>;

export type GroupStageBreakdown = {
  points: number;
  correctPositions: number;
  perfectGroups: string[];
  finalizedGroupsScored: number;
  correctPositionsByGroup: Record<string, number>;
  pointsByGroup: Record<string, number>;
};

export type KnockoutRoundBreakdown = {
  points: number;
  correctTeams: string[];
  predictedCount: number;
  actualKnownCount: number;
};

export type KnockoutChampionBreakdown = {
  points: number;
  predictedTeam: string | null;
  actualTeam: string | null;
  correct: boolean;
};

export type EntryKnockoutBreakdown = {
  roundOf16: KnockoutRoundBreakdown;
  quarterfinal: KnockoutRoundBreakdown;
  semifinal: KnockoutRoundBreakdown;
  final: KnockoutRoundBreakdown;
  champion: KnockoutChampionBreakdown;
  points: number;
};

export type EntryProgressRow = {
  id: string;
  displayName: string;
  rank: number;
  points: {
    total: number;
    groupStage: number;
    knockout: number;
  };
  groupStage: GroupStageBreakdown;
  knockout: EntryKnockoutBreakdown;
};

export type EntryProgressPayload = {
  metadata: LeaderboardMetadata;
  progress: LeaderboardProgress;
  entries: EntryProgressRow[];
};

export type BracketEntry = {
  id: string;
  displayName: string;
  sourceImages: {
    groupStage: string;
    knockouts: string;
  };
  groupStage: {
    groups: GroupPredictions;
    bestThirdCandidates: Array<{
      team: string;
      selected: boolean;
    }>;
    selectedBestThirdPlacedTeams: string[];
  };
  knockout: {
    roundOf32Winners: string[];
    roundOf16Winners: string[];
    quarterfinalWinners: string[];
    semifinalWinners: string[];
    runnerUp: string | null;
    champion: string | null;
  };
};

export type BracketsPayload = {
  entries: BracketEntry[];
};

export type ActualResultsPayload = {
  metadata: {
    tournament: string;
    asOf: string | null;
    notes: string;
    provider: string;
    providerFetchedAt: string | null;
  };
  groupStage: {
    groups: Record<
      string,
      {
        finalized: boolean;
        standings: string[];
      }
    >;
    bestThirdPlacedTeams: string[];
  };
  knockout: {
    roundOf16Teams: string[];
    quarterfinalTeams: string[];
    semifinalTeams: string[];
    finalTeams: string[];
    champion: string | null;
  };
};

export type AppData = {
  leaderboard: LeaderboardPayload;
  entryProgress: EntryProgressPayload;
  brackets: BracketsPayload;
  actualResults: ActualResultsPayload;
};
