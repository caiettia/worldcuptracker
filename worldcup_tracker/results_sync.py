from __future__ import annotations

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
