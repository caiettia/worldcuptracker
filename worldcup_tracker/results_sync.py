from __future__ import annotations

from typing import Any


GROUP_KEYS = tuple("ABCDEFGHIJKL")


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
