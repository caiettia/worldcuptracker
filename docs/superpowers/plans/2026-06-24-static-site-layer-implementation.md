# Static Site Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React + TypeScript static homepage that fetches leaderboard data from `/data/leaderboard.json` at runtime and presents a Stitch-aligned World Cup leaderboard UI.

**Architecture:** Keep the Python scorer as the data source and add a narrow frontend app under `app/`. The frontend fetches a static JSON payload from `app/public/data`, renders loading/error/loaded states, and stays single-page and display-only in v1. A small publish script bridges `data/generated/` into the frontend public directory.

**Tech Stack:** Vite, React, TypeScript, CSS, Vitest, React Testing Library, Python utility script

---

## File Structure

Create or modify these files during implementation:

- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/tsconfig.node.json`
- Create: `app/vite.config.ts`
- Create: `app/index.html`
- Create: `app/src/main.tsx`
- Create: `app/src/App.tsx`
- Create: `app/src/types/leaderboard.ts`
- Create: `app/src/lib/loadLeaderboard.ts`
- Create: `app/src/lib/format.ts`
- Create: `app/src/components/HeroHeader.tsx`
- Create: `app/src/components/StatusBanner.tsx`
- Create: `app/src/components/Podium.tsx`
- Create: `app/src/components/LeaderboardTable.tsx`
- Create: `app/src/components/LoadState.tsx`
- Create: `app/src/styles/index.css`
- Create: `app/src/styles/app.css`
- Create: `app/src/styles/components.css`
- Create: `app/src/test/setup.ts`
- Create: `app/src/lib/loadLeaderboard.test.ts`
- Create: `app/src/App.test.tsx`
- Create: `app/public/data/.gitkeep`
- Create: `scripts/publish_frontend_data.py`
- Modify: `scripts/generate_tracker_data.py` only if a small machine-readable output improvement is needed

The frontend should remain small and file-focused. Data contracts live in `types`, side effects live in `lib`, presentational code lives in `components`, and top-level page assembly stays in `App.tsx`.

### Task 1: Scaffold the Vite app and baseline toolchain

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/tsconfig.node.json`
- Create: `app/vite.config.ts`
- Create: `app/index.html`
- Create: `app/src/main.tsx`
- Create: `app/src/styles/index.css`
- Create: `app/public/data/.gitkeep`

- [ ] **Step 1: Write the failing startup test contract**

Create `app/src/App.test.tsx` with an initial smoke test that expects the app shell to render a loading state:

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

vi.mock("./lib/loadLeaderboard", () => ({
  loadLeaderboard: () => new Promise(() => {}),
}));

