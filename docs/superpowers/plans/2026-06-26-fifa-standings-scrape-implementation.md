# FIFA Standings Scrape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blocked API-Football group-stage sync with a Playwright-based FIFA standings scrape that refreshes live group tables and best third-placed teams during group-stage match windows.

**Architecture:** Keep the current repo-driven refresh pipeline and preserve `data/actual-results.json` as the downstream contract. Add a dedicated FIFA standings scraper module, rewire the existing sync entrypoint to use it, preserve the existing knockout block untouched, and update GitHub Actions to install Playwright and run on a tight June 11-27 UTC schedule.

**Tech Stack:** Python 3.11, Playwright for Python, `unittest`, GitHub Actions, existing JSON generation/publish scripts

---

## File Structure

Create or modify these files during implementation:

- Create: `requirements.txt`
- Create: `worldcup_tracker/fifa_standings_sync.py`
- Modify: `worldcup_tracker/results_sync.py`
- Modify: `scripts/sync_actual_results.py`
- Modify: `tests/test_results_sync.py`
- Modify: `.github/workflows/refresh-data.yml`
- Modify: `.github/workflows/deploy-pages.yml`

The new scraper logic should live in `worldcup_tracker/fifa_standings_sync.py`. The existing `results_sync.py` file should become the repo-facing orchestration layer that builds the final `actual-results.json` document and preserves the knockout block.

### Task 1: Add failing FIFA standings tests and provider-independent sync expectations

**Files:**
- Modify: `tests/test_results_sync.py`

- [ ] **Step 1: Replace the API-Football-specific test fixtures with FIFA standings fixtures**

Update `tests/test_results_sync.py` to import the new FIFA helpers and define synthetic FIFA table data:

```python
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


def make_table(group: str, rows: list[tuple[str, int, int, int, int, int, int, int, int]]) -> dict[str, object]:
    built_rows = []
    for position, (team, played, win, draw, lose, goals_for, goals_against, tcs, points) in enumerate(rows, start=1):
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
    make_table("E", [("Germany", 3, 2, 0, 1, 10, 4, -1, 6), ("Ivory Coast", 3, 2, 0, 1, 4, 2, -4, 6), ("Ecuador", 3, 1, 1, 1, 2, 2, -5, 4), ("Curacao", 3, 0, 1, 2, 1, 9, -7, 1)]),
    make_table("F", [("Netherlands", 3, 2, 1, 0, 10, 4, -3, 7), ("Japan", 3, 1, 2, 0, 7, 3, -1, 5), ("Sweden", 3, 1, 1, 1, 7, 7, -5, 4), ("Tunisia", 3, 0, 0, 3, 2, 12, -1, 0)]),
    make_table("G", [("Egypt", 2, 1, 1, 0, 4, 2, -3, 4), ("Iran", 2, 0, 2, 0, 2, 2, -2, 2), ("Belgium", 2, 0, 2, 0, 1, 1, -7, 2), ("New Zealand", 2, 0, 1, 1, 3, 5, -2, 1)]),
    make_table("H", [("Spain", 2, 1, 1, 0, 5, 1, -3, 4), ("Uruguay", 2, 0, 2, 0, 1, 1, -4, 2), ("Cape Verde", 2, 0, 2, 0, 2, 2, -2, 2), ("Saudi Arabia", 2, 0, 1, 1, 1, 5, -4, 1)]),
    make_table("I", [("France", 2, 2, 0, 0, 5, 0, -3, 6), ("Norway", 2, 2, 0, 0, 4, 0, -1, 6), ("Senegal", 2, 0, 0, 2, 1, 4, -6, 0), ("Iraq", 2, 0, 0, 2, 0, 6, -4, 0)]),
    make_table("J", [("Argentina", 2, 2, 0, 0, 5, 0, -2, 6), ("Austria", 2, 1, 0, 1, 2, 2, -3, 3), ("Algeria", 2, 1, 0, 1, 1, 3, -5, 3), ("Jordan", 2, 0, 0, 2, 0, 3, -1, 0)]),
    make_table("K", [("Colombia", 2, 2, 0, 0, 3, 0, -1, 6), ("Portugal", 2, 1, 1, 0, 6, 1, -2, 4), ("DR Congo", 2, 0, 1, 1, 1, 2, -3, 1), ("Uzbekistan", 2, 0, 0, 2, 1, 8, -4, 0)]),
    make_table("L", [("England", 2, 1, 1, 0, 2, 0, -3, 4), ("Ghana", 2, 1, 1, 0, 4, 3, -2, 4), ("Croatia", 2, 1, 0, 1, 3, 4, -1, 3), ("Panama", 2, 0, 0, 2, 2, 4, -5, 0)]),
]
```

