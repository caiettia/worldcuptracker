from __future__ import annotations

import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any


GROUP_KEYS = tuple("ABCDEFGHIJKL")
COMPLETED_STATUS_CODES = {"FT", "AET", "PEN"}
KNOCKOUT_TARGETS = {
    "ROUND OF 32": "roundOf16Teams",
    "ROUND OF 16": "quarterfinalTeams",
    "QUARTER-FINALS": "semifinalTeams",
    "SEMI-FINALS": "finalTeams",
    "FINAL": "champion",
}


def _empty_group_stage() -> dict[str, Any]:
    return {
        "groups": {key: {"finalized": False, "standings": []} for key in GROUP_KEYS},
        "bestThirdPlacedTeams": [],
    }


def _group_key(label: str) -> str:
    normalized = label.strip().upper()
    if not normalized:
        raise ValueError("Missing group label")
    return normalized[-1]


def build_group_stage(standings_payload: dict[str, Any]) -> dict[str, Any]:
    group_stage = _empty_group_stage()
    response = standings_payload.get("response", [])
    if not response:
        raise ValueError("Standings payload did not include any response rows")

    standings_groups = response[0].get("league", {}).get("standings", [])
    for standings in standings_groups:
        if not standings:
            continue

        group_key = _group_key(standings[0].get("group", ""))
        ordered_rows = sorted(standings, key=lambda row: row["rank"])
        group_stage["groups"][group_key] = {
            "finalized": all(row.get("all", {}).get("played") == 3 for row in ordered_rows),
            "standings": [row["team"]["name"] for row in ordered_rows],
        }

    return group_stage


def _empty_knockout() -> dict[str, Any]:
    return {
        "roundOf16Teams": [],
        "quarterfinalTeams": [],
        "semifinalTeams": [],
        "finalTeams": [],
        "champion": None,
    }


def _winner_name(fixture: dict[str, Any]) -> str | None:
    status = fixture.get("fixture", {}).get("status", {}).get("short")
    if status not in COMPLETED_STATUS_CODES:
        return None

    home = fixture.get("teams", {}).get("home", {})
    away = fixture.get("teams", {}).get("away", {})
    if home.get("winner") is True:
        return home.get("name")
    if away.get("winner") is True:
        return away.get("name")
    return None


def build_knockout(fixtures_payload: dict[str, Any]) -> dict[str, Any]:
    knockout = _empty_knockout()
    for fixture in fixtures_payload.get("response", []):
        winner = _winner_name(fixture)
        if not winner:
            continue

        round_name = fixture.get("league", {}).get("round", "").strip().upper()
        target = KNOCKOUT_TARGETS.get(round_name)
        if not target:
            continue

        if target == "champion":
            knockout["champion"] = winner
        else:
            knockout[target].append(winner)

    return knockout


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

    for key in GROUP_KEYS:
        group = groups[key]
        if not isinstance(group.get("finalized"), bool):
            raise ValueError(f"Group {key} finalized flag must be boolean")
        if not isinstance(group.get("standings"), list):
            raise ValueError(f"Group {key} standings must be a list")

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
