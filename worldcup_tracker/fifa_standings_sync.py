from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


FIFA_STANDINGS_URL = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings"
GROUP_KEYS = tuple("ABCDEFGHIJKL")
GROUP_STAGE_START = datetime(2026, 6, 11, 0, 0, tzinfo=timezone.utc)
GROUP_STAGE_END = datetime(2026, 6, 27, 23, 59, tzinfo=timezone.utc)
ACTIVE_UTC_HOURS = frozenset({0, 1, 2, 16, 17, 18, 19, 20, 21, 22, 23})
TEAM_NAME_OVERRIDES = {
    "Bosnia & Herzegovina": "Bosnia and Herzegovina",
    "Côte d'Ivoire": "Cote d'Ivoire",
    "Curaçao": "Curacao",
    "Türkiye": "Turkiye",
}


@dataclass(frozen=True)
class StandingRow:
    group: str
    position: int
    team: str
    played: int
    win: int
    draw: int
    lose: int
    goals_for: int
    goals_against: int
    goal_difference: int
    tcs: int
    points: int


def _apply_team_name(name: str) -> str:
    return TEAM_NAME_OVERRIDES.get(name, name)


def should_run_fifa_group_stage_refresh(now: datetime) -> bool:
    current = now.astimezone(timezone.utc)
    return GROUP_STAGE_START <= current <= GROUP_STAGE_END and current.hour in ACTIVE_UTC_HOURS


def scrape_fifa_standings_tables(timeout_ms: int = 30000) -> list[dict[str, Any]]:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(FIFA_STANDINGS_URL, wait_until="domcontentloaded", timeout=timeout_ms)
            page.wait_for_selector("main table tbody tr", timeout=timeout_ms)
            page.wait_for_timeout(1000)
            tables = page.locator("main table").evaluate_all(
                """
                (elements) => {
                  const numberOrZero = (value) => {
                    const match = String(value || "").match(/-?\\d+/);
                    return match ? Number(match[0]) : 0;
                  };
                  const clean = (value) => String(value || "").replace(/\\s+/g, " ").trim();
                  const groupFromTable = (table) => {
                    const caption = clean(table.querySelector("caption")?.textContent);
                    if (caption) {
                      const match = caption.match(/Group\\s+([A-L])/i);
                      if (match) {
                        return match[1].toUpperCase();
                      }
                    }

                    let node = table.parentElement;
                    while (node) {
                      const heading = node.querySelector("h2, h3, h4");
                      const label = clean(heading?.textContent);
                      const match = label.match(/Group\\s+([A-L])/i);
                      if (match) {
                        return match[1].toUpperCase();
                      }
                      node = node.parentElement;
                    }

                    const before = table.previousElementSibling;
                    const text = clean(before?.textContent);
                    const match = text.match(/Group\\s+([A-L])/i);
                    return match ? match[1].toUpperCase() : "";
                  };

                  return elements
                    .map((table) => {
                      const group = groupFromTable(table);
                      const rows = Array.from(table.querySelectorAll("tbody tr"))
                        .map((row) => {
                          const cells = Array.from(row.querySelectorAll("td")).map((cell) => clean(cell.textContent));
                          const teamLink = row.querySelector("td a[aria-label]");
                          const teamText = clean(teamLink?.getAttribute("aria-label") || "");

                          if (!group || !teamText || cells.length < 12) {
                            return null;
                          }

                          return {
                            position: numberOrZero(cells[1]),
                            team: teamText,
                            played: numberOrZero(cells[3]),
                            win: numberOrZero(cells[4]),
                            draw: numberOrZero(cells[5]),
                            lose: numberOrZero(cells[6]),
                            goals_for: numberOrZero(cells[7]),
                            goals_against: numberOrZero(cells[8]),
                            goal_difference: numberOrZero(cells[9]),
                            tcs: numberOrZero(cells[10]),
                            points: numberOrZero(cells[11]),
                          };
                        })
                        .filter(Boolean);
                      return { group, rows };
                    })
                    .filter((table) => table.group && table.rows.length);
                }
                """
            )
            if not tables:
                raise RuntimeError("FIFA standings page rendered without any group tables")
            return tables
        except PlaywrightTimeoutError as exc:
            raise RuntimeError("Timed out waiting for FIFA standings tables to render") from exc
        finally:
            browser.close()


def _coerce_row(group: str, raw_row: dict[str, Any]) -> StandingRow:
    team_name = str(raw_row["team"]).strip()
    if not team_name:
        raise ValueError(f"Missing team name for Group {group}")
    return StandingRow(
        group=group,
        position=int(raw_row["position"]),
        team=_apply_team_name(team_name),
        played=int(raw_row["played"]),
        win=int(raw_row["win"]),
        draw=int(raw_row["draw"]),
        lose=int(raw_row["lose"]),
        goals_for=int(raw_row["goals_for"]),
        goals_against=int(raw_row["goals_against"]),
        goal_difference=int(raw_row["goal_difference"]),
        tcs=int(raw_row["tcs"]),
        points=int(raw_row["points"]),
    )


def build_group_stage_from_fifa_tables(tables: list[dict[str, Any]]) -> dict[str, Any]:
    groups: dict[str, dict[str, Any]] = {key: {"finalized": False, "standings": []} for key in GROUP_KEYS}
    third_place_rows: list[StandingRow] = []

    for raw_table in tables:
        group = str(raw_table["group"]).strip().upper()
        if group not in groups:
            raise ValueError(f"Unexpected group key: {group}")

        rows = [_coerce_row(group, raw_row) for raw_row in raw_table["rows"]]
        rows = sorted(rows, key=lambda row: row.position)
        if len(rows) != 4:
            raise ValueError(f"Group {group} must contain exactly four rows")

        groups[group] = {
            "finalized": all(row.played == 3 for row in rows),
            "standings": [row.team for row in rows],
        }
        third_place_rows.append(rows[2])

    if len(third_place_rows) != len(GROUP_KEYS):
        raise ValueError("FIFA standings scrape did not return all 12 groups")

    best_thirds = [
        row.team
        for row in sorted(
            third_place_rows,
            key=lambda row: (row.points, row.goal_difference, row.goals_for, row.tcs),
            reverse=True,
        )[:8]
    ]

    return {"groups": groups, "bestThirdPlacedTeams": best_thirds}