- [ ] **Step 2: Add failing tests for group parsing, third-place ranking, schedule gating, and knockout preservation**

Add these tests to `tests/test_results_sync.py`:

```python
def test_build_group_stage_from_fifa_tables_builds_all_groups_and_best_thirds(self) -> None:
    group_stage = build_group_stage_from_fifa_tables(FIFA_TABLES)

    self.assertEqual(sorted(group_stage["groups"].keys()), list("ABCDEFGHIJKL"))
    self.assertEqual(group_stage["groups"]["A"]["standings"], ["Mexico", "South Africa", "South Korea", "Czechia"])
    self.assertEqual(group_stage["groups"]["G"]["standings"], ["Egypt", "Iran", "Belgium", "New Zealand"])
    self.assertTrue(group_stage["groups"]["A"]["finalized"])
    self.assertFalse(group_stage["groups"]["G"]["finalized"])
    self.assertEqual(
        group_stage["bestThirdPlacedTeams"][:8],
        [
            "Bosnia and Herzegovina",
            "Ecuador",
            "Sweden",
            "Paraguay",
            "South Korea",
            "Scotland",
            "Croatia",
            "Algeria",
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
```

- [ ] **Step 3: Run the backend tests to verify the new expectations fail**

Run: `python -m unittest discover -s tests -p "test_results_sync.py" -v`

Expected:
- import failures for `worldcup_tracker.fifa_standings_sync`
- patch target failures for `scrape_fifa_standings_tables`
- failing assertions for provider behavior that does not exist yet

- [ ] **Step 4: Commit**

```bash
git add tests/test_results_sync.py
git commit -m "test: define FIFA standings sync contract"
```

### Task 2: Implement the FIFA standings scraper module and pure group-stage builder

**Files:**
- Create: `requirements.txt`
- Create: `worldcup_tracker/fifa_standings_sync.py`

- [ ] **Step 1: Add the Python dependencies needed for browser scraping**

Create `requirements.txt`:

```text
playwright==1.54.0
```

- [ ] **Step 2: Implement the dedicated FIFA standings module**

Create `worldcup_tracker/fifa_standings_sync.py`:

```python
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
    "Korea Republic": "South Korea",
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
            page.get_by_role("heading", name="Standings and Group Tables").wait_for(timeout=timeout_ms)
            tables = page.locator("main table").evaluate_all(
                """
                (elements) => elements.map((table) => {
                  const caption = table.querySelector("caption")?.textContent?.trim() ?? "";
                  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
                  return {
                    group: caption.replace("Standings and Group Tables - Group ", "").trim(),
                    rows: bodyRows.map((row) => {
                      const cells = Array.from(row.querySelectorAll("td")).map((cell) =>
                        (cell.textContent || "").replace(/\\s+/g, " ").trim()
                      );
                      const teamLink = row.querySelector("td a");
                      const teamName =
                        teamLink?.getAttribute("aria-label") ||
                        teamLink?.getAttribute("title") ||
                        row.getAttribute("aria-label") ||
                        cells[2] ||
                        "";
                      return {
                        position: Number(cells[1] || 0),
                        team: teamName.replace(/^Position \\d+,\\s*/, "").replace(/, qualified.*$/, "").replace(/, \\d+ points$/, "").trim(),
                        played: Number(cells[3] || 0),
                        win: Number(cells[4] || 0),
                        draw: Number(cells[5] || 0),
                        lose: Number(cells[6] || 0),
                        goals_for: Number(cells[7] || 0),
                        goals_against: Number(cells[8] || 0),
                        goal_difference: Number(cells[9] || 0),
                        tcs: Number(cells[10] || 0),
                        points: Number(cells[11] || 0),
                      };
                    }),
                  };
                })
                """
            )
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
        rows = [_coerce_row(group, raw_row) for raw_row in raw_table["rows"]]
        rows = sorted(rows, key=lambda row: row.position)
        if group not in groups:
            raise ValueError(f"Unexpected group key: {group}")
        if len(rows) != 4:
            raise ValueError(f"Group {group} must contain exactly four rows")

        groups[group] = {
            "finalized": all(row.played == 3 for row in rows),
            "standings": [row.team for row in rows],
        }
        third_place_rows.append(rows[2])

    best_thirds = [
        row.team
        for row in sorted(
            third_place_rows,
            key=lambda row: (row.points, row.goal_difference, row.goals_for, row.tcs),
            reverse=True,
        )[:8]
    ]

    return {"groups": groups, "bestThirdPlacedTeams": best_thirds}
```

