# World Cup Tracker

This repo turns a small World Cup prediction pool into a repeatable tracker instead of a manual spreadsheet exercise.

## What was done here

- Built Python scoring logic to compare each entrant's bracket against actual tournament results.
- Added sync code to refresh group-stage standings from FIFA data and store them in `data/actual-results.json`.
- Added scripts to generate leaderboard and per-entry progress JSON, then copy that data into the frontend.
- Built a small React/Vite app that shows the live leaderboard, group picks, and bracket progress.
- Kept bracket source images and generated JSON in the repo so the tracker can be rebuilt from a known snapshot.
- Added tests around the scoring and results-sync behavior.

## Why

The point of this project is to make the pool easy to update and easy to trust:

- scoring is consistent instead of hand-calculated
- standings updates can be refreshed from a real source
- the frontend stays static and simple because it reads prebuilt JSON
- every result snapshot and bracket entry stays inspectable in version control

## Repo shape

- `worldcup_tracker/`: scoring and sync logic
- `scripts/`: CLI entry points for syncing results, generating tracker data, and publishing frontend data
- `data/`: bracket picks, scoring rules, actual results, and generated outputs
- `app/`: React app for viewing the tracker
- `tests/`: Python test coverage for the core backend behavior
