# Bracket Comparison Flag Avatars Design

Date: 2026-06-26

## Overview

This document defines a focused UI enhancement for the entrant bracket comparison view. The group-stage standings comparison will show a circular flag avatar next to each country name, matching the profile-picture-like treatment already used on the homepage leaderboard.

The implementation will use locally vendored SVG assets sourced from `lipis/flag-icons`, stored in the app's public directory, with a small normalization layer that maps the tracker project's current country display names to ISO alpha-2 country codes.

## Goals

- Add a flag image next to each country in the entrant group comparison view.
- Match the circular avatar feel of the leaderboard rather than rendering raw rectangular flags.
- Keep the feature self-contained and static-site friendly with no runtime dependency on external CDNs.
- Handle known naming inconsistencies in existing data without changing the stored bracket payloads.

## Non-Goals

- No redesign of the leaderboard itself.
- No remote asset loading from GitHub or a CDN.
- No change to the scoring pipeline or the JSON contracts in `data/actual-results.json` and `data/brackets.json`.
- No attempt to normalize all historical country strings at the data-generation layer in this change.

## Existing Context

The current comparison UI lives in `app/src/components/EntryDetailView.tsx`. It renders ordered country names for:

- actual group standings from `actualResults.groupStage.groups`
- entrant predictions from `bracketEntry.groupStage.groups`

The current list items are plain text. The leaderboard visual language in `app/src/styles/components.css` already includes rounded avatar treatments that establish the site's intended profile-chip style.

The current data also includes country-name variants such as:

- `Bosnia and Herzegovina` vs `Bosnia-Herzegovina`
- `USA`
- `IR Iran`
- `Korea Republic`
- `Cote d'Ivoire`

That means the UI needs a lookup layer between the stored country name and the local SVG asset path.

## Chosen Approach

The app will vendor a curated subset of SVG flags from `lipis/flag-icons` into a local public folder such as `app/public/flags/`.

The React app will introduce a small helper that:

1. Accepts the current country display name.
2. Normalizes known aliases to the matching ISO alpha-2 code.
3. Returns a local SVG path for the circular avatar image.
4. Falls back gracefully when a name is unknown.

This keeps the UI fully local, avoids shipping the entire `flag-icons` package surface, and gives direct control over the avatar styling.

## Asset Strategy

Only the countries used by the current tracker data need to be copied into the repo for this change.

Recommended source shape from `flag-icons`:

- use the 1:1 SVG set where available for the most natural circular avatar crop
- store files under a predictable public path keyed by ISO code

Example target shape:

- `app/public/flags/mx.svg`
- `app/public/flags/us.svg`
- `app/public/flags/ir.svg`

The file set should include every country currently referenced by both actual standings and entrant predictions so the comparison view remains consistent across all rows.

## UI Structure

Each rendered team row in the standings list will become a compact media row:

- circular flag avatar
- country name text

The list should preserve the existing ordered list semantics and scoring layout. This is a presentation upgrade, not a structural rework of the group cards.

## Styling Direction

The avatar should visually echo the leaderboard's "profile picture" treatment:

- small circular frame
- subtle border or surface ring so white-dominant flags remain visible
- image centered and clipped inside the circle
- spacing tuned for easy scanning in the group card lists

The row should stay lightweight enough that four standings entries fit cleanly on both desktop and mobile.

## Country Normalization

A small frontend-only mapping layer should translate tracker names to ISO codes.

The mapping should cover at least the names currently present in repository data, including aliases such as:

- `USA` -> `us`
- `IR Iran` -> `ir`
- `Korea Republic` -> `kr`
- `Bosnia-Herzegovina` and `Bosnia and Herzegovina` -> `ba`
- `Cote d'Ivoire` -> `ci`
- `Turkiye` -> `tr`
- `Congo DR` -> `cd`
- `Cabo Verde` -> `cv`

This logic should live in a dedicated helper so the rendering component stays simple and future aliases can be added in one place.

## Fallback Behavior

If a country name does not resolve:

- render the text label normally
- omit the image rather than showing a broken asset

This ensures the view remains usable even if a new country string appears later.

## Testing

The change should add a focused UI test that confirms:

- the entrant detail view still renders successfully
- known country rows include a flag image
- at least one alias-based country name resolves to the expected local asset path

The tests do not need to validate every country. They should prove the rendering contract and the normalization path.

## Verification

The feature is complete when all of the following are true:

- the entrant group comparison renders circular flag avatars beside countries
- the visuals remain readable on desktop and mobile
- known country aliases resolve to the intended local SVG
- unresolved names degrade gracefully without broken images
- the app test suite passes with the new rendering behavior

## Risks And Mitigations

### Naming drift

Risk: new or differently formatted country strings may not resolve.

Mitigation: keep normalization isolated in one helper and fail gracefully to text-only rendering.

### White or low-contrast flags disappearing

Risk: some flags visually blend into the card background.

Mitigation: use a subtle circular border or background ring around the avatar.

### Asset sprawl

Risk: copying the full upstream library adds unnecessary bulk.

Mitigation: vendor only the SVGs required by current tracker data for this change.
