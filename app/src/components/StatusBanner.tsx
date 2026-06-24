import { formatAsOfLabel, formatProgressLabel } from "../lib/format";
import type { LeaderboardMetadata, LeaderboardProgress } from "../types/leaderboard";

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
