import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAppData } from "./loadAppData";

describe("loadAppData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed app data when the payloads are valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            metadata: {
              generatedAt: "2026-06-24T18:38:07Z",
              asOf: null,
              entrants: 1,
              scoringSystem: "fifa",
            },
            progress: {
              groupsFinalized: 0,
              roundOf16TeamsKnown: 0,
              quarterfinalTeamsKnown: 0,
              semifinalTeamsKnown: 0,
              finalTeamsKnown: 0,
              championKnown: false,
            },
            leaderboard: [
              {
                rank: 1,
                id: "dinkelberg",
                displayName: "Dinkelberg",
                totalPoints: 0,
                projectedTotalPoints: 0,
                projectedAdditionalPoints: 0,
                groupStagePoints: 0,
                knockoutPoints: 0,
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            metadata: {
              generatedAt: "2026-06-24T18:38:07Z",
              asOf: null,
              entrants: 1,
              scoringSystem: "fifa",
            },
            progress: {
              groupsFinalized: 0,
              roundOf16TeamsKnown: 0,
              quarterfinalTeamsKnown: 0,
              semifinalTeamsKnown: 0,
              finalTeamsKnown: 0,
              championKnown: false,
            },
            entries: [
              {
                id: "dinkelberg",
                displayName: "Dinkelberg",
                rank: 1,
                points: {
                  total: 0,
                  groupStage: 0,
                  knockout: 0,
                },
                groupStage: {
                  points: 0,
                  correctPositions: 0,
                  perfectGroups: [],
                  finalizedGroupsScored: 0,
                  correctPositionsByGroup: {},
                  pointsByGroup: {},
                  thirdPlaceQualifiers: {
                    predictedTeams: [],
                    actualTeams: [],
                    correctTeams: [],
                    correctCount: 0,
                    points: 0,
                    scored: false,
                  },
                },
                knockout: {
                  roundOf16: {
                    points: 0,
                    correctTeams: [],
                    predictedCount: 0,
                    actualKnownCount: 0,
                  },
                  quarterfinal: {
                    points: 0,
                    correctTeams: [],
                    predictedCount: 0,
                    actualKnownCount: 0,
                  },
                  semifinal: {
                    points: 0,
                    correctTeams: [],
                    predictedCount: 0,
                    actualKnownCount: 0,
                  },
                  final: {
                    points: 0,
                    correctTeams: [],
                    predictedCount: 0,
                    actualKnownCount: 0,
                  },
                  champion: {
                    points: 0,
                    predictedTeam: "Mexico",
                    actualTeam: null,
                    correct: false,
                  },
                  points: 0,
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            entries: [
              {
                id: "dinkelberg",
                displayName: "Dinkelberg",
                sourceImages: {
                  groupStage: "/brackets/dinkelberg_groupstage.png",
                  knockouts: "/brackets/dinkelberg_knockouts.png",
                },
                groupStage: {
                  groups: {
                    A: ["Mexico", "Czechia", "Korea Republic", "South Africa"],
                  },
                  bestThirdCandidates: [],
                  selectedBestThirdPlacedTeams: [],
                },
                knockout: {
                  roundOf32Winners: [],
                  roundOf16Winners: [],
                  quarterfinalWinners: [],
                  semifinalWinners: [],
                  runnerUp: "Croatia",
                  champion: "Mexico",
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            metadata: {
              tournament: "FIFA World Cup 2026",
              asOf: null,
              notes: "Test fixture",
              provider: "api-football",
              providerFetchedAt: null,
            },
            groupStage: {
              groups: {
                A: {
                  finalized: false,
                  standings: [],
                },
              },
              bestThirdPlacedTeams: [],
            },
            knockout: {
              roundOf16Teams: [],
              quarterfinalTeams: [],
              semifinalTeams: [],
              finalTeams: [],
              champion: null,
            },
          }),
        }),
    );

    const result = await loadAppData();
    expect(result.leaderboard.leaderboard[0].displayName).toBe("Dinkelberg");
    expect(result.brackets.entries[0].sourceImages.groupStage).toContain("dinkelberg_groupstage");
  });

  it("throws a helpful error when a payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ leaderboard: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        }),
    );

    await expect(loadAppData()).rejects.toThrow(/invalid leaderboard payload/i);
  });
});
