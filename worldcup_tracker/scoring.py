from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROUND_SPECS = (
    ("roundOf16", "roundOf32Winners", "roundOf16Teams"),
    ("quarterfinal", "roundOf16Winners", "quarterfinalTeams"),
    ("semifinal", "quarterfinalWinners", "semifinalTeams"),
    ("final", "semifinalWinners", "finalTeams"),
)


def load_json(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def score_group_stage(
    predicted_groups: dict[str, list[str]],
    actual_group_stage: dict[str, Any],
    scoring_rules: dict[str, Any],
) -> dict[str, Any]:
    points_per_team = scoring_rules["groupStage"]["correctPositionPerTeam"]
    perfect_group_bonus = scoring_rules["groupStage"]["perfectGroupBonus"]

    group_points = 0
    correct_positions = 0
    finalized_groups = 0
    perfect_groups: list[str] = []
    correct_positions_by_group: dict[str, int] = {}
    points_by_group: dict[str, int] = {}

    actual_groups = actual_group_stage.get("groups", {})
    for group_name, actual_group in actual_groups.items():
        if not actual_group.get("finalized"):
            continue

        actual_standings = actual_group.get("standings", [])
        predicted_standings = predicted_groups.get(group_name, [])
        if not actual_standings or not predicted_standings:
            continue

        finalized_groups += 1
        matching_positions = sum(
            1
            for predicted_team, actual_team in zip(predicted_standings, actual_standings)
            if predicted_team == actual_team
        )
        correct_positions += matching_positions
        correct_positions_by_group[group_name] = matching_positions
        group_score = matching_positions * points_per_team

        if predicted_standings == actual_standings:
            perfect_groups.append(group_name)
            group_score += perfect_group_bonus

        points_by_group[group_name] = group_score
        group_points += group_score

    return {
        "points": group_points,
        "correctPositions": correct_positions,
        "perfectGroups": perfect_groups,
        "finalizedGroupsScored": finalized_groups,
        "correctPositionsByGroup": correct_positions_by_group,
        "pointsByGroup": points_by_group,
    }


def score_knockout(
    predicted_knockout: dict[str, Any],
    actual_knockout: dict[str, Any],
    scoring_rules: dict[str, Any],
) -> dict[str, Any]:
    knockout_points = 0
    breakdown: dict[str, Any] = {}

    for score_key, prediction_key, actual_key in ROUND_SPECS:
        predicted_teams = set(predicted_knockout.get(prediction_key, []))
        actual_teams = set(actual_knockout.get(actual_key, []))
        correct_teams = sorted(predicted_teams & actual_teams)
        points = len(correct_teams) * scoring_rules["knockout"][score_key]

        breakdown[score_key] = {
            "points": points,
            "correctTeams": correct_teams,
            "predictedCount": len(predicted_teams),
            "actualKnownCount": len(actual_teams),
        }
        knockout_points += points

    actual_champion = actual_knockout.get("champion")
    champion_correct = bool(
        actual_champion and predicted_knockout.get("champion") == actual_champion
    )
    champion_points = scoring_rules["knockout"]["champion"] if champion_correct else 0
    knockout_points += champion_points
    breakdown["champion"] = {
        "points": champion_points,
        "predictedTeam": predicted_knockout.get("champion"),
        "actualTeam": actual_champion,
        "correct": champion_correct,
    }

    breakdown["points"] = knockout_points
    return breakdown


def score_entry(
    entry: dict[str, Any],
    actual_results: dict[str, Any],
    scoring_rules: dict[str, Any],
) -> dict[str, Any]:
    group_stage_breakdown = score_group_stage(
        entry["groupStage"]["groups"],
        actual_results["groupStage"],
        scoring_rules,
    )
    knockout_breakdown = score_knockout(
        entry["knockout"],
        actual_results["knockout"],
        scoring_rules,
    )
    total_points = group_stage_breakdown["points"] + knockout_breakdown["points"]

    return {
        "id": entry["id"],
        "displayName": entry["displayName"],
        "points": {
            "total": total_points,
            "groupStage": group_stage_breakdown["points"],
            "knockout": knockout_breakdown["points"],
        },
        "groupStage": group_stage_breakdown,
        "knockout": knockout_breakdown,
    }


def _competition_rank(sorted_entries: list[dict[str, Any]]) -> None:
    previous_points: int | None = None
    previous_rank = 0
    for index, entry in enumerate(sorted_entries, start=1):
        points = entry["points"]["total"]
        if points == previous_points:
            entry["rank"] = previous_rank
        else:
            entry["rank"] = index
            previous_rank = index
            previous_points = points


def build_tracker_outputs(
    brackets_doc: dict[str, Any],
    actual_results: dict[str, Any],
    scoring_rules: dict[str, Any],
    generated_at: str | None = None,
) -> dict[str, Any]:
    scored_entries = [
        score_entry(entry, actual_results, scoring_rules)
        for entry in brackets_doc.get("entries", [])
    ]
    scored_entries.sort(
        key=lambda item: (
            -item["points"]["total"],
            -item["points"]["groupStage"],
            -item["points"]["knockout"],
            item["displayName"].lower(),
        )
    )
    _competition_rank(scored_entries)

    leaderboard_rows = [
        {
            "rank": entry["rank"],
            "id": entry["id"],
            "displayName": entry["displayName"],
            "totalPoints": entry["points"]["total"],
            "groupStagePoints": entry["points"]["groupStage"],
            "knockoutPoints": entry["points"]["knockout"],
        }
        for entry in scored_entries
    ]

    progress = {
        "groupsFinalized": sum(
            1
            for group in actual_results["groupStage"]["groups"].values()
            if group.get("finalized")
        ),
        "roundOf16TeamsKnown": len(actual_results["knockout"].get("roundOf16Teams", [])),
        "quarterfinalTeamsKnown": len(actual_results["knockout"].get("quarterfinalTeams", [])),
        "semifinalTeamsKnown": len(actual_results["knockout"].get("semifinalTeams", [])),
        "finalTeamsKnown": len(actual_results["knockout"].get("finalTeams", [])),
        "championKnown": bool(actual_results["knockout"].get("champion")),
    }

    metadata = {
        "generatedAt": generated_at or datetime.now(timezone.utc).isoformat(),
        "asOf": actual_results.get("metadata", {}).get("asOf"),
        "entrants": len(scored_entries),
        "scoringSystem": scoring_rules.get("name"),
    }

    return {
        "leaderboard": {
            "metadata": deepcopy(metadata),
            "progress": deepcopy(progress),
            "leaderboard": leaderboard_rows,
        },
        "entryProgress": {
            "metadata": metadata,
            "progress": progress,
            "entries": scored_entries,
        },
    }


def write_tracker_outputs(
    brackets_path: str | Path,
    actual_results_path: str | Path,
    scoring_rules_path: str | Path,
    output_dir: str | Path,
    generated_at: str | None = None,
) -> dict[str, Any]:
    outputs = build_tracker_outputs(
        load_json(brackets_path),
        load_json(actual_results_path),
        load_json(scoring_rules_path),
        generated_at=generated_at,
    )

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    (output_path / "leaderboard.json").write_text(
        json.dumps(outputs["leaderboard"], indent=2),
        encoding="utf-8",
    )
    (output_path / "entry-progress.json").write_text(
        json.dumps(outputs["entryProgress"], indent=2),
        encoding="utf-8",
    )
    return outputs
