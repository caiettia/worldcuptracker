# Third-Place Group Stage Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend scoring for third-place qualifier picks, roll those points into group-stage totals, expose the breakdown in generated entry progress data, and render that backend-authored breakdown in the app.

**Architecture:** Keep scoring authoritative in `worldcup_tracker/scoring.py`, extend the group-stage breakdown instead of introducing a parallel score object, and keep the frontend render-only by validating and displaying the new generated payload fields. Use TDD for both Python and frontend changes so the new behavior is locked before implementation.

**Tech Stack:** Python 3, unittest, React 18, TypeScript, Vitest, Testing Library, Vite

---

## File Structure

- Modify: `data/scoring-system.json`
- Modify: `worldcup_tracker/scoring.py`
- Modify: `tests/test_scoring.py`
- Modify: `app/src/types/leaderboard.ts`
- Modify: `app/src/lib/loadAppData.ts`
- Modify: `app/src/lib/scoring.ts`
- Modify: `app/src/views/GroupsView.tsx`
- Modify: `app/src/App.test.tsx`
- Modify: `app/dist/data/entry-progress.json`
- Modify: `app/dist/data/leaderboard.json`

### Task 1: Lock the backend contract with failing tests

**Files:**
- Modify: `tests/test_scoring.py`
- Modify: `worldcup_tracker/scoring.py`

- [ ] **Step 1: Write the failing third-place scoring tests**

```python
def test_group_stage_scoring_includes_third_place_qualifiers(self) -> None:
    entry = {
        "id": "alpha",
        "displayName": "Alpha",
        "groupStage": {
            "groups": {"A": ["A1", "A2", "A3", "A4"]},
            "selectedBestThirdPlacedTeams": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"],
        },
        "knockout": {
            "roundOf32Winners": [],
            "roundOf16Winners": [],
            "quarterfinalWinners": [],
            "semifinalWinners": [],
            "champion": None,
        },
    }
    actual_results = {
        "groupStage": {
            "groups": {"A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]}},
            "bestThirdPlacedTeams": ["T1", "T3", "T5", "T7", "U1", "U2", "U3", "U4"],
        },
        "knockout": {},
    }

    scored = score_entry(entry, actual_results, SCORING_RULES)

    self.assertEqual(scored["groupStage"]["thirdPlaceQualifiers"]["correctTeams"], ["T1", "T3", "T5", "T7"])
    self.assertEqual(scored["groupStage"]["thirdPlaceQualifiers"]["correctCount"], 4)
    self.assertEqual(scored["points"]["groupStage"], 230 + (4 * 15))

def test_third_place_points_only_count_in_official_totals_after_all_groups_finalize(self) -> None:
    outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)

    row = outputs["leaderboard"]["leaderboard"][0]
    entry = outputs["entryProgress"]["entries"][0]

    self.assertEqual(row["groupStagePoints"], 230)
    self.assertEqual(entry["groupStage"]["thirdPlaceQualifiers"]["scored"], False)
    self.assertGreater(row["projectedTotalPoints"], row["totalPoints"])
```

- [ ] **Step 2: Extend the shared test scoring fixture**

```python
SCORING_RULES = {
    "groupStage": {
        "correctPositionPerTeam": 50,
        "perfectGroupBonus": 30,
        "correctThirdPlaceQualifierPerTeam": 15,
    },
    "knockout": {
        "roundOf16": 20,
        "quarterfinal": 30,
        "semifinal": 40,
        "final": 75,
        "champion": 100,
    },
}
```

- [ ] **Step 3: Run the backend tests to verify they fail for the expected reason**

Run: `python -m unittest tests.test_scoring -v`

Expected: FAIL because `score_entry()` does not yet read `selectedBestThirdPlacedTeams`, does not emit `thirdPlaceQualifiers`, and does not add those points into `groupStagePoints`.

- [ ] **Step 4: Add alias coverage for third-place picks**

```python
def test_third_place_aliases_are_normalized(self) -> None:
    entry = {
        "id": "liz",
        "displayName": "Liz",
        "groupStage": {
            "groups": {},
            "selectedBestThirdPlacedTeams": ["Bosnia-Herzegovina"],
        },
        "knockout": {
            "roundOf32Winners": [],
            "roundOf16Winners": [],
            "quarterfinalWinners": [],
            "semifinalWinners": [],
            "champion": None,
        },
    }
```

