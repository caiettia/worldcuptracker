import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLeaderboard } from "./loadLeaderboard";

describe("loadLeaderboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed leaderboard data when the payload is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          metadata: {
            generatedAt: "2026-06-24T18:38:07Z",
            asOf: null,
            entrants: 6,
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
              groupStagePoints: 0,
              knockoutPoints: 0,
            },
          ],
        }),
      }),
    );

    const result = await loadLeaderboard();
    expect(result.leaderboard[0].displayName).toBe("Dinkelberg");
  });

  it("throws a helpful error when the payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ leaderboard: null }),
      }),
    );

    await expect(loadLeaderboard()).rejects.toThrow(/invalid leaderboard payload/i);
  });
});
