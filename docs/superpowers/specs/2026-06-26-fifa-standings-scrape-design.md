# FIFA Standings Scrape Design

Date: 2026-06-26

## Overview

This document defines a replacement for the API-Football group-stage ingestion path by scraping the official FIFA World Cup 2026 standings page. The goal is to keep the existing repository-centered refresh pipeline while switching the upstream provider from a paid API to FIFA's live standings tables.

The new design keeps the current downstream structure intact:

- GitHub Actions remains the orchestrator.
- `data/actual-results.json` remains the scoring source of truth.
- Existing generation and publish scripts remain unchanged.
- A new group-stage scraper becomes the provider integration point for live standings.

## Goals

- Scrape the official FIFA World Cup 2026 standings page for current group standings.
- Refresh standings during live group-stage match windows at a five-minute cadence.
- Capture current group-table state before matches finish, not just finalized results.
- Derive `bestThirdPlacedTeams` from the current standings snapshot.
- Preserve the last known good `data/actual-results.json` when scraping or parsing fails.
- Keep the current repo-driven data generation and publication flow.

## Non-Goals

- No Lambda, S3, or separate hosted ingestion service.
- No browser-side scraping from the frontend runtime.
- No knockout progression logic in this scraper.
- No attempt to scrape every FIFA page needed for the full bracket.
- No migration away from GitHub Actions.

## Existing Context

The repository already has a working refresh pipeline:

- `.github/workflows/refresh-data.yml` schedules data refreshes and commits output changes.
- `scripts/sync_actual_results.py` is the entrypoint for upstream result ingestion.
- `worldcup_tracker/results_sync.py` builds `data/actual-results.json`.
- `scripts/generate_tracker_data.py` builds leaderboard and progress output.
- `scripts/publish_frontend_data.py` copies generated data into the frontend public folder.

The current gap is upstream provider access for World Cup 2026 standings. API-Football's free tier cannot access `season=2026`, so the existing integration cannot produce live group standings with the current plan.

## Chosen Approach

The implementation will replace the API-Football group-stage fetch with a Playwright-based scrape of FIFA's official standings page, executed inside GitHub Actions on standard GitHub-hosted Linux runners.

Why this approach:

- The repository is public, so standard GitHub-hosted runners can be used without paid GitHub Actions minutes.
- The current repo pipeline already fits scheduled ingestion.
- FIFA is the authoritative source and explicitly presents live-updating standings during matches.
- GitHub Actions is operationally simpler than introducing Lambda and storage infrastructure.

## Source Page

The scraper targets:

- `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings`

Observed page characteristics:

- A plain HTTP fetch returns only a JavaScript app shell.
- The rendered browser page exposes structured standings tables in the DOM after JavaScript loads.
- The page includes a live-update notice stating that standings are updated during matches and may change while matches are in progress.

This means the scraper must use a headless browser and read rendered DOM tables rather than relying on static HTML.

## Scheduling Strategy

The scraper will run on a tight schedule only during known group-stage match windows.

Scheduling rules:

- Use GitHub Actions `on.schedule`.
- Use the minimum five-minute cadence only within defined cron windows.
- Restrict the scraper in code to the World Cup group-stage date range.
- Allow the workflow to exit quickly outside active group-stage dates.

Why this schedule:

- It preserves live-ish updates during matches.
- It avoids running every five minutes all day.
- It reduces operational noise and keeps workflow execution lean.
- It stays comfortably within the intended free public-repo GitHub Actions usage model.

The implementation should encode match-window schedules explicitly for the group stage rather than polling continuously.

## Data Contract

The existing `data/actual-results.json` schema remains the contract.

Relevant fields for this design:

- `metadata`
  - `tournament`
  - `asOf`
  - `notes`
  - `provider`
  - `providerFetchedAt`
- `groupStage`
  - `groups`
    - `A` through `L`
    - `finalized`
    - `standings`
  - `bestThirdPlacedTeams`
- `knockout`
  - preserved but not actively updated by this scraper

Downstream code should not need structural changes to consume the refreshed file.

## Scope Boundary

This scraper owns group-stage state only.

Included:

- all 12 group standings
- current ordering during live matches
- group completion status
- current best-third-place ranking
- metadata for FIFA scrape time

Excluded:

- knockout bracket advancement
- Round of 32 through final progression
- champion tracking

Knockout ingestion will be implemented separately after group-stage work is complete.

## Extraction Strategy

The scraper should use Playwright to render the FIFA standings page and extract structured tables from the DOM.

High-level extraction flow:

1. Launch headless Chromium in GitHub Actions.
2. Open the FIFA standings page.
3. Wait for the standings section and tables to render.
4. Read all group tables from the DOM.
5. Normalize rows into internal standings objects.
6. Derive `bestThirdPlacedTeams` from the third-place rows across groups.
7. Write the normalized `actual-results.json` snapshot atomically.

The extractor should prefer table-based DOM traversal over brittle text scraping.

The minimum row data to collect per team is:

- group name
- current position
- team name
- matches played
- wins
- draws
- losses
- goals for
- goals against
- goal difference
- disciplinary or tie-break-related column if needed
- points
- qualification labeling when available

