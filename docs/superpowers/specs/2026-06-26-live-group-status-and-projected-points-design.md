# Live Group Status And Projected Points Design

Date: 2026-06-26

## Overview

This document defines a combined scoring and UI enhancement for the World Cup tracker. The leaderboard will show each entrant's official total plus a projection derived from the current standings in groups that are not yet finalized. The entrant group-stage comparison view will also expose a clear finalized or pending status per group, and the top navigation plus entrant interaction styling will better reflect the available views and click targets.

## Goals

- Show official leaderboard totals together with a projected total and additive upside from groups still in progress.
- Base projected totals on the current standings snapshot for non-finalized groups while preserving finalized scoring as the official total.
- Show `Finalized` or `Pending` status on each group card in the group-stage comparison view.
- Add `Group Stage` to the top navigation.
- Make entrant-selection affordances feel more link-like and interactive, including row-level hover emphasis on desktop.

## Non-Goals

- No changes to knockout scoring or knockout projection logic.
- No changes to the source bracket input format.
- No browser-side duplication of scoring logic.
- No redesign of the overall leaderboard layout beyond the new score display and interaction polish.

## Chosen Approach

Projected score math will stay in `worldcup_tracker/scoring.py`, where official scoring already lives. The generator will emit additional leaderboard fields so the frontend stays presentational and consistent with the backend's scoring rules.

The frontend will render:

- official total
- projected total
- projected additional points

in a compact format such as `120 (160, +40)`.

## Scoring Model

### Official Score

Official score behavior stays unchanged:

- finalized groups count toward official group-stage points
- non-finalized groups do not count toward official group-stage points
- knockout points are scored only from currently known knockout outcomes

### Projected Group-Stage Score

Projected group-stage scoring will treat each non-finalized group's current standings as if they were final.

Rules:

- finalized groups continue to use their current official scored result
- non-finalized groups are scored against their current standings order
- perfect-group bonus still applies if a user's prediction exactly matches the current standings order
- knockout points remain the same as the official score

Derived values:

- `projectedTotalPoints = projectedGroupStagePoints + knockoutPoints`
- `projectedAdditionalPoints = projectedTotalPoints - totalPoints`

## Data Contract Changes

Each leaderboard row will gain:

- `projectedTotalPoints`
- `projectedAdditionalPoints`

These fields belong in the generated leaderboard payload because they are leaderboard-facing aggregates, not per-group drilldown data.

## Group Card Status

Each group card in the entrant detail view already has access to `actualResults.groupStage.groups[groupKey].finalized`.

The score area will show:

- `Group Points: X`
- `Finalized` when the group's `finalized` flag is true
- `Pending` when the flag is false

This status should sit directly below the group points line and above any perfect-group bonus chip if present.

## Navigation

The top nav will explicitly represent three views:

- `Leaderboard`
- `Group Stage`
- `Bracket`

When the user is on an entrant detail view, `Group Stage` should be the active nav item. When the user clicks `Group Stage` from another view and no current entrant is selected, the app should open the first available entrant detail view.

## Interaction Styling

Entrant-selection affordances should look intentionally clickable:

- leaderboard entrant names should read as links/buttons rather than plain text
- hovering the entrant name on desktop should visually reinforce the entire leaderboard row
- podium and bracket-selection controls should receive matching hover polish where feasible within the existing component structure

The goal is stronger interaction clarity, not a structural control rewrite.

## Testing

The change should add or update tests that cover:

- projected leaderboard fields in Python scoring output
- official totals remaining unchanged for non-finalized groups
- projected totals using current standings for non-finalized groups
- frontend rendering of `Finalized` and `Pending`
- frontend rendering of the new leaderboard score format
- nav showing and activating `Group Stage`

## Verification

The feature is complete when:

- leaderboard rows display `total (projected, +additional)`
- projected values come from backend-generated data
- group cards show `Finalized` or `Pending` correctly
- nav includes `Group Stage`
- entrant interaction styling clearly signals clickability
- Python tests, frontend tests, and the frontend build all pass
