import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

const mockLoadAppData = vi.fn();

vi.mock("./lib/loadAppData", () => ({
  loadAppData: () => mockLoadAppData(),
}));

const appData = {
  leaderboard: {
    metadata: {
      generatedAt: "2026-06-24T18:38:07Z",
      asOf: null,
      entrants: 2,
      scoringSystem: "fifa",
    },
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
        totalPoints: 120,
        groupStagePoints: 90,
        knockoutPoints: 30,
      },
      {
        rank: 2,
        id: "nfry",
        displayName: "NFry",
        totalPoints: 100,
        groupStagePoints: 70,
        knockoutPoints: 30,
      },
    ],
  },
  entryProgress: {
    metadata: {
      generatedAt: "2026-06-24T18:38:07Z",
      asOf: null,
      entrants: 2,
      scoringSystem: "fifa",
    },
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
        points: {
          total: 120,
          groupStage: 90,
          knockout: 30,
        },
        groupStage: {
          points: 90,
          correctPositions: 1,
          perfectGroups: [],
          finalizedGroupsScored: 2,
          correctPositionsByGroup: {
            A: 1,
            B: 0,
          },
          pointsByGroup: {
            A: 50,
            B: 0,
          },
        },
        knockout: {
          roundOf16: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          quarterfinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          semifinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          final: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          champion: {
            points: 0,
            predictedTeam: "Mexico",
            actualTeam: null,
            correct: false,
          },
          points: 0,
        },
      },
      {
        id: "nfry",
        displayName: "NFry",
        rank: 2,
        points: {
          total: 100,
          groupStage: 70,
          knockout: 30,
        },
        groupStage: {
          points: 70,
          correctPositions: 1,
          perfectGroups: [],
          finalizedGroupsScored: 2,
          correctPositionsByGroup: {
            A: 1,
            B: 0,
          },
          pointsByGroup: {
            A: 50,
            B: 0,
          },
        },
        knockout: {
          roundOf16: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          quarterfinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          semifinal: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          final: { points: 0, correctTeams: [], predictedCount: 0, actualKnownCount: 0 },
          champion: {
            points: 0,
            predictedTeam: "Spain",
            actualTeam: null,
            correct: false,
          },
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
          groups: {
            A: ["Mexico", "Czechia", "Korea Republic", "South Africa"],
            B: ["Bosnia-Herzegovina", "Canada", "Atlantis", "Qatar"],
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
      {
        id: "nfry",
        displayName: "NFry",
        sourceImages: {
          groupStage: "/brackets/nfry_groupstage.jpeg",
          knockouts: "/brackets/nfry_knockouts.jpeg",
        },
        groupStage: {
          groups: {
            A: ["Mexico", "Korea Republic", "Czechia", "South Africa"],
            B: ["Canada", "Switzerland", "Bosnia-Herzegovina", "Qatar"],
          },
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
        A: {
          finalized: true,
          standings: ["Mexico", "Korea Republic", "Czechia", "South Africa"],
        },
        B: {
          finalized: true,
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
  },
};

beforeEach(() => {
  mockLoadAppData.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

test("renders loading state before leaderboard data resolves", () => {
  mockLoadAppData.mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
});

test("renders error state when leaderboard loading fails", async () => {
  mockLoadAppData.mockRejectedValue(new Error("boom"));
  render(<App />);
  expect(await screen.findByText(/unable to load the leaderboard/i)).toBeInTheDocument();
});

test("renders the leaderboard table and top player when data loads", async () => {
  mockLoadAppData.mockResolvedValue(appData);

  render(<App />);
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.getAllByText("Dinkelberg").length).toBeGreaterThan(0);
  expect(screen.getAllByText("120").length).toBeGreaterThan(0);
});

test("lets you click a player to view group stage predictions against actual results", async () => {
  mockLoadAppData.mockResolvedValue(appData);

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getByRole("heading", { name: /dinkelberg group stage/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /group a/i })).toBeInTheDocument();
  expect(screen.getByText(/group points: 50/i)).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { name: /actual outcome/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("heading", { name: /your prediction/i }).length).toBeGreaterThan(0);
});

test("renders local flag avatars for known countries and skips unknown ones", async () => {
  mockLoadAppData.mockResolvedValue(appData);

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getAllByAltText("Mexico flag")[0]).toHaveAttribute("src", "/flags/mx.svg");
  expect(screen.getByAltText("Bosnia and Herzegovina flag")).toHaveAttribute("src", "/flags/ba.svg");
  expect(screen.getByAltText("Bosnia-Herzegovina flag")).toHaveAttribute("src", "/flags/ba.svg");
  expect(screen.getByText("Atlantis")).toBeInTheDocument();
  expect(screen.queryByAltText("Atlantis flag")).not.toBeInTheDocument();
});

test("shows a bracket view with a player selector and no dashboard or live nav links", async () => {
  mockLoadAppData.mockResolvedValue(appData);

  render(<App />);

  expect(screen.queryByRole("button", { name: /dashboard/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /live/i })).not.toBeInTheDocument();

  fireEvent.click(await screen.findByRole("button", { name: /^bracket$/i }));

  expect(screen.getByRole("heading", { name: /bracket picks/i })).toBeInTheDocument();

  const selector = screen.getByLabelText(/choose a player/i);
  fireEvent.change(selector, { target: { value: "nfry" } });

  expect(screen.getByText(/nfry submission/i)).toBeInTheDocument();
  expect(screen.getByAltText(/nfry group stage bracket/i)).toHaveAttribute(
    "src",
    "/brackets/nfry_groupstage.jpeg",
  );
});
