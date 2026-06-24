# API-Football Results Sync Design

Date: 2026-06-24

## Overview

This document defines the missing tournament-results ingestion step for the World Cup tracker repository. The goal is to update `data/actual-results.json` automatically from API-Football so the existing data generation, publish, and GitHub Pages deployment flow can produce real leaderboard updates instead of regenerating placeholder values from an empty seed file.

The design keeps the current architecture narrow:

- GitHub Actions remains the orchestrator.
- `data/actual-results.json` remains the internal source of truth for scoring.
- Existing tracker generation and frontend publish scripts remain unchanged.
- A new sync script becomes the single provider integration point.

## Goals

- Pull FIFA World Cup 2026 standings and match results from API-Football.
- Normalize provider data into the existing `data/actual-results.json` schema.
- Preserve the last known good results file when provider fetch or normalization fails.
- Integrate the sync into both refresh and deploy workflows before leaderboard regeneration.
- Keep request volume well within the API-Football free tier by performing a small number of on-demand workflow runs.

## Non-Goals

- No new backend service, Lambda function, or database.
- No browser-side calls to API-Football.
- No multi-provider abstraction layer beyond a thin internal adapter boundary.
- No changes to frontend runtime data fetching.
- No attempt to make the site update live during matches.

## Existing Context

The repository already has a complete downstream pipeline:

- `data/actual-results.json` is the scoring input contract.
- `worldcup_tracker/scoring.py` expects the current results schema and derives progress from it.
- `scripts/generate_tracker_data.py` generates leaderboard payloads from the normalized results file.
- `scripts/publish_frontend_data.py` copies generated leaderboard JSON into `app/public/data`.
- `.github/workflows/refresh-data.yml` and `.github/workflows/deploy-pages.yml` already run generation and publish steps.

The current gap is only upstream ingestion. Both workflows regenerate from a placeholder `data/actual-results.json`, so the deployed site remains stuck at zero-progress tournament state.

## Chosen Approach

The implementation will use a single sync script that fetches provider data and writes the full normalized results file in one pass.

Why this approach:

- It introduces the least new complexity.
- It protects the rest of the repo from provider-specific response shapes.
- It preserves the existing generator contract.
- It allows atomic validation before replacing the previous file.

The script will not patch the file incrementally. Each run rebuilds the complete normalized result snapshot from API-Football responses.

## Provider Choice

The chosen provider is API-Football.

Rationale:

- It covers the FIFA World Cup 2026 tournament.
- Its free tier is sufficient for this project's low request volume.
- It exposes fixtures, standings, and match-event detail in a structured API.
- It is a better fit than HTML parsing against FIFA's public app bundle.

The sync will rely on a GitHub Actions secret named `API_FOOTBALL_KEY`.

## Data Contract

The existing `data/actual-results.json` schema remains the contract for all downstream code.

Expected top-level shape:

- `metadata`
  - `tournament`
  - `asOf`
  - `notes`
  - `provider`
  - `providerFetchedAt`
- `groupStage`
  - `groups`
    - each group keyed by group letter
    - `finalized`
    - `standings`
  - `bestThirdPlacedTeams`
- `knockout`
  - `roundOf16Teams`
  - `quarterfinalTeams`
  - `semifinalTeams`
  - `finalTeams`
  - `champion`

The new script must preserve this exact functional shape so `worldcup_tracker/scoring.py` does not need to change.

## Data Mapping

The sync script will fetch at least these provider resources:

- tournament standings for group rankings
- tournament fixtures for completed and scheduled knockout progress

Normalization rules:

### Group Stage

- Group standings come from provider standings data.
- Each group is mapped into the local `groups` object by group letter.
- `standings` becomes an ordered list of team names in finishing order.
- `finalized` is `true` only when provider data indicates the group is complete enough to trust the final order.
- `bestThirdPlacedTeams` is derived from provider standings for third-place qualifiers once available.

### Knockout Progress

- `roundOf16Teams` is the set of teams present in the Round of 16 bracket once known.
- `quarterfinalTeams`, `semifinalTeams`, and `finalTeams` are derived from teams that have reached those rounds based on completed or confirmed bracket data.
- `champion` is set only once the final winner is known.

### Team Names

- Provider team names must match the names used in `data/brackets.json` predictions for scoring to work correctly.
- A local name-normalization map will be used when API-Football names differ from the bracket prediction naming convention.
- This mapping should live in code near the provider adapter rather than scattered across the scorer.