- [ ] **Step 5: Re-run the targeted backend tests and keep them red**

Run: `python -m unittest tests.test_scoring -v`

Expected: FAIL on missing behavior, not syntax errors.

### Task 2: Implement backend third-place scoring and output shape

**Files:**
- Modify: `data/scoring-system.json`
- Modify: `worldcup_tracker/scoring.py`

- [ ] **Step 1: Add the new scoring rule to the static scoring config**

```json
"groupStage": {
  "correctPositionPerTeam": 50,
  "perfectGroupBonus": 30,
  "correctThirdPlaceQualifierPerTeam": 15
}
```

- [ ] **Step 2: Add a focused helper for third-place qualifier scoring**

```python
def score_third_place_qualifiers(
    predicted_teams: list[str],
    actual_group_stage: dict[str, Any],
    scoring_rules: dict[str, Any],
    *,
    scored: bool,
) -> dict[str, Any]:
    actual_teams = [
        normalize_team_name(team)
        for team in actual_group_stage.get("bestThirdPlacedTeams", [])
    ]
    normalized_predicted = [normalize_team_name(team) for team in predicted_teams]
    actual_set = {team for team in actual_teams if team}
    predicted_set = {team for team in normalized_predicted if team}
    correct_teams = sorted(predicted_set & actual_set)
    points_per_team = scoring_rules["groupStage"]["correctThirdPlaceQualifierPerTeam"]
    points = len(correct_teams) * points_per_team if scored else 0
    return {
        "predictedTeams": normalized_predicted,
        "actualTeams": actual_teams,
        "correctTeams": correct_teams,
        "correctCount": len(correct_teams),
        "points": points,
        "scored": scored,
    }
```

- [ ] **Step 3: Fold the helper into `score_group_stage()`**

```python
third_place_breakdown = score_third_place_qualifiers(
    predicted_third_place_teams,
    actual_group_stage,
    scoring_rules,
    scored=include_pending or all(
        group.get("finalized") for group in actual_groups.values()
    ),
)

group_points += third_place_breakdown["points"]
```

Also update the return shape:

```python
return {
    "points": group_points,
    "correctPositions": correct_positions,
    "perfectGroups": perfect_groups,
    "finalizedGroupsScored": finalized_groups,
    "correctPositionsByGroup": correct_positions_by_group,
    "pointsByGroup": points_by_group,
    "thirdPlaceQualifiers": third_place_breakdown,
}
```

- [ ] **Step 4: Pass entrant third-place picks through `score_entry()` and projected scoring**

```python
group_stage_breakdown = score_group_stage(
    entry["groupStage"]["groups"],
    actual_results["groupStage"],
    scoring_rules,
    predicted_third_place_teams=entry["groupStage"].get("selectedBestThirdPlacedTeams", []),
)
```

Apply the same argument to the projected `include_pending=True` path in `build_tracker_outputs()`.

- [ ] **Step 5: Run the backend tests to verify they pass**

Run: `python -m unittest tests.test_scoring -v`

Expected: PASS

### Task 3: Lock the frontend payload contract with failing tests

**Files:**
- Modify: `app/src/App.test.tsx`
- Modify: `app/src/types/leaderboard.ts`
- Modify: `app/src/lib/loadAppData.ts`

- [ ] **Step 1: Extend the mocked entry-progress payload with the new group-stage block**

```ts
groupStage: {
  points: 110,
  correctPositions: 1,
  perfectGroups: [],
  finalizedGroupsScored: 1,
  correctPositionsByGroup: { A: 1 },
  pointsByGroup: { A: 50 },
  thirdPlaceQualifiers: {
    predictedTeams: ["Senegal", "Sweden"],
    actualTeams: ["Senegal", "Paraguay"],
    correctTeams: ["Senegal"],
    correctCount: 1,
    points: 15,
    scored: true,
  },
},
```

- [ ] **Step 2: Write a failing app test that expects the third-place breakdown to render**

