import { useEffect, useState } from "react";
import BracketView from "./components/BracketView";
import EntryDetailView from "./components/EntryDetailView";
import LeaderboardTable from "./components/LeaderboardTable";
import LoadState from "./components/LoadState";
import Podium from "./components/Podium";
import TopNav from "./components/TopNav";
import { loadAppData } from "./lib/loadAppData";
import type { AppData } from "./types/leaderboard";

type ViewState =
  | { name: "leaderboard" }
  | { name: "entry"; entryId: string }
  | { name: "bracket"; entryId: string };

function selectedBracketEntryId(data: AppData): string {
  return data.brackets.entries[0]?.id ?? "";
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ name: "leaderboard" });

  useEffect(() => {
    let active = true;

    loadAppData()
      .then((payload) => {
        if (active) {
          setData(payload);
          setView({ name: "leaderboard" });
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

  if (error) {
    return <LoadState title="Load Error" message={error} />;
  }

  if (!data) {
    return <LoadState title="Matchday Prep" message="Loading leaderboard..." />;
  }

  return (
    <>
      <TopNav
        activeView={view.name === "bracket" ? "bracket" : "leaderboard"}
        onNavigate={(nextView) => {
          if (!data) {
            return;
          }

          if (nextView === "leaderboard") {
            setView({ name: "leaderboard" });
            return;
          }

          setView({
            name: "bracket",
            entryId: view.name === "bracket" ? view.entryId : selectedBracketEntryId(data),
          });
        }}
      />
      <main className="app-shell">
        <div className="app-frame">
          {view.name === "leaderboard" ? (
            <>
              <Podium
                rows={data.leaderboard.leaderboard}
                onSelectEntry={(entryId) => setView({ name: "entry", entryId })}
              />
              <LeaderboardTable
                rows={data.leaderboard.leaderboard}
                onSelectEntry={(entryId) => setView({ name: "entry", entryId })}
              />
            </>
          ) : null}

          {view.name === "entry"
            ? (() => {
                const bracketEntry = data.brackets.entries.find((entry) => entry.id === view.entryId);
                const entryProgress = data.entryProgress.entries.find((entry) => entry.id === view.entryId);

                if (!bracketEntry || !entryProgress) {
                  return (
                    <LoadState
                      title="Entry Not Found"
                      message="That player's submission could not be found."
                    />
                  );
                }

                return (
                  <EntryDetailView
                    actualResults={data.actualResults}
                    bracketEntry={bracketEntry}
                    entryProgress={entryProgress}
                    onBack={() => setView({ name: "leaderboard" })}
                  />
                );
              })()
            : null}

          {view.name === "bracket" ? (
            <BracketView
              entries={data.brackets.entries}
              selectedEntryId={view.entryId}
              onSelectEntry={(entryId) => setView({ name: "bracket", entryId })}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
