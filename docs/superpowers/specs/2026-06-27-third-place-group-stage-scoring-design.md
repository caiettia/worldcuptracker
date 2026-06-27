# Third-Place Group Stage Scoring Design

- Date: 2026-06-27
- Status: Approved for planning
- Scope: Backend scoring pipeline, generated tracker JSON, and frontend consumption of generated score breakdowns

## Summary

The tracker already has the data needed to score FIFA World Cup 2026 third-place qualifier picks:

- entrant predictions in `data/brackets.json`
- actual advancing third-place teams in `data/actual-results.json`
- generated leaderboard and entry-progress payloads consumed by the app

The missing piece is the scoring pipeline. We will extend backend scoring so correct third-place qualifier picks award points, those points roll into group-stage totals, and the generated `entry-progress.json` includes a dedicated third-place breakdown for the frontend to render.

## Product Decision

Third-place qualifier picks are treated as a first-class group-stage scoring category in this repo.

Behavior:

- each entrant selects 8 advancing third-place teams
- the scorer compares those 8 predicted teams with the 8 actual advancing third-place teams
- each correct pick awards a configurable number of points
- those points are added into `groupStagePoints`
- third-place scoring is exposed as a distinct breakdown inside `entry-progress.json`

This matches the intended tracker behavior approved during brainstorming: third-place points count as group-stage points, not knockout points.

## FIFA Rule Notes

Verified on 2026-06-27 against current FIFA Bracket Challenge assets:

- official help and translations clearly require users to select 8 of 12 third-placed teams
- the live app stores those picks separately as `thirdPlaceQualifierPredictions`
- the live app uses those picks to resolve Round of 32 bracket participants
- the public group score modal still only labels positions 1-4 and a bonus row

Because FIFA's public UI does not clearly publish a separate visible third-place score row, this repo will keep the numeric award configurable in `data/scoring-system.json` instead of hardcoding it in Python. That keeps the implementation faithful to the configured tournament rules and makes future verification or adjustment low-risk.

## Required Data Contracts

### Input predictions

Entrant data remains in `data/brackets.json`:

- `entries[].groupStage.groups`
- `entries[].groupStage.selectedBestThirdPlacedTeams`

`bestThirdCandidates` remains input/supporting data and is not the scoring source of truth. The scoring source of truth is `selectedBestThirdPlacedTeams`.

### Input actual results

Actual results remain in `data/actual-results.json`:

- `groupStage.groups`
- `groupStage.bestThirdPlacedTeams`

`bestThirdPlacedTeams` is used for non-projected totals only after all 12 groups are finalized. Before that point it may still be used for projected totals.

### Scoring configuration

Add a new numeric group-stage rule in `data/scoring-system.json`:

- `groupStage.correctThirdPlaceQualifierPerTeam`

Field name decision:

- `correctThirdPlaceQualifierPerTeam`

This keeps naming aligned with the existing `correctPositionPerTeam` rule.

## Backend Scoring Changes

### Group-stage scorer

Extend `worldcup_tracker/scoring.py` so group-stage scoring has two subparts:

1. ordered group standings scoring
2. third-place qualifier scoring

Recommended internal shape:

- keep the existing per-group standings logic
- add a helper that scores `selectedBestThirdPlacedTeams` against `bestThirdPlacedTeams`
- merge both results into one returned group-stage breakdown

### Third-place scoring rules

Rules:

- compare by normalized team identity, using the existing alias normalization path
- score by set intersection, not by order
- award `correctThirdPlaceQualifierPerTeam` for each correctly predicted advancing third-place team
- no bonus for a perfect 8 of 8 unless FIFA later publishes such a rule and the config/schema is intentionally expanded

### Final vs projected totals

Non-projected totals:

- include third-place qualifier points only when all 12 groups are finalized

Projected totals:

- include third-place qualifier points whenever `actual-results.json` currently contains a `bestThirdPlacedTeams` list
- continue to use `include_pending=True` behavior for standings projections

If a future results payload adds an explicit finalized flag for third-place qualifiers, that flag can replace the "all 12 groups finalized" gate without changing the public tracker output shape.

## Output Shape

### Leaderboard

Keep `leaderboard.json` structurally stable.

No new top-level leaderboard columns are required. Existing fields continue to be the contract:

- `totalPoints`
- `groupStagePoints`
- `knockoutPoints`

The only behavioral change is that `groupStagePoints` now includes:

- correct position points
- perfect group bonuses
- correct third-place qualifier points

### Entry progress

Extend `entry-progress.json` so each entry contains an explicit third-place group-stage breakdown alongside the existing group-stage data.

Required additions inside `entries[].groupStage`:

```json
{
  "thirdPlaceQualifiers": {
    "predictedTeams": ["..."],
    "actualTeams": ["..."],
    "correctTeams": ["..."],
    "correctCount": 0,
    "points": 0,
    "scored": true
  }
}
```

Expected semantics:

- `predictedTeams`: normalized entrant picks used for scoring
- `actualTeams`: normalized actual advancing third-place teams currently used by the scorer
- `correctTeams`: normalized intersection
- `correctCount`: size of the intersection
- `points`: awarded third-place qualifier points
- `scored`: whether this category counted toward non-projected totals

The existing `groupStage.points` value remains the rolled-up total for the whole group stage.

## Frontend Consumption

Frontend score rendering must remain derived from generated JSON, not from duplicated scoring logic.

UI expectations:

- leaderboard screens continue to read `groupStagePoints`
- entry detail/progress views can render the new `groupStage.thirdPlaceQualifiers` block
- the app must not recompute third-place scores client-side

This keeps the backend as the single scoring authority.

## Testing

Add backend coverage in `tests/test_scoring.py` for:

- exact third-place hit count with partial misses
- 8 of 8 correct third-place picks
- 0 correct third-place picks
- alias normalization for third-place team names
- group-stage totals now including third-place points
- projected totals including provisional third-place outcomes
- non-projected totals excluding third-place points when actual third-place outcomes are not yet scoreable

Regression coverage must also confirm that leaderboard sorting still behaves the same after the new group-stage totals are introduced.

## Out of Scope

Not part of this change:

- changing knockout scoring
- changing the saved bracket input format
- introducing client-side score calculation
- adding new leaderboard columns for third-place points
- guessing undocumented FIFA bonus rules beyond the approved direct-per-correct-pick behavior

## Implementation Notes

- Follow existing alias normalization for team-name comparisons
- Prefer small helper functions over expanding `score_group_stage` into one large branchy block
- Preserve backward compatibility for consumers that only read `groupStagePoints`
- Keep the config-driven rule centralized in `data/scoring-system.json`

## Acceptance Criteria

- the scorer awards points for correct advancing third-place picks
- those points are included in `groupStagePoints`
- leaderboard totals change only through backend-generated JSON
- `entry-progress.json` exposes a dedicated third-place breakdown per entrant
- automated tests cover final, partial, projected, and alias-matching cases