```tsx
test("player group-stage view shows third-place qualifier scoring", async () => {
  mockLoadAppData.mockResolvedValue(appData);
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getByText(/third-place qualifiers/i)).toBeInTheDocument();
  expect(screen.getByText(/1 correct/i)).toBeInTheDocument();
  expect(screen.getByText(/15 pts/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the focused frontend tests to verify they fail**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: FAIL because the app types and loader do not yet accept `thirdPlaceQualifiers`, and the groups view does not render it.

- [ ] **Step 4: Update the shared TypeScript types and validators**

```ts
export type ThirdPlaceQualifierBreakdown = {
  predictedTeams: string[];
  actualTeams: string[];
  correctTeams: string[];
  correctCount: number;
  points: number;
  scored: boolean;
};
```

Then require it inside `GroupStageBreakdown` and `isEntryProgressPayload()`.

- [ ] **Step 5: Re-run the focused frontend tests and keep them red on rendering only**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: FAIL because the UI still does not display the new data, not because payload validation rejects it.

### Task 4: Render the backend-authored third-place breakdown

**Files:**
- Modify: `app/src/lib/scoring.ts`
- Modify: `app/src/views/GroupsView.tsx`

- [ ] **Step 1: Mirror the new scoring constant in the descriptive frontend config**

```ts
groupStage: {
  correctPositionPerTeam: 50,
  perfectGroupBonus: 30,
  correctThirdPlaceQualifierPerTeam: 15,
},
```

- [ ] **Step 2: Add a compact third-place summary to the player group-stage view**

```tsx
<div style={{ background: COLORS.fieldBg, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 14 }}>
  <div style={{ ...sectionLabel, marginBottom: 8 }}>Third-place qualifiers</div>
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
    <span style={{ fontSize: 13, color: COLORS.muted }}>
      {player.groupStage.thirdPlaceQualifiers.correctCount} correct
    </span>
    {ptsPill(
      player.groupStage.thirdPlaceQualifiers.scored
        ? `${player.groupStage.thirdPlaceQualifiers.points} pts`
        : "Pending"
    )}
  </div>
</div>
```

- [ ] **Step 3: Render predicted, actual, and correct team chips from the generated data**

```tsx
{player.groupStage.thirdPlaceQualifiers.correctTeams.map((team) => (
  <span key={team}>{team}</span>
))}
```

Keep the wording driven by the backend state:

- show `Pending` when `scored` is `false`
- show actual/correct teams even when provisional projected data exists

- [ ] **Step 4: Run the focused frontend tests to verify they pass**

Run: `npm.cmd test -- --run src/App.test.tsx`

Expected: PASS

### Task 5: Full verification and generated data refresh

**Files:**
- Modify: `app/dist/data/entry-progress.json`
- Modify: `app/dist/data/leaderboard.json`

- [ ] **Step 1: Run the full Python test suite**

Run: `python -m unittest`

Expected: PASS

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm.cmd test -- --run`

Expected: PASS

- [ ] **Step 3: Regenerate tracker JSON with the updated scoring pipeline**

Run: `python scripts/generate_tracker_data.py`

Expected: generated leaderboard and entry-progress payloads include rolled-up third-place group-stage points and the new `thirdPlaceQualifiers` breakdown.

- [ ] **Step 4: Rebuild the frontend bundle**

Run: `npm.cmd run build`

Expected: PASS

- [ ] **Step 5: Spot-check the generated data shape**

Run: `python - <<'PY'\nimport json\nfrom pathlib import Path\nentry_progress = json.loads(Path('app/dist/data/entry-progress.json').read_text())\nprint(entry_progress['entries'][0]['groupStage']['thirdPlaceQualifiers'].keys())\nPY`

Expected: output includes `predictedTeams`, `actualTeams`, `correctTeams`, `correctCount`, `points`, and `scored`.

## Self-Review

- Spec coverage: backend scoring, config-driven third-place points, official-vs-projected scoring gates, entry-progress breakdown, and frontend render-only consumption are all covered.
- Placeholder scan: tasks contain exact files, concrete commands, and implementation snippets for each change area.
- Type consistency: `correctThirdPlaceQualifierPerTeam` is introduced once in the scoring config, `thirdPlaceQualifiers` is named consistently in Python output and TypeScript types, and the frontend consumes only the generated payload shape.
