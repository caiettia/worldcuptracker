import { describe, expect, test } from "vitest";

import { groupForPlayer } from "./groupStage";
import type {
  ActualResultsPayload,
  BracketEntry,
  EntryProgressRow,
} from "../types/leaderboard";

function actualResults(finalized: boolean): ActualResultsPayload {
  return {
    metadata: {
      tournament: "FIFA World Cup 2026",
      asOf: null,
      notes: "test",
      provider: "test",
      providerFetchedAt: null,
    },
    groupStage: {
      groups: {
        B: {
          finalized,
          standings: ["Switzerland", "Canada", "Bosnia and Herzegovina", "Qatar"],
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
  };
}

function bracketEntry(): BracketEntry {
  return {
    id: "liz",
    displayName: "Liz",
    sourceImages: { groupStage: "", knockouts: "" },
    groupStage: {
      // Prediction uses the aliased spelling "Bosnia-Herzegovina".
      groups: { B: ["Switzerland", "Canada", "Bosnia-Herzegovina", "Qatar"] },
      bestThirdCandidates: [],
      selectedBestThirdPlacedTeams: [],
    },
    knockout: {
      roundOf32Winners: [],
      roundOf16Winners: [],
      quarterfinalWinners: [],
      semifinalWinners: [],
      runnerUp: null,
      champion: null,
    },
  };
}

describe("groupForPlayer team-name normalization", () => {
  test("treats 'Bosnia-Herzegovina' and 'Bosnia and Herzegovina' as the same team", () => {
    const result = groupForPlayer("B", actualResults(false), bracketEntry(), undefined);

    const bosniaRow = result.rows[2];
    expect(bosniaRow.actualTeam).toBe("Bosnia and Herzegovina");
    // The aliased prediction is normalized for display and marked correct.
    expect(bosniaRow.predictedTeam).toBe("Bosnia and Herzegovina");
    expect(bosniaRow.ok).toBe(true);
    // Every position now lines up.
    expect(result.rows.every((row) => row.ok)).toBe(true);
  });

  test("uses the scored breakdown once a group is finalized", () => {
    const progress = {
      groupStage: {
        correctPositionsByGroup: { B: 4 },
        perfectGroups: ["B"],
        pointsByGroup: { B: 230 },
      },
    } as unknown as EntryProgressRow;

    const result = groupForPlayer("B", actualResults(true), bracketEntry(), progress);

    expect(result.finalized).toBe(true);
    expect(result.exact).toBe(4);
    expect(result.perfect).toBe(true);
    expect(result.points).toBe(230);
  });
});
