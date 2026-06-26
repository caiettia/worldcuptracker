from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import unittest
from unittest.mock import patch

from worldcup_tracker.fifa_standings_sync import (
    build_group_stage_from_fifa_tables,
    should_run_fifa_group_stage_refresh,
)
from worldcup_tracker.results_sync import (
    run_sync_from_env,
    sync_actual_results,
    validate_actual_results_document,
    write_actual_results_document,
)


def make_table(
    group: str,
    rows: list[tuple[str, int, int, int, int, int, int, int, int]],
) -> dict[str, object]:
    built_rows = []
    for position, (team, played, win, draw, lose, goals_for, goals_against, tcs, points) in enumerate(
        rows,
        start=1,
    ):
        built_rows.append(
            {
                "position": position,
                "team": team,
                "played": played,
                "win": win,
                "draw": draw,
                "lose": lose,
                "goals_for": goals_for,
                "goals_against": goals_against,
                "goal_difference": goals_for - goals_against,
                "tcs": tcs,
                "points": points,
            }
        )
    return {"group": group, "rows": built_rows}


FIFA_TABLES = [
    make_table("A", [("Mexico", 3, 3, 0, 0, 6, 0, -6, 9), ("South Africa", 3, 1, 1, 1, 2, 3, -13, 4), ("Korea Republic", 3, 1, 0, 2, 2, 3, -4, 3), ("Czechia", 3, 0, 1, 2, 2, 6, -1, 1)]),
    make_table("B", [("Switzerland", 3, 2, 1, 0, 7, 3, -3, 7), ("Canada", 3, 1, 1, 1, 8, 3, -5, 4), ("Bosnia and Herzegovina", 3, 1, 1, 1, 5, 6, -10, 4), ("Qatar", 3, 0, 1, 2, 2, 10, -12, 1)]),
    make_table("C", [("Brazil", 3, 2, 1, 0, 7, 1, -5, 7), ("Morocco", 3, 2, 1, 0, 6, 3, -1, 7), ("Scotland", 3, 1, 0, 2, 1, 4, -5, 3), ("Haiti", 3, 0, 0, 3, 2, 8, -7, 0)]),
    make_table("D", [("USA", 3, 2, 0, 1, 8, 4, -5, 6), ("Australia", 3, 1, 1, 1, 2, 2, -5, 4), ("Paraguay", 3, 1, 1, 1, 2, 4, -12, 4), ("Turkiye", 3, 1, 0, 2, 3, 5, -3, 3)]),
    make_table("E", [("Germany", 3, 2, 0, 1, 10, 4, -1, 6), ("Côte d'Ivoire", 3, 2, 0, 1, 4, 2, -4, 6), ("Ecuador", 3, 1, 1, 1, 2, 2, -5, 4), ("Curaçao", 3, 0, 1, 2, 1, 9, -7, 1)]),
    make_table("F", [("Netherlands", 3, 2, 1, 0, 10, 4, -3, 7), ("Japan", 3, 1, 2, 0, 7, 3, -1, 5), ("Sweden", 3, 1, 1, 1, 7, 7, -5, 4), ("Tunisia", 3, 0, 0, 3, 2, 12, -1, 0)]),
    make_table("G", [("Egypt", 2, 1, 1, 0, 4, 2, -3, 4), ("IR Iran", 2, 0, 2, 0, 2, 2, -2, 2), ("Belgium", 2, 0, 2, 0, 1, 1, -7, 2), ("New Zealand", 2, 0, 1, 1, 3, 5, -2, 1)]),
    make_table("H", [("Spain", 2, 1, 1, 0, 5, 1, -3, 4), ("Uruguay", 2, 0, 2, 0, 1, 1, -4, 2), ("Cabo Verde", 2, 0, 2, 0, 2, 2, -2, 2), ("Saudi Arabia", 2, 0, 1, 1, 1, 5, -4, 1)]),
    make_table("I", [("France", 2, 2, 0, 0, 5, 0, -3, 6), ("Norway", 2, 2, 0, 0, 4, 0, -1, 6), ("Senegal", 2, 0, 0, 2, 1, 4, -6, 0), ("Iraq", 2, 0, 0, 2, 0, 6, -4, 0)]),
    make_table("J", [("Argentina", 2, 2, 0, 0, 5, 0, -2, 6), ("Austria", 2, 1, 0, 1, 2, 2, -3, 3), ("Algeria", 2, 1, 0, 1, 1, 3, -5, 3), ("Jordan", 2, 0, 0, 2, 0, 3, -1, 0)]),
    make_table("K", [("Colombia", 2, 2, 0, 0, 3, 0, -1, 6), ("Portugal", 2, 1, 1, 0, 6, 1, -2, 4), ("Congo DR", 2, 0, 1, 1, 1, 2, -3, 1), ("Uzbekistan", 2, 0, 0, 2, 1, 8, -4, 0)]),
    make_table("L", [("England", 2, 1, 1, 0, 2, 0, -3, 4), ("Ghana", 2, 1, 1, 0, 4, 3, -2, 4), ("Croatia", 2, 1, 0, 1, 3, 4, -1, 3), ("Panama", 2, 0, 0, 2, 2, 4, -5, 0)]),
]


