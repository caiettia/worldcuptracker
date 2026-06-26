# Bracket Flag Avatars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add circular country flag avatars to the entrant group-stage comparison view using local SVG assets and a small country-name normalization helper.

**Architecture:** Keep the existing group comparison layout and ordered-list semantics intact, but replace plain text list rows with a compact media row made of a circular flag avatar and a label. Resolve the current tracker's country-name variants in a dedicated helper that returns local `/flags/<iso>.svg` paths, and let the UI fall back to text-only rows when a country name is unknown.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, static assets served from Vite `public/`

---

## File Structure

- Create: `app/src/lib/countryFlags.ts`
- Modify: `app/src/components/EntryDetailView.tsx`
- Modify: `app/src/styles/app.css`
- Modify: `app/src/App.test.tsx`
- Create: `app/public/flags/*.svg`

### Task 1: Add the failing rendering and normalization tests

**Files:**
- Modify: `app/src/App.test.tsx`
- Create: `app/src/lib/countryFlags.ts`

- [ ] **Step 1: Write the failing UI and helper tests**

```tsx
test("shows circular flag avatars for group comparison countries", async () => {
  mockLoadAppData.mockResolvedValue(appData);

  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: /view dinkelberg predictions/i }));

  expect(screen.getByAltText("Mexico flag")).toHaveAttribute("src", "/flags/mx.svg");
  expect(screen.getByAltText("Bosnia-Herzegovina flag")).toHaveAttribute("src", "/flags/ba.svg");
});
```

```tsx
test("omits flag images when a country cannot be resolved", () => {
  expect(getCountryFlagSrc("Atlantis")).toBeNull();
});
```

- [ ] **Step 2: Run the focused app test to verify it fails**

Run: `npm test -- App.test.tsx --runInBand`

Expected: FAIL because the comparison view does not render any flag images and the helper does not exist yet.

- [ ] **Step 3: Add the helper test fixture country variant to the mocked data**

```tsx
groups: {
  A: ["Mexico", "Bosnia-Herzegovina", "Korea Republic", "South Africa"],
},
```

- [ ] **Step 4: Re-run the focused app test to verify the alias expectation still fails for the right reason**

Run: `npm test -- App.test.tsx --runInBand`

Expected: FAIL with a missing `img`/alt-text assertion rather than a test setup error.

### Task 2: Implement the country-flag helper and local assets

**Files:**
- Create: `app/src/lib/countryFlags.ts`
- Create: `app/public/flags/*.svg`

- [ ] **Step 1: Write the minimal helper API**

```ts
const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  Mexico: "mx",
  USA: "us",
  "IR Iran": "ir",
  "Korea Republic": "kr",
  "Bosnia-Herzegovina": "ba",
  "Bosnia and Herzegovina": "ba",
  "Cote d'Ivoire": "ci",
  Turkiye: "tr",
  "Congo DR": "cd",
  "Cabo Verde": "cv",
};

export function getCountryFlagSrc(countryName: string): string | null {
  const code = COUNTRY_CODE_BY_NAME[countryName];
  return code ? `/flags/${code}.svg` : null;
}
```

- [ ] **Step 2: Copy the required SVG files into the public flags directory**

```text
app/public/flags/mx.svg
app/public/flags/ba.svg
app/public/flags/kr.svg
app/public/flags/za.svg
...
```

Include every country currently referenced by `data/actual-results.json` and `data/brackets.json`.

- [ ] **Step 3: Run the focused app test to verify it still fails only on rendering**

Run: `npm test -- App.test.tsx --runInBand`

Expected: FAIL because the helper exists, but `EntryDetailView` still renders plain text list items.

### Task 3: Render the avatars in the comparison list and style them

**Files:**
- Modify: `app/src/components/EntryDetailView.tsx`
- Modify: `app/src/styles/app.css`

- [ ] **Step 1: Replace plain text rows with a reusable standings row renderer**

```tsx
function renderStandings(teams: string[], emptyLabel: string) {
  if (teams.length === 0) {
    return <p className="group-card__empty">{emptyLabel}</p>;
  }

  return (
    <ol className="group-card__list">
      {teams.map((team) => {
        const flagSrc = getCountryFlagSrc(team);

        return (
          <li className="group-card__team" key={team}>
            {flagSrc ? (
              <span className="group-card__flag-avatar">
                <img alt={`${team} flag`} className="group-card__flag-image" src={flagSrc} />
              </span>
            ) : null}
            <span>{team}</span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Add the circular avatar styles**

```css
.group-card__team {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-card__flag-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  overflow: hidden;
  flex: 0 0 28px;
  border: 1px solid rgba(11, 28, 48, 0.14);
  background: white;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.group-card__flag-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 3: Run the focused app test to verify it passes**

Run: `npm test -- App.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 4: Run the full frontend test suite**

Run: `npm test -- --runInBand`

Expected: PASS with no frontend regressions.

- [ ] **Step 5: Commit**

```bash
git add app/src/App.test.tsx app/src/components/EntryDetailView.tsx app/src/lib/countryFlags.ts app/src/styles/app.css app/public/flags
git commit -m "feat: add bracket comparison flag avatars"
```

## Self-Review

- Spec coverage: local SVGs, circular avatar styling, alias mapping, graceful fallback, and UI verification are all covered by Tasks 1 through 3.
- Placeholder scan: the plan includes concrete files, commands, and representative code for each step.
- Type consistency: the helper API is `getCountryFlagSrc(countryName: string): string | null` throughout the plan and is consumed consistently by `EntryDetailView`.
