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
