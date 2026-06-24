from __future__ import annotations

import json
import tempfile
from pathlib import Path
import unittest

from worldcup_tracker.results_sync import (
    build_group_stage,
    build_knockout,
    validate_actual_results_document,
    write_actual_results_document,
)


STANDINGS_PAYLOAD = {
    "response": [
        {
            "league": {
                "id": 1,
                "season": 2026,
                "standings": [
                    [
                        {
                            "rank": 1,
                            "group": "Group A",
                            "team": {"name": "Mexico"},
                            "all": {"played": 3, "win": 2, "draw": 1, "lose": 0},
                            "goalsDiff": 3,
                            "points": 7,
                        },
                        {
                            "rank": 2,
                            "group": "Group A",
                            "team": {"name": "Switzerland"},
                            "all": {"played": 3, "win": 1, "draw": 2, "lose": 0},
                            "goalsDiff": 1,
                            "points": 5,
                        },
                        {
                            "rank": 3,
                            "group": "Group A",
                            "team": {"name": "Japan"},
                            "all": {"played": 3, "win": 1, "draw": 1, "lose": 1},
                            "goalsDiff": 0,
                            "points": 4,
                        },
                        {
                            "rank": 4,
                            "group": "Group A",
                            "team": {"name": "Mali"},
                            "all": {"played": 3, "win": 0, "draw": 0, "lose": 3},
                            "goalsDiff": -4,
                            "points": 0,
                        },
                    ],
                    [
                        {
                            "rank": 1,
                            "group": "Group B",
                            "team": {"name": "Brazil"},
                            "all": {"played": 2, "win": 2, "draw": 0, "lose": 0},
                            "goalsDiff": 4,
                            "points": 6,
                        },
                        {
                            "rank": 2,
                            "group": "Group B",
                            "team": {"name": "Serbia"},
                            "all": {"played": 2, "win": 1, "draw": 0, "lose": 1},
                            "goalsDiff": 0,
                            "points": 3,
                        },
                        {
                            "rank": 3,
                            "group": "Group B",
                            "team": {"name": "Ghana"},
                            "all": {"played": 2, "win": 0, "draw": 1, "lose": 1},
                            "goalsDiff": -1,
                            "points": 1,
                        },
                        {
                            "rank": 4,
                            "group": "Group B",
                            "team": {"name": "Iran"},
                            "all": {"played": 2, "win": 0, "draw": 1, "lose": 1},
                            "goalsDiff": -3,
                            "points": 1,
                        },
                    ],
                ]
            }
        }
    ]
}

FIXTURES_PAYLOAD = {
    "response": [
        {
            "league": {"round": "Round of 32"},
            "teams": {
                "home": {"name": "Mexico", "winner": True},
                "away": {"name": "Japan", "winner": False},
            },
            "fixture": {"status": {"short": "FT"}},
        },
        {
            "league": {"round": "Round of 32"},
            "teams": {
                "home": {"name": "Brazil", "winner": False},
                "away": {"name": "Serbia", "winner": True},
            },
            "fixture": {"status": {"short": "PEN"}},
        },
        {
            "league": {"round": "Round of 16"},
            "teams": {
                "home": {"name": "Mexico", "winner": True},
                "away": {"name": "Serbia", "winner": False},
            },
            "fixture": {"status": {"short": "AET"}},
        },
        {
            "league": {"round": "Quarter-finals"},
            "teams": {
                "home": {"name": "Mexico", "winner": True},
                "away": {"name": "France", "winner": False},
            },
            "fixture": {"status": {"short": "FT"}},
        },
        {
            "league": {"round": "Semi-finals"},
            "teams": {
                "home": {"name": "Mexico", "winner": False},
                "away": {"name": "Argentina", "winner": True},
            },
            "fixture": {"status": {"short": "FT"}},
        },
        {
            "league": {"round": "Final"},
            "teams": {
                "home": {"name": "Argentina", "winner": True},
                "away": {"name": "Germany", "winner": False},
            },
            "fixture": {"status": {"short": "FT"}},
        },
    ]
}


class ResultsSyncTests(unittest.TestCase):
    def test_build_group_stage_keeps_all_twelve_groups_and_finalizes_complete_groups(self) -> None:
        group_stage = build_group_stage(STANDINGS_PAYLOAD)

        self.assertEqual(sorted(group_stage["groups"].keys()), list("ABCDEFGHIJKL"))
        self.assertTrue(group_stage["groups"]["A"]["finalized"])
        self.assertFalse(group_stage["groups"]["B"]["finalized"])
        self.assertEqual(
            group_stage["groups"]["A"]["standings"],
            ["Mexico", "Switzerland", "Japan", "Mali"],
        )
        self.assertEqual(
            group_stage["groups"]["B"]["standings"],
            ["Brazil", "Serbia", "Ghana", "Iran"],
        )

    def test_build_group_stage_keeps_best_third_place_empty_until_all_groups_are_finalized(self) -> None:
        group_stage = build_group_stage(STANDINGS_PAYLOAD)

        self.assertEqual(group_stage["bestThirdPlacedTeams"], [])

    def test_build_knockout_collects_winners_by_round(self) -> None:
        knockout = build_knockout(FIXTURES_PAYLOAD)

        self.assertEqual(knockout["roundOf16Teams"], ["Mexico", "Serbia"])
        self.assertEqual(knockout["quarterfinalTeams"], ["Mexico"])
        self.assertEqual(knockout["semifinalTeams"], ["Mexico"])
        self.assertEqual(knockout["finalTeams"], ["Argentina"])
        self.assertEqual(knockout["champion"], "Argentina")

    def test_build_knockout_ignores_unfinished_matches(self) -> None:
        payload = {
            "response": [
                {
                    "league": {"round": "Round of 32"},
                    "teams": {
                        "home": {"name": "USA", "winner": None},
                        "away": {"name": "Canada", "winner": None},
                    },
                    "fixture": {"status": {"short": "NS"}},
                }
            ]
        }

        knockout = build_knockout(payload)

        self.assertEqual(knockout["roundOf16Teams"], [])
        self.assertIsNone(knockout["champion"])

    def test_validate_actual_results_document_rejects_champion_without_final_team(self) -> None:
        invalid_doc = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": "2026-06-24T22:00:00Z",
                "notes": "Synced from API-Football.",
                "provider": "api-football",
                "providerFetchedAt": "2026-06-24T22:00:00Z",
            },
            "groupStage": {
                "groups": {
                    key: {"finalized": False, "standings": []}
                    for key in "ABCDEFGHIJKL"
                },
                "bestThirdPlacedTeams": [],
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": "Argentina",
            },
        }

        with self.assertRaises(ValueError):
            validate_actual_results_document(invalid_doc)

    def test_write_actual_results_document_preserves_previous_file_when_validation_fails(self) -> None:
        valid_doc = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": None,
                "notes": "Existing snapshot.",
                "provider": "api-football",
                "providerFetchedAt": "2026-06-24T20:00:00Z",
            },
            "groupStage": {
                "groups": {
                    key: {"finalized": False, "standings": []}
                    for key in "ABCDEFGHIJKL"
                },
                "bestThirdPlacedTeams": [],
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }
        invalid_doc = {
            **valid_doc,
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": "Argentina",
            },
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "actual-results.json"
            output_path.write_text(json.dumps(valid_doc), encoding="utf-8")

            with self.assertRaises(ValueError):
                write_actual_results_document(invalid_doc, output_path)

            saved_doc = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(saved_doc["metadata"]["notes"], "Existing snapshot.")


if __name__ == "__main__":
    unittest.main()
