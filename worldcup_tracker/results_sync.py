from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from worldcup_tracker.fifa_standings_sync import (
    build_group_stage_from_fifa_tables,
    scrape_fifa_standings_tables,
    should_run_fifa_group_stage_refresh,
)


GROUP_KEYS = tuple("ABCDEFGHIJKL")


def _empty_group_stage() -> dict[str, Any]:
    return {
        "groups": {key: {"finalized": False, "standings": []} for key in GROUP_KEYS},
        "bestThirdPlacedTeams": [],
    }


def _empty_knockout() -> dict[str, Any]:
    return {
        "roundOf16Teams": [],
        "quarterfinalTeams": [],
        "semifinalTeams": [],
        "finalTeams": [],
        "champion": None,
    }


def _default_document(timestamp: str | None) -> dict[str, Any]:
    return {
        "metadata": {
            "tournament": "FIFA World Cup 2026",
            "asOf": timestamp,
            "notes": "Seed snapshot for FIFA standings sync.",
            "provider": "fifa-standings-scrape",
            "providerFetchedAt": timestamp,
        },
        "groupStage": _empty_group_stage(),
        "knockout": _empty_knockout(),
    }


def validate_actual_results_document(document: dict[str, Any]) -> None:
    metadata = document.get("metadata")
    group_stage = document.get("groupStage")
    knockout = document.get("knockout")

    if not isinstance(metadata, dict):
        raise ValueError("Results document is missing metadata")
    if not isinstance(group_stage, dict):
        raise ValueError("Results document is missing groupStage")
    if not isinstance(knockout, dict):
        raise ValueError("Results document is missing knockout")

    groups = group_stage.get("groups")
    if not isinstance(groups, dict) or sorted(groups.keys()) != list(GROUP_KEYS):
        raise ValueError("Results document must contain groups A-L")

    seen_teams: set[str] = set()
    for key in GROUP_KEYS:
        group = groups[key]
        standings = group.get("standings")
        if not isinstance(group.get("finalized"), bool):
            raise ValueError(f"Group {key} finalized flag must be boolean")
        if not isinstance(standings, list):
            raise ValueError(f"Group {key} standings must be a list")
        if standings and len(standings) != 4:
            raise ValueError(f"Group {key} must contain exactly four teams when populated")
        for team in standings:
            if team in seen_teams:
                raise ValueError(f"Duplicate team in standings: {team}")
            seen_teams.add(team)

    if not isinstance(group_stage.get("bestThirdPlacedTeams"), list):
        raise ValueError("bestThirdPlacedTeams must be a list")

    for field in ("roundOf16Teams", "quarterfinalTeams", "semifinalTeams", "finalTeams"):
        if not isinstance(knockout.get(field), list):
            raise ValueError(f"{field} must be a list")

    champion = knockout.get("champion")
    if champion is not None and not knockout["finalTeams"]:
        raise ValueError("Champion cannot be set before finalTeams is populated")


def write_actual_results_document(document: dict[str, Any], output_path: Path) -> None:
    validate_actual_results_document(document)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with NamedTemporaryFile("w", delete=False, dir=output_path.parent, encoding="utf-8") as handle:
        json.dump(document, handle, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)

    temp_path.replace(output_path)


def read_actual_results_document(output_path: Path) -> dict[str, Any]:
    document = json.loads(output_path.read_text(encoding="utf-8"))
    validate_actual_results_document(document)
    return document


def sync_actual_results(
    output_path: Path,
    fetched_at: str | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    current_time = now or datetime.now(timezone.utc)
    timestamp = fetched_at or current_time.isoformat()
    try:
        existing = read_actual_results_document(output_path) if output_path.exists() else _default_document(timestamp)
        if not should_run_fifa_group_stage_refresh(current_time):
            return existing

        tables = scrape_fifa_standings_tables()
        group_stage = build_group_stage_from_fifa_tables(tables)
        document = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": timestamp,
                "notes": "Synced from FIFA standings page.",
                "provider": "fifa-standings-scrape",
                "providerFetchedAt": timestamp,
            },
            "groupStage": group_stage,
            "knockout": existing["knockout"],
        }
        write_actual_results_document(document, output_path)
        return document
    except Exception as exc:
        if not output_path.exists():
            raise

        existing_document = read_actual_results_document(output_path)
        print(
            f"Warning: failed to sync FIFA standings ({exc}). Preserving existing actual results snapshot at {output_path}.",
            file=sys.stderr,
        )
        return existing_document


def run_sync_from_env(env: dict[str, str], output_path: Path) -> dict[str, Any]:
    return sync_actual_results(output_path=output_path)