Even if only final ordered standings lists are stored downstream, richer extracted row data should be kept in-memory long enough to derive `bestThirdPlacedTeams` safely.

## Group Standings Mapping

Each FIFA table maps to one local group key `A` through `L`.

Normalization rules:

- The table heading or caption identifies the group.
- Teams are ordered by displayed table position.
- `standings` becomes an ordered list of normalized team names.
- `finalized` is `true` only when all four teams in the group have played three matches.
- In-progress tables are still written even when `finalized` is `false`.

This satisfies the requirement to show "what the group standings are in the current moment before games even finish playing."

## Third-Place Teams Mapping

`bestThirdPlacedTeams` will be derived from the current third-place team in each group after all 12 group tables are collected.

Ranking order should follow FIFA's displayed standings logic as closely as practical from the scraped columns:

1. points
2. goal difference
3. goals scored
4. the visible `TCS` column when necessary
5. displayed FIFA table order as the final fallback

The implementation should avoid inventing unsupported tie-break logic. If FIFA's page already exposes enough ordering to determine the current third-place ranking directly or indirectly, the scraper should follow that presentation rather than adding speculative rules.

The initial implementation only needs to output the ordered top eight third-place teams as they stand at scrape time.

## Team Name Normalization

FIFA team names may differ from the bracket naming used in existing prediction files.

The implementation should centralize a FIFA-to-local name mapping near the scraper logic.

Examples from observed FIFA tables that may matter:

- `Korea Republic` may need mapping if predictions use a different display name.
- Any other mismatches should be handled in one explicit overrides map.

The scoring layer should continue to consume normalized local names, not provider-specific names.

## Workflow Design

The refresh workflow remains the primary orchestrator.

Expected flow:

1. Check out the repository.
2. Set up Python.
3. Set up Playwright runtime dependencies.
4. Run the FIFA standings sync script.
5. Read the generated timestamp from `data/actual-results.json`.
6. Regenerate tracker data.
7. Publish frontend data.
8. Commit only if generated outputs changed.

The workflow should continue to be safe for repeated runs:

- no-op when no output changes
- preserve last good snapshot on scrape failure
- avoid partial file writes

## Failure Handling

Failure behavior should remain conservative.

On any failure to load, render, parse, or validate:

- do not overwrite the last good results file
- log a clear warning in workflow output
- return the existing results document when one is already present

Likely failure cases:

- FIFA changes the page markup
- a cookie or interstitial blocks the page
- tables do not render in time
- fewer than 12 groups are found
- duplicate or missing teams appear in parsed output

## Validation Rules

Before replacing `data/actual-results.json`, validate:

- all groups `A` through `L` exist
- each group has exactly four teams in standings order
- no duplicate teams appear across groups
- `finalized` is a boolean for every group
- `bestThirdPlacedTeams` is a list
- at least one standings source was successfully parsed

The scraper should also validate that parsed group counts and row counts match the expected 48-team tournament format.

## Output Semantics

Metadata should reflect FIFA as the provider.

Recommended metadata values:

- `tournament`: `FIFA World Cup 2026`
- `provider`: `fifa-standings-scrape`
- `notes`: concise note that the snapshot is scraped from FIFA live standings
- `asOf`: scrape timestamp
- `providerFetchedAt`: scrape timestamp

This keeps the file self-describing and helps with debugging when reviewing generated commits.

## Testing Strategy

The implementation should include automated coverage for parsing and normalization.

Recommended tests:

- rendered FIFA table HTML or DOM fixture normalizes into all 12 groups
- group ordering is preserved exactly as displayed
- `finalized` is false for in-progress groups and true for completed groups
- third-place ranking derives correctly from scraped rows
- name normalization handles known FIFA-to-local differences
- invalid or incomplete parsed output preserves the previous results file

Tests should avoid live browser access by using saved DOM fixtures or extracted HTML fragments.

## Operational Notes

- The scraper should be implemented in a dedicated module rather than mixed into API-Football codepaths.
- The current sync entrypoint can stay the same if its provider internals are swapped.
- The group-stage scraper should be easy to disable or replace later when knockout scraping is introduced.
- Logging should stay concise and action-oriented.

## Risks

Primary risks:

- FIFA changes markup during the tournament
- GitHub Actions browser setup adds complexity compared to plain Python requests
- third-place ranking may require careful tie-break handling in edge cases
- FIFA naming may not match prediction naming exactly

Mitigations:

- use DOM-table extraction instead of freeform text scraping
- keep validations strict and preserve the last known good file
- centralize provider-specific name mapping
- isolate the scraper in a small module so adjustments stay localized

## Verification

This design is complete when the following are true:

- GitHub Actions can run a Playwright-based FIFA standings scrape on a five-minute match-window schedule
- `data/actual-results.json` updates with live group standings from FIFA
- `bestThirdPlacedTeams` reflects current group-stage state
- downstream generation and publication continue unchanged
- scrape failures leave the previous snapshot untouched

## Future Extensions

Possible later follow-up work:

- separate knockout scraper and workflow path after the group stage
- saved raw FIFA scrape fixtures for debugging
- more precise match-window scheduling by date instead of broad hourly windows
- alerts for repeated scraper failures

These are intentionally out of scope for the first group-stage FIFA scraper.