## Sync Script Design

The new script will be `scripts/sync_actual_results.py`.

Responsibilities:

1. Read `API_FOOTBALL_KEY` from environment.
2. Call API-Football for World Cup 2026 data.
3. Normalize provider responses into the local results schema.
4. Validate the complete normalized document.
5. Write to a temporary file first.
6. Replace `data/actual-results.json` only if validation succeeds.

Proposed structure:

- no CLI arguments are required for workflow execution; any debug overrides must remain local-development-only
- small HTTP helper for authenticated requests
- provider-specific fetch functions
- normalization functions for groups and knockout rounds
- validation function for the final output
- atomic write helper

This script should be readable and file-focused rather than heavily abstracted.

## Validation Rules

The sync script must refuse to overwrite the last good file if any of the following are true:

- required API calls fail
- the provider returns malformed or missing tournament payloads
- the normalized file is missing required top-level keys
- groups cannot be mapped safely
- knockout arrays contain invalid values
- duplicate or obviously contradictory tournament state is detected

Validation should confirm both structure and basic logical consistency, for example:

- each group has a boolean `finalized`
- each group standings list is an array
- knockout fields are arrays or null-compatible values as expected
- `champion` cannot be set unless `finalTeams` is populated

If validation fails, the script exits non-zero and leaves the existing file untouched.

## Failure Handling

Failure behavior is intentionally conservative.

- On any fetch, mapping, or validation failure, keep the last good `data/actual-results.json`.
- Do not publish partially normalized data.
- Fail the workflow step so the issue is visible in GitHub Actions logs.

This gives the repo two useful guarantees:

- successful syncs update the site
- unsuccessful syncs do not regress the site to broken or empty tournament state

## Workflow Changes

Both workflows will gain the sync step before tracker generation.

### Refresh Workflow

In `.github/workflows/refresh-data.yml`:

1. expose `API_FOOTBALL_KEY` from repository secrets
2. run `python scripts/sync_actual_results.py`
3. only then run `scripts/generate_tracker_data.py`
4. keep the existing publish, commit, and push logic

### Deploy Workflow

In `.github/workflows/deploy-pages.yml`:

1. expose `API_FOOTBALL_KEY` from repository secrets
2. run `python scripts/sync_actual_results.py`
3. then run generation, publish, tests, and build

This keeps manual deploys and scheduled refreshes aligned around the same normalized source.

## Secrets and Configuration

Required secret:

- `API_FOOTBALL_KEY`

Configuration should remain minimal and code-local:

- provider base URL can be a constant in the sync script
- tournament identifier values like league and season can be constants in code, with CLI overrides reserved for local debugging only

The default implementation should target:

- league `1`
- season `2026`

## Testing Strategy

The implementation should include automated coverage for the normalization boundary.

Recommended tests:

- valid provider standings normalize into expected group output
- valid provider fixtures normalize into expected knockout output
- invalid provider payload fails validation
- sync write path preserves the previous file on failure
- team-name remapping works for known provider-name differences

Tests should avoid real network calls by using fixture payloads.

## Operational Notes

- The sync script should log concise status information such as which provider endpoints were fetched and whether the results file was updated.
- The workflow should continue committing generated data changes only when tracked output actually changes.
- Rate limits are not expected to be a practical problem because the project refresh pattern is low-volume and match-end triggered rather than continuous polling.

## Risks

Primary risks:

- provider naming may not exactly match bracket prediction team names
- provider round/stage labels may require careful mapping for a 48-team World Cup format
- provider payload shape may evolve over time

Mitigations:

- centralize provider-to-local name translation
- isolate round mapping logic in one module section
- validate the fully normalized structure before replacement
- keep the provider integration in one script so future fixes stay localized

## Verification

This design is complete when the following are true:

- `scripts/sync_actual_results.py` can fetch and normalize World Cup 2026 data from API-Football
- failed syncs leave the previous `data/actual-results.json` untouched
- refresh and deploy workflows both invoke the sync step before generation
- existing scoring tests still pass
- a generated leaderboard reflects real tournament progress after a successful sync

## Future Extensions

Possible later improvements:

- save raw provider snapshots for debugging
- add a second provider fallback
- add a small schema checker for provider fixtures at ingest time
- add notification hooks when sync fails repeatedly

None of these are required for the initial implementation.