- [ ] **Step 3: Run the backend tests to verify the pure parsing behavior now passes and the orchestration tests still fail**

Run: `python -m unittest discover -s tests -p "test_results_sync.py" -v`

Expected:
- group-stage builder tests pass
- orchestration tests still fail because `results_sync.py` has not been rewired yet

- [ ] **Step 4: Commit**

```bash
git add requirements.txt worldcup_tracker/fifa_standings_sync.py
git commit -m "feat: add FIFA standings scraper module"
```

### Task 3: Rewire the sync entrypoint to use FIFA data and preserve knockout state

**Files:**
- Modify: `worldcup_tracker/results_sync.py`
- Modify: `scripts/sync_actual_results.py`

- [ ] **Step 1: Replace the API-Football orchestration with FIFA group-stage orchestration**

Update `worldcup_tracker/results_sync.py` to remove API-Football fetch logic and use the new FIFA scraper:

```python
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
        handle.write("\\n")
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
```

- [ ] **Step 2: Simplify the script entrypoint so it no longer requires `API_FOOTBALL_KEY`**

Update `scripts/sync_actual_results.py`:

```python
from __future__ import annotations

import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from worldcup_tracker.results_sync import run_sync_from_env


def main() -> None:
    output_path = Path("data/actual-results.json")
    document = run_sync_from_env(os.environ, output_path)
    print(
        json.dumps(
            {
                "provider": document["metadata"]["provider"],
                "asOf": document["metadata"]["asOf"],
                "outputPath": str(output_path),
            }
        )
    )


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the backend tests to verify the orchestration contract passes**

Run: `python -m unittest discover -s tests -p "test_results_sync.py" -v`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add worldcup_tracker/results_sync.py scripts/sync_actual_results.py
git commit -m "feat: wire FIFA standings sync into results pipeline"
```

### Task 4: Update GitHub Actions for Playwright installation, free-tier scheduling, and full test coverage

**Files:**
- Modify: `.github/workflows/refresh-data.yml`
- Modify: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Tighten the refresh schedule and install Python browser dependencies**

Update `.github/workflows/refresh-data.yml`:

```yaml
name: Refresh Tracker Data

on:
  workflow_dispatch:
  schedule:
    - cron: "*/5 0-2,16-23 11-27 6 *"

permissions:
  contents: write

concurrency:
  group: refresh-tracker-data
  cancel-in-progress: true

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Python dependencies
        run: python -m pip install -r requirements.txt

      - name: Install Playwright Chromium
        run: python -m playwright install --with-deps chromium

      - name: Sync actual tournament results
        run: python scripts/sync_actual_results.py

      - name: Determine generated metadata timestamp
        id: generated_at
        shell: bash
        run: |
          value="$(python - <<'PY'
          import json
          from pathlib import Path

          doc = json.loads(Path("data/actual-results.json").read_text(encoding="utf-8"))
          print(doc.get("metadata", {}).get("asOf") or "")
          PY
          )"

          if [ -z "$value" ]; then
            value="$(git log -1 --format=%cI)"
          fi

          echo "value=$value" >> "$GITHUB_OUTPUT"

      - name: Regenerate tracker data
        run: >
          python scripts/generate_tracker_data.py
          --generated-at "${{ steps.generated_at.outputs.value }}"

      - name: Publish frontend data
        run: python scripts/publish_frontend_data.py

      - name: Commit refreshed data when it changed
        shell: bash
        run: |
          if git diff --quiet -- data/actual-results.json data/generated app/public/data; then
            echo "No tracker data changes detected."
            exit 0
          fi

          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/actual-results.json data/generated app/public/data
          git commit -m "chore: refresh tracker data"
          git push
```

