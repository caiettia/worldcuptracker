import type { LeaderboardRow } from "../types/leaderboard";

type PodiumProps = {
  rows: LeaderboardRow[];
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Podium({ rows }: PodiumProps) {
  const topThree = rows.slice(0, 3);

  return (
    <section className="podium-section">
      <div className="podium-stage">
        <article className="podium-slot podium-slot--2">
          {topThree[1] ? (
            <>
              <div className="podium-avatar-wrap">
                <div className="podium-avatar podium-avatar--2">{initials(topThree[1].displayName)}</div>
                <div className="podium-medal podium-medal--2">2</div>
              </div>
              <div className="podium-stand podium-stand--2">
                <span className="podium-name podium-name--muted">{topThree[1].displayName}</span>
                <span className="podium-score">{topThree[1].totalPoints.toLocaleString()} pts</span>
              </div>
            </>
          ) : null}
        </article>

        <article className="podium-slot podium-slot--1">
          {topThree[0] ? (
            <>
              <div className="podium-avatar-wrap">
                <div className="podium-avatar podium-avatar--1">{initials(topThree[0].displayName)}</div>
                <div className="podium-medal podium-medal--1">1</div>
              </div>
              <div className="podium-stand podium-stand--1">
                <span className="podium-name podium-name--primary">{topThree[0].displayName}</span>
                <span className="podium-score podium-score--winner">
                  {topThree[0].totalPoints.toLocaleString()} pts
                </span>
              </div>
            </>
          ) : null}
        </article>

        <article className="podium-slot podium-slot--3">
          {topThree[2] ? (
            <>
              <div className="podium-avatar-wrap">
                <div className="podium-avatar podium-avatar--3">{initials(topThree[2].displayName)}</div>
                <div className="podium-medal podium-medal--3">3</div>
              </div>
              <div className="podium-stand podium-stand--3">
                <span className="podium-name podium-name--muted">{topThree[2].displayName}</span>
                <span className="podium-score">{topThree[2].totalPoints.toLocaleString()} pts</span>
              </div>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
