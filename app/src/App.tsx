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
