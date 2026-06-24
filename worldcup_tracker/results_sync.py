from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


GROUP_KEYS = tuple("ABCDEFGHIJKL")
COMPLETED_STATUS_CODES = {"FT", "AET", "PEN"}
BASE_URL = "https://v3.football.api-sports.io"
LEAGUE_ID = 1
SEASON = 2026
KNOCKOUT_TARGETS = {
    "ROUND OF 32": "roundOf16Teams",
    "ROUND OF 16": "quarterfinalTeams",
    "QUARTER-FINALS": "semifinalTeams",
    "SEMI-FINALS": "finalTeams",
    "FINAL": "champion",
}
TEAM_NAME_OVERRIDES = {
    "IR Iran": "Iran",
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
        raise ValueError(
            "Standings payload did not include any response rows "
            f"(results={standings_payload.get('results')}, errors={standings_payload.get('errors')})"
        )

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


def read_actual_results_document(output_path: Path) -> dict[str, Any]:
    document = json.loads(output_path.read_text(encoding="utf-8"))
    validate_actual_results_document(document)
    return document


def _apply_team_name(team_name: str) -> str:
    return TEAM_NAME_OVERRIDES.get(team_name, team_name)


def _fetch_api_football_json(path: str, api_key: str, params: dict[str, Any]) -> dict[str, Any]:
    query = urlencode(params)
    request = Request(
        f"{BASE_URL}{path}?{query}",
        headers={"x-apisports-key": api_key},
        method="GET",
    )
    with urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def _normalize_team_names(document: dict[str, Any]) -> dict[str, Any]:
    for group in document["groupStage"]["groups"].values():
        group["standings"] = [_apply_team_name(name) for name in group["standings"]]
    document["groupStage"]["bestThirdPlacedTeams"] = [
        _apply_team_name(name) for name in document["groupStage"]["bestThirdPlacedTeams"]
    ]
    for field in ("roundOf16Teams", "quarterfinalTeams", "semifinalTeams", "finalTeams"):
        document["knockout"][field] = [
            _apply_team_name(name) for name in document["knockout"][field]
        ]
    champion = document["knockout"]["champion"]
    document["knockout"]["champion"] = _apply_team_name(champion) if champion else None
    return document


def sync_actual_results(
    api_key: str,
    output_path: Path,
    fetched_at: str | None = None,
) -> dict[str, Any]:
    timestamp = fetched_at or datetime.now(timezone.utc).isoformat()
    try:
        standings_payload = _fetch_api_football_json(
            "/standings",
            api_key,
            {"league": LEAGUE_ID, "season": SEASON},
        )
        fixtures_payload = _fetch_api_football_json(
            "/fixtures",
            api_key,
            {"league": LEAGUE_ID, "season": SEASON},
        )

        document = {
            "metadata": {
                "tournament": "FIFA World Cup 2026",
                "asOf": timestamp,
                "notes": "Synced from API-Football.",
                "provider": "api-football",
                "providerFetchedAt": timestamp,
            },
            "groupStage": build_group_stage(standings_payload),
            "knockout": build_knockout(fixtures_payload),
        }
        normalized_document = _normalize_team_names(document)
        write_actual_results_document(normalized_document, output_path)
        return normalized_document
    except Exception as exc:
        if not output_path.exists():
            raise

        existing_document = read_actual_results_document(output_path)
        print(
            "Warning: failed to sync API-Football results "
            f"({exc}). Preserving existing actual results snapshot at {output_path}.",
            file=sys.stderr,
        )
        return existing_document


def run_sync_from_env(env: dict[str, str], output_path: Path) -> dict[str, Any]:
    api_key = env.get("API_FOOTBALL_KEY")
    if not api_key:
        raise RuntimeError("API_FOOTBALL_KEY is required")
    return sync_actual_results(api_key=api_key, output_path=output_path)