test("renders loading state before leaderboard data resolves", () => {
  render(<App />);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app; npm test -- --run App.test.tsx`

Expected: FAIL because the Vite app files, Vitest setup, and `App.tsx` do not exist yet.

- [ ] **Step 3: Create the Vite baseline files**

Create `app/package.json`:

```json
{
  "name": "worldcup-tracker-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

Create `app/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `app/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "./styles/app.css";
import "./styles/components.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `app/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `app/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>World Cup Bracket Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `app/src/styles/index.css`:

```css
:root {
  color-scheme: light;
  font-family: Inter, system-ui, sans-serif;
  background:
    radial-gradient(circle at top, rgba(255, 184, 0, 0.18), transparent 32%),
    linear-gradient(180deg, #f8f9ff 0%, #eff4ff 100%);
  color: #0b1c30;
  --pitch-green: #004c3a;
  --pitch-green-bright: #00664f;
  --stadium-gold: #feb700;
  --ink: #0b1c30;
  --muted: #526173;
  --surface: #ffffff;
  --surface-soft: #e5eeff;
  --line: rgba(11, 28, 48, 0.1);
  --radius-lg: 20px;
  --radius-md: 14px;
  --shadow-soft: 0 20px 50px rgba(12, 107, 84, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
table {
  font: inherit;
}
```

Create `app/public/data/.gitkeep` as an empty file.

- [ ] **Step 4: Install dependencies and run the test again**

Run: `cd app; npm install; npm test -- --run App.test.tsx`

Expected: FAIL because `App.tsx` and `loadLeaderboard` still do not exist, proving the baseline scaffold is in place but the feature is not yet implemented.

- [ ] **Step 5: Commit**

```bash
git add app/package.json app/tsconfig.json app/tsconfig.node.json app/vite.config.ts app/index.html app/src/main.tsx app/src/styles/index.css app/src/test/setup.ts app/public/data/.gitkeep app/src/App.test.tsx
git commit -m "feat: scaffold static frontend app"
```

### Task 2: Define the leaderboard types and JSON loader

**Files:**
- Create: `app/src/types/leaderboard.ts`
- Create: `app/src/lib/loadLeaderboard.ts`
- Create: `app/src/lib/loadLeaderboard.test.ts`

- [ ] **Step 1: Write the failing loader tests**

Create `app/src/lib/loadLeaderboard.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { loadLeaderboard } from "./loadLeaderboard";

describe("loadLeaderboard", () => {
  it("returns parsed leaderboard data when the payload is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          metadata: { generatedAt: "2026-06-24T18:38:07Z", asOf: null, entrants: 6, scoringSystem: "fifa" },
          progress: {
            groupsFinalized: 0,
            roundOf16TeamsKnown: 0,
            quarterfinalTeamsKnown: 0,
            semifinalTeamsKnown: 0,
            finalTeamsKnown: 0,
            championKnown: false
          },
          leaderboard: [
            {
              rank: 1,
              id: "dinkelberg",
              displayName: "Dinkelberg",
              totalPoints: 0,
              groupStagePoints: 0,
              knockoutPoints: 0
            }
          ]
        }),
      }),
    );

    const result = await loadLeaderboard();
    expect(result.leaderboard[0].displayName).toBe("Dinkelberg");
  });

  it("throws a helpful error when the payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ leaderboard: null }),
      }),
    );

    await expect(loadLeaderboard()).rejects.toThrow(/invalid leaderboard payload/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app; npm test -- --run src/lib/loadLeaderboard.test.ts`

Expected: FAIL because `loadLeaderboard.ts` and the related types do not exist yet.

- [ ] **Step 3: Write the minimal leaderboard types and loader**

Create `app/src/types/leaderboard.ts`:

```ts
export type LeaderboardRow = {
  rank: number;
  id: string;
  displayName: string;
  totalPoints: number;
  groupStagePoints: number;
  knockoutPoints: number;
};

export type LeaderboardProgress = {
  groupsFinalized: number;
  roundOf16TeamsKnown: number;
  quarterfinalTeamsKnown: number;
  semifinalTeamsKnown: number;
  finalTeamsKnown: number;
  championKnown: boolean;
};

export type LeaderboardMetadata = {
  generatedAt: string;
  asOf: string | null;
  entrants: number;
  scoringSystem: string;
};

export type LeaderboardPayload = {
  metadata: LeaderboardMetadata;
  progress: LeaderboardProgress;
  leaderboard: LeaderboardRow[];
};
```

Create `app/src/lib/loadLeaderboard.ts`:

```ts
import type { LeaderboardPayload } from "../types/leaderboard";

function isLeaderboardRow(value: unknown): value is LeaderboardPayload["leaderboard"][number] {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.rank === "number" &&
    typeof row.id === "string" &&
    typeof row.displayName === "string" &&
    typeof row.totalPoints === "number" &&
    typeof row.groupStagePoints === "number" &&
    typeof row.knockoutPoints === "number"
  );
}

function isLeaderboardPayload(value: unknown): value is LeaderboardPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const progress = payload.progress as Record<string, unknown> | undefined;
  return (
    !!metadata &&
    !!progress &&
    typeof metadata.generatedAt === "string" &&
    (typeof metadata.asOf === "string" || metadata.asOf === null) &&
    typeof metadata.entrants === "number" &&
    typeof metadata.scoringSystem === "string" &&
    typeof progress.groupsFinalized === "number" &&
    typeof progress.roundOf16TeamsKnown === "number" &&
    typeof progress.quarterfinalTeamsKnown === "number" &&
    typeof progress.semifinalTeamsKnown === "number" &&
    typeof progress.finalTeamsKnown === "number" &&
    typeof progress.championKnown === "boolean" &&
    Array.isArray(payload.leaderboard) &&
    payload.leaderboard.every(isLeaderboardRow)
  );
}

export async function loadLeaderboard(): Promise<LeaderboardPayload> {
  const response = await fetch("/data/leaderboard.json");
  if (!response.ok) {
    throw new Error(`Unable to load leaderboard data (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!isLeaderboardPayload(data)) {
    throw new Error("Invalid leaderboard payload");
  }

  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app; npm test -- --run src/lib/loadLeaderboard.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/src/types/leaderboard.ts app/src/lib/loadLeaderboard.ts app/src/lib/loadLeaderboard.test.ts
git commit -m "feat: add runtime leaderboard loader"
```

### Task 3: Build the app shell and loading/error/loaded states

**Files:**
- Create: `app/src/App.tsx`
- Create: `app/src/components/LoadState.tsx`
- Modify: `app/src/App.test.tsx`

- [ ] **Step 1: Expand the failing app tests**

Update `app/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

const mockLoadLeaderboard = vi.fn();

vi.mock("./lib/loadLeaderboard", () => ({
  loadLeaderboard: () => mockLoadLeaderboard(),
}));

test("renders loading state before leaderboard data resolves", () => {
  mockLoadLeaderboard.mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
});

test("renders error state when leaderboard loading fails", async () => {
  mockLoadLeaderboard.mockRejectedValue(new Error("boom"));
  render(<App />);
  expect(await screen.findByText(/unable to load the leaderboard/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app; npm test -- --run src/App.test.tsx`

Expected: FAIL because `App.tsx` and `LoadState.tsx` do not exist yet.

- [ ] **Step 3: Write the minimal app shell**

Create `app/src/components/LoadState.tsx`:

```tsx
type LoadStateProps = {
  title: string;
  message: string;
};

export default function LoadState({ title, message }: LoadStateProps) {
  return (
    <section className="load-state" aria-live="polite">
      <p className="eyebrow">{title}</p>
      <h2>{message}</h2>
    </section>
  );
}
```

Create `app/src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import LoadState from "./components/LoadState";
import { loadLeaderboard } from "./lib/loadLeaderboard";
import type { LeaderboardPayload } from "./types/leaderboard";

export default function App() {
  const [data, setData] = useState<LeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadLeaderboard()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError("Unable to load the leaderboard.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <LoadState title="Load Error" message={error} />;
  }

  if (!data) {
    return <LoadState title="Matchday Prep" message="Loading leaderboard..." />;
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <p className="eyebrow">World Cup Bracket Tracker</p>
        <h1>Leaderboard ready for build-out</h1>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app; npm test -- --run src/App.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/src/App.tsx app/src/components/LoadState.tsx app/src/App.test.tsx
git commit -m "feat: add app state handling"
```

### Task 4: Build the leaderboard UI components

**Files:**
- Create: `app/src/components/HeroHeader.tsx`
- Create: `app/src/components/StatusBanner.tsx`
- Create: `app/src/components/Podium.tsx`
- Create: `app/src/components/LeaderboardTable.tsx`
- Create: `app/src/lib/format.ts`
- Modify: `app/src/App.tsx`
- Modify: `app/src/App.test.tsx`

- [ ] **Step 1: Write the failing UI composition tests**

Update `app/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

const mockLoadLeaderboard = vi.fn();

vi.mock("./lib/loadLeaderboard", () => ({
  loadLeaderboard: () => mockLoadLeaderboard(),
}));

test("renders the leaderboard heading and top player when data loads", async () => {
  mockLoadLeaderboard.mockResolvedValue({
    metadata: { generatedAt: "2026-06-24T18:38:07Z", asOf: null, entrants: 6, scoringSystem: "fifa" },
    progress: {
      groupsFinalized: 0,
      roundOf16TeamsKnown: 0,
      quarterfinalTeamsKnown: 0,
      semifinalTeamsKnown: 0,
      finalTeamsKnown: 0,
      championKnown: false
    },
    leaderboard: [
      { rank: 1, id: "dinkelberg", displayName: "Dinkelberg", totalPoints: 120, groupStagePoints: 90, knockoutPoints: 30 },
      { rank: 2, id: "nfry", displayName: "NFry", totalPoints: 100, groupStagePoints: 70, knockoutPoints: 30 },
      { rank: 3, id: "liz", displayName: "ElizabethAcors", totalPoints: 80, groupStagePoints: 50, knockoutPoints: 30 }
    ]
  });

  render(<App />);
  expect(await screen.findByRole("heading", { name: /league leaderboard/i })).toBeInTheDocument();
  expect(screen.getByText("Dinkelberg")).toBeInTheDocument();
  expect(screen.getByText("120")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app; npm test -- --run src/App.test.tsx`

Expected: FAIL because the loaded UI still renders only the placeholder shell.

- [ ] **Step 3: Write the minimal presentational components**

Create `app/src/lib/format.ts`:

```ts
export function formatAsOfLabel(value: string | null): string {
  if (!value) return "Awaiting tournament results";
  return new Date(value).toLocaleString();
}

export function formatProgressLabel(groupsFinalized: number, championKnown: boolean): string {
  if (championKnown) return "Tournament complete";
  if (groupsFinalized === 0) return "Predictions locked in, results pending";
  return `${groupsFinalized} groups finalized`;
}
```

Create `app/src/components/HeroHeader.tsx`:

```tsx
export default function HeroHeader() {
  return (
    <section className="hero-header">
      <p className="eyebrow">Private League Tracker</p>
      <h1>League Leaderboard</h1>
      <p className="hero-copy">
        A cleaner way to see who is actually cooking in the World Cup bracket pool.
      </p>
    </section>
  );
}
```

Create `app/src/components/StatusBanner.tsx`:

```tsx
import type { LeaderboardMetadata, LeaderboardProgress } from "../types/leaderboard";
import { formatAsOfLabel, formatProgressLabel } from "../lib/format";

type StatusBannerProps = {
  metadata: LeaderboardMetadata;
  progress: LeaderboardProgress;
};

export default function StatusBanner({ metadata, progress }: StatusBannerProps) {
  return (
    <section className="status-banner">
      <div>
        <p className="eyebrow">As Of</p>
        <strong>{formatAsOfLabel(metadata.asOf)}</strong>
      </div>
      <div>
        <p className="eyebrow">Entrants</p>
        <strong>{metadata.entrants}</strong>
      </div>
      <div>
        <p className="eyebrow">Progress</p>
        <strong>{formatProgressLabel(progress.groupsFinalized, progress.championKnown)}</strong>
      </div>
    </section>
  );
}
```

Create `app/src/components/Podium.tsx`:

```tsx
import type { LeaderboardRow } from "../types/leaderboard";

type PodiumProps = {
  rows: LeaderboardRow[];
};

export default function Podium({ rows }: PodiumProps) {
  const topThree = rows.slice(0, 3);
  return (
    <section className="podium">
      {topThree.map((row, index) => (
        <article className={`podium-card podium-card--${index + 1}`} key={row.id}>
          <p className="eyebrow">#{row.rank}</p>
          <h2>{row.displayName}</h2>
          <p className="podium-points">{row.totalPoints}</p>
        </article>
      ))}
    </section>
  );
}
```

Create `app/src/components/LeaderboardTable.tsx`:

```tsx
import type { LeaderboardRow } from "../types/leaderboard";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
};

export default function LeaderboardTable({ rows }: LeaderboardTableProps) {
  return (
    <section className="leaderboard-table-card">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Total</th>
            <th>Groups</th>
            <th>Knockout</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.rank}</td>
              <td>{row.displayName}</td>
              <td>{row.totalPoints}</td>
              <td>{row.groupStagePoints}</td>
              <td>{row.knockoutPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

Update `app/src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import HeroHeader from "./components/HeroHeader";
import LeaderboardTable from "./components/LeaderboardTable";
import LoadState from "./components/LoadState";
import Podium from "./components/Podium";
import StatusBanner from "./components/StatusBanner";
import { loadLeaderboard } from "./lib/loadLeaderboard";
import type { LeaderboardPayload } from "./types/leaderboard";

export default function App() {
  const [data, setData] = useState<LeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadLeaderboard()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError("Unable to load the leaderboard.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <LoadState title="Load Error" message={error} />;
  }

  if (!data) {
    return <LoadState title="Matchday Prep" message="Loading leaderboard..." />;
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <HeroHeader />
        <StatusBanner metadata={data.metadata} progress={data.progress} />
        <Podium rows={data.leaderboard} />
        <LeaderboardTable rows={data.leaderboard} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app; npm test -- --run src/App.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/src/App.tsx app/src/components/HeroHeader.tsx app/src/components/StatusBanner.tsx app/src/components/Podium.tsx app/src/components/LeaderboardTable.tsx app/src/lib/format.ts app/src/App.test.tsx
git commit -m "feat: add leaderboard homepage components"
```

### Task 5: Apply the Stitch-aligned visual system and responsive behavior

**Files:**
- Create: `app/src/styles/app.css`
- Create: `app/src/styles/components.css`
- Modify: `app/src/components/LeaderboardTable.tsx`

- [ ] **Step 1: Write the failing responsive and semantic expectation**

Add this assertion to `app/src/App.test.tsx`:

```tsx
expect(await screen.findByRole("table")).toBeInTheDocument();
```

This is a small failing guard if the table markup drifts while styling changes are made.

- [ ] **Step 2: Run test to verify it fails if the table role is missing**

Run: `cd app; npm test -- --run src/App.test.tsx`

Expected: PASS now. Then temporarily remove the `<table>` wrapper locally to confirm the assertion catches the regression, restore it, and proceed. The point is to verify the test is meaningful before styling work continues.

- [ ] **Step 3: Write the page and component styles**

Create `app/src/styles/app.css`:

```css
.app-shell {
  min-height: 100vh;
  padding: 32px 16px 64px;
}

.app-frame {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.hero-header {
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(0, 102, 79, 0.98), rgba(0, 76, 58, 0.96)),
    radial-gradient(circle at top right, rgba(254, 183, 0, 0.28), transparent 30%);
  color: white;
  box-shadow: var(--shadow-soft);
}

.hero-header h1 {
  margin: 8px 0 12px;
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(2.4rem, 5vw, 4.5rem);
  line-height: 0.95;
}

.hero-copy {
  max-width: 48rem;
  color: rgba(255, 255, 255, 0.86);
}

.status-banner,
.podium,
.leaderboard-table-card,
.load-state {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow-soft);
}

.status-banner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 24px;
}

.podium {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
}

.leaderboard-table-card,
.load-state {
  padding: 20px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 800;
}

@media (max-width: 720px) {
  .app-shell {
    padding: 20px 12px 40px;
  }

  .status-banner,
  .podium {
    grid-template-columns: 1fr;
  }
}
```

Create `app/src/styles/components.css`:

```css
.podium-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(229, 238, 255, 0.85), rgba(255, 255, 255, 0.95));
  border: 1px solid rgba(11, 28, 48, 0.08);
}

.podium-card--1 {
  background: linear-gradient(180deg, rgba(254, 183, 0, 0.28), rgba(255, 255, 255, 0.96));
}

.podium-points {
  margin: 12px 0 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 2rem;
  font-weight: 700;
  color: var(--pitch-green);
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid var(--line);
}

.leaderboard-table th {
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.76rem;
}

.leaderboard-table tbody tr:last-child td {
  border-bottom: none;
}

@media (max-width: 720px) {
  .leaderboard-table thead {
    display: none;
  }

  .leaderboard-table,
  .leaderboard-table tbody,
  .leaderboard-table tr,
  .leaderboard-table td {
    display: block;
    width: 100%;
  }

  .leaderboard-table tr {
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }

  .leaderboard-table td {
    border: none;
    padding: 6px 0;
  }
}
```

If needed, update `LeaderboardTable.tsx` cell ordering or labels slightly to support the mobile stacked treatment while preserving the table element.

- [ ] **Step 4: Run tests and build to verify everything still passes**

Run:
- `cd app; npm test -- --run`
- `cd app; npm run build`

Expected:
- Vitest passes
- Vite build succeeds with no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add app/src/styles/app.css app/src/styles/components.css app/src/components/LeaderboardTable.tsx app/src/App.test.tsx
git commit -m "feat: style leaderboard homepage"
```

### Task 6: Add the data publish step and verify end-to-end local behavior

**Files:**
- Create: `scripts/publish_frontend_data.py`
- Modify: `app/public/data/leaderboard.json`

- [ ] **Step 1: Write the failing publish expectation**

Create a simple script expectation in a shell note or temporary command:

Run: `python scripts/publish_frontend_data.py`

Expected initially: FAIL because the script does not exist yet.

- [ ] **Step 2: Implement the publish script**

Create `scripts/publish_frontend_data.py`:

```python
from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "generated" / "leaderboard.json"
DEST_DIR = ROOT / "app" / "public" / "data"
DEST = DEST_DIR / "leaderboard.json"


def main() -> None:
  if not SOURCE.exists():
    raise FileNotFoundError(f"Missing generated leaderboard file: {SOURCE}")

  DEST_DIR.mkdir(parents=True, exist_ok=True)
  shutil.copy2(SOURCE, DEST)
  print(f"Copied {SOURCE} -> {DEST}")


if __name__ == "__main__":
  main()
```

- [ ] **Step 3: Run the publish script and verify the copied payload**

Run:
- `python scripts/generate_tracker_data.py`
- `python scripts/publish_frontend_data.py`
- `Get-Content app\\public\\data\\leaderboard.json -TotalCount 40`

Expected:
- generator succeeds
- publish script reports copied source and destination
- public leaderboard file contents match the generated file structure

- [ ] **Step 4: Run the frontend locally and verify the full flow**

Run:
- `cd app; npm run dev`

Then load the local app in a browser and confirm:
- the page loads
- the hero renders
- status banner renders
- podium renders
- leaderboard table renders
- zero-score state still looks deliberate

- [ ] **Step 5: Commit**

```bash
git add scripts/publish_frontend_data.py app/public/data/leaderboard.json
git commit -m "feat: publish generated leaderboard data to frontend"
```

### Task 7: Final verification and developer handoff

**Files:**
- Review only: `app/`
- Review only: `scripts/`

- [ ] **Step 1: Run the complete verification suite**

Run:
- `python scripts/generate_tracker_data.py`
- `python scripts/publish_frontend_data.py`
- `cd app; npm test -- --run`
- `cd app; npm run build`

Expected:
- data generation succeeds
- publish succeeds
- tests pass
- production build succeeds

- [ ] **Step 2: Verify spec coverage against the implemented surface**

Manual checklist:
- runtime JSON fetch from static file
- single-page leaderboard homepage
- loading state
- error state
- top-three summary
- full leaderboard table
- Stitch-aligned visual direction
- responsive mobile treatment
- no row-click interaction

Expected: every v1 requirement from `docs/superpowers/specs/2026-06-24-static-site-layer-design.md` is satisfied.

- [ ] **Step 3: Stage final files and create a delivery commit**

```bash
git add app scripts docs
git commit -m "feat: build static leaderboard site"
```

## Self-Review

Spec coverage check:

- Runtime JSON fetch is covered in Tasks 2, 3, and 6.
- Single-page homepage composition is covered in Tasks 3 and 4.
- Stitch-aligned styling and responsive behavior are covered in Task 5.
- Publish workflow from generated data into frontend public assets is covered in Task 6.
- Final verification is explicitly covered in Task 7.

Placeholder scan:

- No `TODO`, `TBD`, or deferred implementation markers remain in this plan.
- Every code-changing task contains concrete file paths and code snippets.
- Every verification step contains explicit commands and expected outcomes.

Type consistency:

- `LeaderboardPayload`, `LeaderboardMetadata`, `LeaderboardProgress`, and `LeaderboardRow` are defined once in Task 2 and reused consistently in Tasks 3 and 4.
- `loadLeaderboard()` remains the single loader interface throughout the plan.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-24-static-site-layer-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