- [ ] **Step 2: Update the deploy workflow to install Playwright and run the full backend suite**

Update `.github/workflows/deploy-pages.yml`:

```yaml
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Python dependencies
        run: python -m pip install -r requirements.txt

      - name: Install Playwright Chromium
        run: python -m playwright install --with-deps chromium

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: app/package-lock.json

      - name: Install frontend dependencies
        working-directory: app
        run: npm ci

      - name: Sync actual tournament results
        run: python scripts/sync_actual_results.py
```

Replace the backend test step with:

```yaml
      - name: Run backend tests
        run: python -m unittest discover -s tests -p "test_*.py"
```

- [ ] **Step 3: Run the backend test suite locally to verify the workflow command**

Run: `python -m unittest discover -s tests -p "test_*.py"`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/refresh-data.yml .github/workflows/deploy-pages.yml
git commit -m "feat: schedule FIFA standings refresh in GitHub Actions"
```

### Task 5: Verify the full FIFA scrape path end-to-end

**Files:**
- Review only: `worldcup_tracker/`
- Review only: `tests/`
- Review only: `.github/workflows/`

- [ ] **Step 1: Install dependencies and run the local sync once**

Run:

```bash
python -m pip install -r requirements.txt
python -m playwright install chromium
python scripts/sync_actual_results.py
```

Expected:
- dependencies install successfully
- Playwright installs Chromium
- the sync script prints a JSON summary containing `provider` and `outputPath`

- [ ] **Step 2: Inspect the resulting actual results snapshot**

Run:

```bash
Get-Content data\actual-results.json -TotalCount 120
```

Expected:
- `metadata.provider` is `fifa-standings-scrape`
- groups `A` through `L` contain standings arrays
- `bestThirdPlacedTeams` is populated
- the `knockout` block remains structurally intact

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
python -m unittest discover -s tests -p "test_*.py"
python scripts/generate_tracker_data.py --generated-at "$(python - <<'PY'
import json
from pathlib import Path
doc = json.loads(Path('data/actual-results.json').read_text(encoding='utf-8'))
print(doc['metadata']['asOf'] or '')
PY
)"
python scripts/publish_frontend_data.py
```

Expected:
- all backend tests pass
- tracker data generation succeeds
- publish step succeeds

- [ ] **Step 4: Commit the integrated implementation**

```bash
git add requirements.txt worldcup_tracker scripts tests .github/workflows
git commit -m "feat: scrape FIFA standings for live group updates"
```

## Self-Review

Spec coverage:

- GitHub Actions remains the orchestrator in Tasks 3 and 4.
- A dedicated FIFA scraping module is added in Task 2.
- Group-stage standings and `bestThirdPlacedTeams` are covered in Tasks 1 and 2.
- Knockout preservation and scope separation are covered in Task 3.
- Tight five-minute scheduling during group-stage windows is covered in Task 4.
- Conservative failure handling is covered in Tasks 1 and 3.

Placeholder scan:

- No `TODO`, `TBD`, or deferred implementation markers remain.
- Every code-changing task names exact files and includes concrete code.
- Every verification step includes an exact command and expected outcome.

Type consistency:

- `build_group_stage_from_fifa_tables`, `scrape_fifa_standings_tables`, and `should_run_fifa_group_stage_refresh` are introduced in Task 2 and reused consistently in Tasks 1 and 3.
- `sync_actual_results` keeps a single orchestration responsibility throughout the plan.
- Workflow installation commands align with the new `requirements.txt` approach.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-26-fifa-standings-scrape-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
