import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import App from "./App";

const mockLoadLeaderboard = vi.fn();

vi.mock("./lib/loadLeaderboard", () => ({
  loadLeaderboard: () => mockLoadLeaderboard(),
}));

test("renders loading state before leaderboard data resolves", () => {
  mockLoadLeaderboard.mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
});

test("renders error state when leaderboard loading fails", async () => {
  mockLoadLeaderboard.mockRejectedValue(new Error("boom"));
  render(<App />);
  expect(await screen.findByText(/unable to load the leaderboard/i)).toBeInTheDocument();
});

test("renders the leaderboard heading and top player when data loads", async () => {
  mockLoadLeaderboard.mockResolvedValue({
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
      {
        rank: 3,
        id: "liz",
        displayName: "ElizabethAcors",
        totalPoints: 80,
        groupStagePoints: 50,
        knockoutPoints: 30,
      },
    ],
  });

  render(<App />);
  expect(await screen.findByRole("heading", { name: /league leaderboard/i })).toBeInTheDocument();
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(screen.getAllByText("Dinkelberg").length).toBeGreaterThan(0);
  expect(screen.getAllByText("120").length).toBeGreaterThan(0);
});
