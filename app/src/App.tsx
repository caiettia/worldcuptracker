import { useEffect, useMemo, useState } from "react";
import LoadState from "./components/LoadState";
import BracketView from "./views/BracketView";
import GroupsView from "./views/GroupsView";
import LeaderboardView from "./views/LeaderboardView";
import { loadAppData } from "./lib/loadAppData";
import { COLORS, FONTS } from "./lib/ui";
import type { AppData, EntryProgressRow } from "./types/leaderboard";

type ViewName = "leaderboard" | "groups" | "bracket";

const CURRENT_USER_ID = "dinkelberg";

const TABS: Array<{ key: ViewName; label: string }> = [
  { key: "leaderboard", label: "Leaderboard" },
  { key: "groups", label: "Groups" },
  { key: "bracket", label: "Bracket" },
];

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewName>("leaderboard");
  const [focusPlayerId, setFocusPlayerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    loadAppData()
      .then((payload) => {
        if (active) {
          setData(payload);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load the leaderboard.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const entriesById = useMemo(() => {
    const map = new Map<string, EntryProgressRow>();
    data?.entryProgress.entries.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [data]);

  const goToTab = (key: ViewName) => {
    setView(key);
  };

  const selectEntry = (entryId: string) => {
    setFocusPlayerId(entryId);
    setView("groups");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#FBF4E6 0%,#F7F0E0 42%,#F4EDDB 100%)",
        fontFamily: FONTS.body,
        color: COLORS.ink,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 64px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 4px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.gold }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.red }} />
            </div>
            <span style={{ fontFamily: FONTS.head, fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em", color: COLORS.green }}>
              World Cup Tracker
            </span>
          </div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: 12,
              color: "#9A8A5E",
              background: "rgba(232,162,61,0.14)",
              border: "1px solid rgba(232,162,61,0.3)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            2026
          </span>
        </header>

        <nav
          style={{
            position: "sticky",
            top: 8,
            zIndex: 20,
            display: "flex",
            gap: 4,
            padding: 5,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${COLORS.lineSoft}`,
            borderRadius: 999,
            boxShadow: "0 8px 22px rgba(20,40,30,0.06)",
            marginBottom: 24,
          }}
        >
          {TABS.map((tab) => {
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => goToTab(tab.key)}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "9px 0",
                  borderRadius: 999,
                  transition: "all .15s",
                  background: active ? COLORS.green : "transparent",
                  color: active ? "#fff" : "#7A857C",
                  boxShadow: active ? "0 2px 8px rgba(14,110,66,0.3)" : undefined,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {error ? <LoadState title="Load Error" message={error} /> : null}

        {!error && !data ? <LoadState title="Matchday Prep" message="Loading leaderboard..." /> : null}

        {!error && data ? (
          <>
            {view === "leaderboard" ? (
              <LeaderboardView
                rows={data.leaderboard.leaderboard}
                entriesById={entriesById}
                currentUserId={CURRENT_USER_ID}
                onSelectEntry={selectEntry}
              />
            ) : null}

            {view === "groups" ? (
              <GroupsView
                actualResults={data.actualResults}
                brackets={data.brackets}
                entryProgress={data.entryProgress}
                focusPlayerId={focusPlayerId}
              />
            ) : null}

            {view === "bracket" ? (
              <BracketView brackets={data.brackets} entryProgress={data.entryProgress} focusPlayerId={focusPlayerId} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
