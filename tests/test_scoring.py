from __future__ import annotations

import unittest

from worldcup_tracker.scoring import build_tracker_outputs, score_entry


SCORING_RULES = {
    "groupStage": {
        "correctPositionPerTeam": 50,
        "perfectGroupBonus": 30,
    },
    "knockout": {
        "roundOf16": 20,
        "quarterfinal": 30,
        "semifinal": 40,
        "final": 75,
        "champion": 100,
    },
}


class ScoringTests(unittest.TestCase):
    def test_group_stage_scoring_counts_positions_and_perfect_groups(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {
                "groups": {
                    "A": ["A1", "A2", "A3", "A4"],
                    "B": ["B1", "B2", "B3", "B4"],
                }
            },
            "knockout": {
                "roundOf32Winners": [],
                "roundOf16Winners": [],
                "quarterfinalWinners": [],
                "semifinalWinners": [],
                "champion": None,
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                    "B": {"finalized": True, "standings": ["B2", "B1", "B3", "B4"]},
                }
            },
            "knockout": {},
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["groupStage"], 330)
        self.assertEqual(scored["groupStage"]["correctPositions"], 6)
        self.assertEqual(scored["groupStage"]["perfectGroups"], ["A"])

    def test_knockout_scoring_is_team_based_by_round(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf32Winners": ["Mexico", "France", "USA"],
                "roundOf16Winners": ["Mexico", "France"],
                "quarterfinalWinners": ["Mexico"],
                "semifinalWinners": ["Mexico"],
                "champion": "Mexico",
            },
        }
        actual_results = {
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf16Teams": ["Mexico", "USA", "Brazil"],
                "quarterfinalTeams": ["Mexico", "Brazil"],
                "semifinalTeams": ["Brazil", "Argentina"],
                "finalTeams": ["Brazil", "Mexico"],
                "champion": "Brazil",
            },
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["knockout"], 145)
        self.assertEqual(scored["knockout"]["roundOf16"]["correctTeams"], ["Mexico", "USA"])
        self.assertEqual(scored["knockout"]["quarterfinal"]["correctTeams"], ["Mexico"])
        self.assertFalse(scored["knockout"]["champion"]["correct"])

    def test_partial_results_only_score_known_progress(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
            "knockout": {
                "roundOf32Winners": ["Mexico", "USA"],
                "roundOf16Winners": ["Mexico"],
                "quarterfinalWinners": ["Mexico"],
                "semifinalWinners": ["Mexico"],
                "champion": "Mexico",
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {"A": {"finalized": False, "standings": ["A1", "A2", "A3", "A4"]}}
            },
            "knockout": {
                "roundOf16Teams": ["Mexico"],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["groupStage"], 0)
        self.assertEqual(scored["points"]["knockout"], 20)
        self.assertEqual(scored["knockout"]["roundOf16"]["correctTeams"], ["Mexico"])

    def test_leaderboard_is_sorted_by_points_then_name(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "zeta",
                    "displayName": "Zeta",
                    "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                },
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                },
            ]
        }
        actual_results = {
            "metadata": {"asOf": "2026-06-24T00:00:00Z"},
            "groupStage": {
                "groups": {"A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]}}
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)

        leaderboard = outputs["leaderboard"]["leaderboard"]
        self.assertEqual(leaderboard[0]["displayName"], "Alpha")
        self.assertEqual(leaderboard[1]["displayName"], "Zeta")
        self.assertEqual(leaderboard[0]["rank"], 1)
        self.assertEqual(leaderboard[1]["rank"], 1)

    def test_tracker_outputs_use_explicit_generated_at_when_provided(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {"groups": {}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                }
            ]
        }
        actual_results = {
            "metadata": {"asOf": None},
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(
            brackets_doc,
            actual_results,
            SCORING_RULES,
            generated_at="2026-06-24T20:00:00Z",
        )

        self.assertEqual(outputs["leaderboard"]["metadata"]["generatedAt"], "2026-06-24T20:00:00Z")
        self.assertEqual(outputs["entryProgress"]["metadata"]["generatedAt"], "2026-06-24T20:00:00Z")


if __name__ == "__main__":
    unittest.main()
