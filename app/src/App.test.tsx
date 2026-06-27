import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

const mockLoadAppData = vi.fn();

vi.mock("./lib/loadAppData", () => ({
  loadAppData: () => mockLoadAppData(),
}));

const appData = {
  leaderboard: {
    metadata: { generatedAt: "2026-06-24T18:38:07Z", asOf: null, entrants: 2, scoringSystem: "fifa" },
    progress: {
      groupsFinalized: 1,
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
        totalPoints: 95,
        projectedTotalPoints: 135,
        projectedAdditionalPoints: 40,
        groupStagePoints: 65,
        knockoutPoints: 30,
      },
      {
        rank: 2,
        id: "nfry",
        displayName: "NFry",
        totalPoints: 80,
        projectedTotalPoints: 110,
        projectedAdditionalPoints: 30,
        groupStagePoints: 50,
        knockoutPoints: 30,
      },
    ],
  },
  entryProgress: {
    metadata: { generatedAt: "2026-06-24T18:38:07Z", asOf: null, entrants: 2, scoringSystem: "fifa" },
    progress: {
      groupsFinalized: 1,
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
        points: { total: 95, groupStage: 65, knockout: 30 },
        groupStage: {
          points: 65,
          correctPositions: 1,
          perfectGroups: [],
          finalizedGroupsScored: 1,
          correctPositionsByGroup: { A: 1 },
          pointsByGroup: { A: 50 },
          thirdPlaceQualifiers: {
            predictedTeams: ["Senegal", "Sweden", "Paraguay"],
            actualTeams: ["Senegal", "Paraguay", "Bosnia and Herzegovina"],
            correctTeams: ["Paraguay", "Senegal"],
            correctCount: 2,
            points: 15,
            scored: true,
          },
        },
        knockout: {
          roundOf16: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          quarterfinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          semifinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          final: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          champion: { points: 0, predictedTeam: "Mexico", actualTeam: null, correct: false },
          points: 0,
        },
      },
      {
        id: "nfry",
        displayName: "NFry",
        rank: 2,
        points: { total: 80, groupStage: 50, knockout: 30 },
        groupStage: {
          points: 50,
          correctPositions: 1,
          perfectGroups: [],
          finalizedGroupsScored: 1,
          correctPositionsByGroup: { A: 1 },
          pointsByGroup: { A: 50 },
          thirdPlaceQualifiers: {
            predictedTeams: ["Sweden"],
            actualTeams: ["Senegal", "Paraguay", "Bosnia and Herzegovina"],
            correctTeams: [],
            correctCount: 0,
            points: 0,
            scored: false,
          },
        },
        knockout: {
          roundOf16: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          quarterfinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          semifinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          final: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          champion: { points: 0, predictedTeam: "Spain", actualTeam: null, correct: false },
          points: 0,
        },
      },
    ],
  },
  brackets: {
    entries: [
      {
        id: "dinkelberg",
        displayName: "Dinkelberg",
        sourceImages: {
          groupStage: "/brackets/dinkelberg_groupstage.png",
          knockouts: "/brackets/dinkelberg_knockouts.png",
        },
        groupStage: {
          groups: { A: ["Mexico", "Czechia", "Korea Republic", "South Africa"] },
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
      {
        id: "nfry",
        displayName: "NFry",
        sourceImages: { groupStage: "/brackets/nfry_groupstage.jpeg", knockouts: "/brackets/nfry_knockouts.jpeg" },
        groupStage: {
          groups: { A: ["Mexico", "Korea Republic", "Czechia", "South Africa"] },
          bestThirdCandidates: [],
          selectedBestThirdPlacedTeams: [],
        },
        knockout: {
          roundOf32Winners: [],
          roundOf16Winners: [],
          quarterfinalWinners: [],
          semifinalWinners: [],
          runnerUp: "England",
          champion: "Spain",
        },
      },
    ],
  },
  actualResults: {
    metadata: {
      tournament: "FIFA World Cup 2026",
      asOf: "2026-06-25T00:00:00Z",
      notes: "Test fixture",
      provider: "api-football",
      providerFetchedAt: "2026-06-25T00:00:00Z",
    },
    groupStage: {
      groups: {
        A: { finalized: true, standings: ["Mexico", "Korea Republic", "Czechia", "South Africa"] },
        B: { finalized: false, standings: ["Switzerland", "Canada", "Bosnia and Herzegovina", "Qatar"] },
      },
      bestThirdPlacedTeams: [],
    },
    knockout: { roundOf16Teams: [], quarterfinalTeams: [], semifinalTeams: [], finalTeams: [], champion: null },
  },
};

beforeEach(() => {
  mockLoadAppData.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

test("renders loading state before data resolves", () => {
  mockLoadAppData.mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
});

test("renders error state when loading fails", async () => {
  mockLoadAppData.mockRejectedValue(new Error("boom"));
  render(<App />);
  expect(await screen.findByText(/unable to load the leaderboard/i)).toBeInTheDocument();
});

test("renders the leaderboard with players, points and the three nav tabs", async () => {
  mockLoadAppData.mockResolvedValue(appData);
  render(<App />);

  expect(await screen.findByRole("button", { name: /view dinkelberg predictions/i })).toBeInTheDocument();
  expect(screen.getAllByText("Dinkelberg").length).toBeGreaterThan(0);
  expect(screen.getAllByText("95").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /^leaderboard$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^groups$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^bracket$/i })).toBeInTheDocument();
});

test("clicking a player opens their group-stage breakdown with actual vs predicted", async () => {
  mockLoadAppData.mockResolvedValue(appData);
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getByText(/group-stage breakdown/i)).toBeInTheDocument();
  expect(screen.getByText("Group A")).toBeInTheDocument();
  // Group A is finalized: 50 pts pill shown.
  expect(screen.getAllByText(/50 pts/i).length).toBeGreaterThan(0);
  // Group B is not finalized: shown as pending.
  expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
  expect(screen.getAllByAltText("Mexico flag")[0]).toHaveAttribute("src", "/flags/mx.svg");
});

test("player group-stage view shows third-place qualifier scoring", async () => {
  mockLoadAppData.mockResolvedValue(appData);
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getByText(/third-place qualifiers/i)).toBeInTheDocument();
  expect(screen.getByText(/2 correct/i)).toBeInTheDocument();
  expect(screen.getAllByText(/15 pts/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/senegal/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/paraguay/i).length).toBeGreaterThan(0);
});

test("bracket tab shows the entrant knockout summary and champion banner", async () => {
  mockLoadAppData.mockResolvedValue(appData);
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /^bracket$/i }));

  expect(screen.getByText(/ko pts/i)).toBeInTheDocument();
  expect(screen.getByText(/champion · mexico/i)).toBeInTheDocument();
  expect(screen.getByText(/round of 16/i)).toBeInTheDocument();
});
