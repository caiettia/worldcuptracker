from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

from worldcup_tracker.results_sync import (
    build_group_stage,
    build_knockout,
    run_sync_from_env,
    sync_actual_results,
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


class FakeHttpResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self._payload = payload

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self) -> "FakeHttpResponse":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


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

    @patch("worldcup_tracker.results_sync.urlopen")
    def test_sync_actual_results_fetches_provider_payloads_and_writes_metadata(self, mock_urlopen) -> None:
        mock_urlopen.side_effect = [
            FakeHttpResponse(STANDINGS_PAYLOAD),
            FakeHttpResponse(FIXTURES_PAYLOAD),
        ]

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "actual-results.json"
            sync_actual_results(
                api_key="test-key",
                output_path=output_path,
                fetched_at="2026-06-24T22:00:00Z",
            )

            saved_doc = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(saved_doc["metadata"]["provider"], "api-football")
            self.assertEqual(saved_doc["metadata"]["providerFetchedAt"], "2026-06-24T22:00:00Z")
            self.assertEqual(saved_doc["metadata"]["tournament"], "FIFA World Cup 2026")
            self.assertEqual(saved_doc["groupStage"]["groups"]["A"]["standings"][0], "Mexico")
            self.assertEqual(saved_doc["knockout"]["champion"], "Argentina")
            requested_urls = [call.args[0].full_url for call in mock_urlopen.call_args_list]
            self.assertEqual(
                requested_urls,
                [
                    "https://v3.football.api-sports.io/standings?league=1&season=2026",
                    "https://v3.football.api-sports.io/fixtures?league=1&season=2026",
                ],
            )

    def test_run_sync_from_env_requires_api_key(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "actual-results.json"

            with self.assertRaisesRegex(RuntimeError, "API_FOOTBALL_KEY"):
                run_sync_from_env({}, output_path)

    def test_sync_script_bootstraps_repo_root_before_importing_package(self) -> None:
        repo_root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            [sys.executable, "scripts/sync_actual_results.py"],
            cwd=repo_root,
            env={key: value for key, value in os.environ.items() if key != "API_FOOTBALL_KEY"},
            capture_output=True,
            text=True,
        )

        self.assertNotIn("ModuleNotFoundError", result.stderr)
        self.assertIn("API_FOOTBALL_KEY is required", result.stderr)


if __name__ == "__main__":
    unittest.main()
