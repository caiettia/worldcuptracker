# Live Group Status And Projected Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-generated projected leaderboard totals for in-progress groups, show finalized or pending group status in the detail view, expose `Group Stage` in nav, and polish entrant-selection interactions.

**Architecture:** Keep official score calculation unchanged for finalized-only leaderboard totals, but add a second group-stage scoring path that treats pending groups' current standings as final for projection purposes. Emit projection fields in the generated leaderboard payload, validate them in the app loader, and keep the frontend render-only for totals, group status, and nav state.

**Tech Stack:** Python 3, unittest, React 18, TypeScript, Vitest, Testing Library, Vite

---

## File Structure

- Modify: `worldcup_tracker/scoring.py`
- Modify: `tests/test_scoring.py`
- Modify: `app/src/types/leaderboard.ts`
- Modify: `app/src/lib/loadAppData.ts`
- Modify: `app/src/components/TopNav.tsx`
- Modify: `app/src/components/LeaderboardTable.tsx`
- Modify: `app/src/components/EntryDetailView.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/App.test.tsx`
- Modify: `app/src/styles/app.css`
- Modify: `app/src/styles/components.css`

### Task 1: Add failing backend tests for projected totals

**Files:**
- Modify: `tests/test_scoring.py`
- Modify: `worldcup_tracker/scoring.py`

- [ ] **Step 1: Write the failing projected-score test**

```python
def test_projected_group_points_include_pending_groups(self) -> None:
    brackets_doc = {
        "entries": [
            {
                "id": "alpha",
                "displayName": "Alpha",
                "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"], "B": ["B1", "B2", "B3", "B4"]}},
                "knockout": {
                    "roundOf32Winners": [],
                    "roundOf16Winners": [],
                    "quarterfinalWinners": [],
                    "semifinalWinners": [],
                    "champion": None,
                },
            }
        ]
    }
    actual_results = {
        "metadata": {"asOf": None},
        "groupStage": {
            "groups": {
                "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                "B": {"finalized": False, "standings": ["B1", "B2", "B4", "B3"]},
            }
        },
        "knockout": {
            "roundOf16Teams": [],
            "quarterfinalTeams": [],
            "semifinalTeams": [],
            "finalTeams": [],
            "champion": None,
        },
    }

    outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)
    row = outputs["leaderboard"]["leaderboard"][0]

    self.assertEqual(row["totalPoints"], 230)
    self.assertEqual(row["projectedTotalPoints"], 380)
    self.assertEqual(row["projectedAdditionalPoints"], 150)
```

- [ ] **Step 2: Run the scoring tests to verify they fail**

Run: `python -m unittest tests.test_scoring`

Expected: FAIL because the generated leaderboard rows do not yet include projection fields.

- [ ] **Step 3: Implement the minimal projected scoring path in `worldcup_tracker/scoring.py`**

```python
def score_group_stage(
    predicted_groups: dict[str, list[str]],
    actual_group_stage: dict[str, Any],
    scoring_rules: dict[str, Any],
    include_pending: bool = False,
) -> dict[str, Any]:
```

Use `include_pending` to score non-finalized groups against current standings for projection, while preserving the existing finalized-only behavior for official totals.

- [ ] **Step 4: Re-run the scoring tests to verify they pass**

Run: `python -m unittest tests.test_scoring`

Expected: PASS

### Task 2: Add failing frontend tests for score display, group status, and nav

**Files:**
- Modify: `app/src/App.test.tsx`
- Modify: `app/src/types/leaderboard.ts`
- Modify: `app/src/lib/loadAppData.ts`

- [ ] **Step 1: Extend the mocked leaderboard rows with projection fields**

```ts
{
  rank: 1,
  id: "dinkelberg",
  displayName: "Dinkelberg",
  totalPoints: 120,
  projectedTotalPoints: 160,
  projectedAdditionalPoints: 40,
  groupStagePoints: 90,
  knockoutPoints: 30,
}
```

- [ ] **Step 2: Write failing UI assertions**

```tsx
expect(screen.getByText("120 (160, +40)")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /group stage/i })).toBeInTheDocument();
expect(screen.getByText("Finalized")).toBeInTheDocument();
expect(screen.getByText("Pending")).toBeInTheDocument();
```

Make one group finalized and one group pending in the fixture.

- [ ] **Step 3: Run the focused app test to verify it fails**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: FAIL because the types, nav, and UI do not yet support the new fields and statuses.

- [ ] **Step 4: Update the app payload types and runtime validation**

Add the projection fields to `LeaderboardRow` and require them in `isLeaderboardRow`.

- [ ] **Step 5: Re-run the focused app test to verify it still fails only on rendering behavior**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: FAIL on missing rendered text, not on payload validation.

### Task 3: Render the new UI states and interaction styling

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/TopNav.tsx`
- Modify: `app/src/components/LeaderboardTable.tsx`
- Modify: `app/src/components/EntryDetailView.tsx`
- Modify: `app/src/styles/app.css`
- Modify: `app/src/styles/components.css`

- [ ] **Step 1: Add `Group Stage` nav support**

Treat the entrant detail view as a distinct nav state and route `Group Stage` clicks to the current entry or the first available entry.

- [ ] **Step 2: Render projected totals in the leaderboard**

```tsx
<span className={`score-text ${row.id === CURRENT_USER_ID ? "score-text--you" : ""}`}>
  {`${row.totalPoints.toLocaleString()} (${row.projectedTotalPoints.toLocaleString()}, +${row.projectedAdditionalPoints.toLocaleString()})`}
</span>
```

- [ ] **Step 3: Render group finalized or pending status in the detail view**

```tsx
<span className={`group-card__status ${actualGroup?.finalized ? "group-card__status--finalized" : "group-card__status--pending"}`}>
  {actualGroup?.finalized ? "Finalized" : "Pending"}
</span>
```

- [ ] **Step 4: Add hyperlink-style affordances and row emphasis**

Make entrant-name buttons look more like links, and on desktop tie hover and focus behavior to the full leaderboard row. Also add hover polish to selection controls such as the bracket picker.

- [ ] **Step 5: Run the focused app test to verify it passes**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: PASS

### Task 4: Full verification and data refresh

**Files:**
- Modify: `data/generated/leaderboard.json`
- Modify: `app/public/data/leaderboard.json`

- [ ] **Step 1: Run the full Python test suite**

Run: `python -m unittest`

Expected: PASS

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm.cmd test -- --run`

Expected: PASS

- [ ] **Step 3: Regenerate the leaderboard payload**

Run: `python scripts/generate_tracker_data.py`

Expected: leaderboard output now includes `projectedTotalPoints` and `projectedAdditionalPoints`

- [ ] **Step 4: Publish generated data into the app public directory if needed by the existing workflow**

Run the existing publish step or update the static leaderboard JSON so runtime data matches the new contract.

- [ ] **Step 5: Build the frontend**

Run: `npm.cmd run build`

Expected: PASS

## Self-Review

- Spec coverage: projected points, pending/finalized group status, `Group Stage` nav, and interaction styling are all covered.
- Placeholder scan: tasks include concrete files, explicit verification commands, and representative code for each change area.
- Type consistency: `projectedTotalPoints` and `projectedAdditionalPoints` are defined first in backend output and then consumed consistently in frontend types and rendering.