class ResultsSyncTests(unittest.TestCase):
    def test_build_group_stage_from_fifa_tables_builds_all_groups_and_best_thirds(self) -> None:
        group_stage = build_group_stage_from_fifa_tables(FIFA_TABLES)

        self.assertEqual(sorted(group_stage["groups"].keys()), list("ABCDEFGHIJKL"))
        self.assertEqual(group_stage["groups"]["A"]["standings"], ["Mexico", "South Africa", "Korea Republic", "Czechia"])
        self.assertEqual(group_stage["groups"]["G"]["standings"], ["Egypt", "IR Iran", "Belgium", "New Zealand"])
        self.assertTrue(group_stage["groups"]["A"]["finalized"])
        self.assertFalse(group_stage["groups"]["G"]["finalized"])
        self.assertEqual(
            group_stage["bestThirdPlacedTeams"][:8],
            [
                "Sweden",
                "Ecuador",
                "Bosnia and Herzegovina",
                "Paraguay",
                "Croatia",
                "Korea Republic",
                "Algeria",
                "Scotland",
            ],
        )

    def test_should_run_fifa_group_stage_refresh_uses_group_stage_windows(self) -> None:
        self.assertTrue(should_run_fifa_group_stage_refresh(datetime(2026, 6, 26, 19, 0, tzinfo=timezone.utc)))
        self.assertFalse(should_run_fifa_group_stage_refresh(datetime(2026, 6, 28, 19, 0, tzinfo=timezone.utc)))
        self.assertFalse(should_run_fifa_group_stage_refresh(datetime(2026, 6, 26, 8, 0, tzinfo=timezone.utc)))

    @patch("worldcup_tracker.results_sync.scrape_fifa_standings_tables")
    def test_sync_actual_results_updates_group_stage_and_preserves_knockout(self, mock_scrape) -> None:
        mock_scrape.return_value = FIFA_TABLES
        existing_doc = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": "2026-06-26T18:55:00Z",
                "notes": "Existing snapshot.",
                "provider": "manual",
                "providerFetchedAt": "2026-06-26T18:55:00Z",
            },
            "groupStage": {
                "groups": {key: {"finalized": False, "standings": []} for key in "ABCDEFGHIJKL"},
                "bestThirdPlacedTeams": [],
            },
            "knockout": {
                "roundOf16Teams": ["Mexico", "Japan"],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "actual-results.json"
            output_path.write_text(json.dumps(existing_doc), encoding="utf-8")

            document = sync_actual_results(
                output_path=output_path,
                fetched_at="2026-06-26T19:00:00Z",
                now=datetime(2026, 6, 26, 19, 0, tzinfo=timezone.utc),
            )

            self.assertEqual(document["metadata"]["provider"], "fifa-standings-scrape")
            self.assertEqual(document["knockout"], existing_doc["knockout"])
            self.assertEqual(document["groupStage"]["groups"]["A"]["standings"][0], "Mexico")

    def test_validate_actual_results_document_rejects_champion_without_final_team(self) -> None:
        invalid_doc = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": "2026-06-24T22:00:00Z",
                "notes": "Synced from FIFA standings page.",
                "provider": "fifa-standings-scrape",
                "providerFetchedAt": "2026-06-24T22:00:00Z",
            },
            "groupStage": {
                "groups": {key: {"finalized": False, "standings": []} for key in "ABCDEFGHIJKL"},
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
                "provider": "fifa-standings-scrape",
                "providerFetchedAt": "2026-06-24T20:00:00Z",
            },
            "groupStage": {
                "groups": {key: {"finalized": False, "standings": []} for key in "ABCDEFGHIJKL"},
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

    @patch("worldcup_tracker.results_sync.sync_actual_results")
    def test_run_sync_from_env_delegates_without_api_key(self, mock_sync) -> None:
        mock_sync.return_value = {"metadata": {"provider": "fifa-standings-scrape", "asOf": None}}

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "actual-results.json"
            document = run_sync_from_env({}, output_path)

        self.assertEqual(document["metadata"]["provider"], "fifa-standings-scrape")
        mock_sync.assert_called_once_with(output_path=output_path)

    def test_sync_script_bootstraps_repo_root_before_importing_package(self) -> None:
        repo_root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            [sys.executable, "scripts/sync_actual_results.py"],
            cwd=repo_root,
            env=os.environ.copy(),
            capture_output=True,
            text=True,
        )

        self.assertNotIn("ModuleNotFoundError", result.stderr)
        self.assertEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["outputPath"], "data\\actual-results.json" if os.name == "nt" else "data/actual-results.json")


if __name__ == "__main__":
    unittest.main()
