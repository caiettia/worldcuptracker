# Static Site Layer Design

Date: 2026-06-24

## Overview

This document defines the first static frontend layer for the World Cup tracker project. The site will be a small Vite + React + TypeScript application that reads generated leaderboard data from static JSON files at runtime. The primary goal of v1 is to present a clean, fast, friend-group leaderboard that is significantly easier to scan than FIFA's bracket challenge experience.

The visual direction will follow the connected Stitch project `World Cup Bracket Tracker`, including its pitch-green and stadium-gold palette, editorial sports layout, strong Montserrat headline treatment, lighter daytime surfaces, and restrained motion.

## Goals

- Build a static site that can be deployed as plain frontend assets.
- Fetch leaderboard data from static JSON at runtime rather than bundling it at build time.
- Deliver a focused homepage that emphasizes rankings, score totals, and tournament status.
- Keep the frontend narrow and maintainable so later drilldowns can be added without rewiring the app.

## Non-Goals

- No per-user detail page or row click behavior in v1.
- No live polling from the browser.
- No backend runtime or authenticated user flows.
- No bracket visualization in v1.
- No client-side routing beyond a single homepage.

## Existing Inputs

The backend-style data generation flow already exists in the repository:

- `data/brackets.json` stores parsed user predictions.
- `data/actual-results.json` stores current real tournament outcomes.
- `data/scoring-system.json` stores the official FIFA scoring model.
- `scripts/generate_tracker_data.py` generates frontend-ready JSON.
- `data/generated/leaderboard.json` is the primary runtime payload for v1.
- `data/generated/entry-progress.json` is generated but not used in v1.

## Architecture

The application will use a simple one-way pipeline:

1. Prediction and results data are maintained in the repo.
2. The Python scorer generates frontend-facing JSON files.
3. A lightweight publish step copies generated files into the frontend public directory.
4. The React app fetches `/data/leaderboard.json` at runtime.
5. Presentational components render loading, error, or loaded states.

This separation keeps data generation independent from UI rendering. It also creates a straightforward automation path later: when match outcomes update, regenerate JSON, copy it into the static app, and redeploy.

## Frontend Structure

The frontend will live under `app/` as a standalone Vite project.

Planned structure:

- `app/public/data/leaderboard.json`
- `app/src/main.tsx`
- `app/src/App.tsx`
- `app/src/types/leaderboard.ts`
- `app/src/lib/loadLeaderboard.ts`
- `app/src/components/HeroHeader.tsx`
- `app/src/components/StatusBanner.tsx`
- `app/src/components/Podium.tsx`
- `app/src/components/LeaderboardTable.tsx`
- `app/src/components/LoadState.tsx`
- `app/src/styles/` or a small set of colocated CSS files

The app should stay intentionally small. Each component has one clear job, with the fetch and data-shape handling isolated from the rendering components.

## Data Flow

The v1 frontend depends only on `leaderboard.json`.

Expected runtime flow:

1. `App.tsx` calls `loadLeaderboard()` on initial mount.
2. `loadLeaderboard()` fetches `/data/leaderboard.json`.
3. The loader performs light runtime validation of the expected structure.
4. If the fetch succeeds, `App.tsx` renders the page with typed data.
5. If the fetch fails or the shape is invalid, the app renders a deliberate error state.

The app should not fetch repeatedly or attempt background refreshes in v1. Data freshness is handled by the offline generation and deployment process.

## V1 Page Composition

The homepage will contain four main sections:

### Hero Header

The top of the page establishes identity and tone:

- site title
- concise subtitle describing the tracker
- editorial sports presentation aligned to the Stitch design

### Status Banner

This section communicates current data status immediately:

- `as of` timestamp if available
- entrant count
- tournament progress summary derived from the `progress` object

### Podium

The top three entrants will be visually elevated so the leaders are obvious without reading the full table. This section is summary-only and non-interactive in v1.

### Leaderboard Table

The main table will include:

- rank
- entrant name
- total points
- group-stage points
- knockout points

The table will use the ordering already supplied by `leaderboard.json`. No in-browser sorting controls are required in v1.

## Responsive Behavior

The homepage must work well on desktop and mobile.

- Desktop will use a full-width leaderboard table and a more spacious header and podium layout.
- Mobile will collapse the table into stacked row cards or an equivalent narrow layout treatment while preserving rank, name, and scores.
- The design should avoid horizontal overflow and should prioritize fast scanning over strict table fidelity on small screens.

## Visual Direction

The UI should inherit the Stitch project's character rather than defaulting to a generic SaaS dashboard.

Design principles:

- daylight surfaces rather than dark-mode bias
- deep pitch-green framing and structure
- stadium-gold emphasis for winners and highlighted placements
- Montserrat for headlines and strong ranking moments
- Inter for body copy and table UI
- rounded card surfaces and layered tonal backgrounds
- subtle reveal motion rather than noisy interaction effects

The interface should feel energetic and sporty while remaining cleaner and calmer than FIFA's original experience.

## Styling Approach

The app will use native React + CSS rather than a UI framework.

Recommended approach:

- CSS variables for primary design tokens
- a small global stylesheet for reset, typography, and shared tokens
- component-level CSS files or a compact styles directory for layout and section styling

This keeps the project lightweight and easy to host, while still giving enough control to match the Stitch reference design closely.

## Error Handling

The frontend must handle failure states intentionally:

- If `/data/leaderboard.json` is missing, show a friendly error message rather than a blank screen.
- If the JSON shape is malformed, show a structured load error.
- If the data exists but has zero progress or zero scores, the app should still render normally and explain the tournament state through the status banner.

## Publish Workflow

The site will need a lightweight data publish step:

1. Run `scripts/generate_tracker_data.py`.
2. Copy `data/generated/leaderboard.json` into `app/public/data/leaderboard.json`.
3. Build or deploy the Vite site.

This can begin as a manual script and later become part of a scheduled update flow once match-result ingestion is automated.

## Verification

The static site layer is considered complete for v1 when all of the following are true:

- the Vite app boots locally
- `/data/leaderboard.json` is fetched successfully from the public directory
- loading, error, and loaded states all render cleanly
- desktop and mobile layouts are usable and visually coherent
- the page visually tracks the Stitch project direction
- the app remains single-page and non-interactive beyond display state

## Future Extensions

This design deliberately leaves room for later additions:

- per-user drilldown pages or modals
- bracket progression visualizations
- richer tournament summaries
- automated post-match data refresh
- optional row interactions and filtering

Those features should build on this structure rather than replacing it.
