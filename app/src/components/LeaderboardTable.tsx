import type { LeaderboardRow } from "../types/leaderboard";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  onSelectEntry: (entryId: string) => void;
};

const CURRENT_USER_ID = "dinkelberg";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LeaderboardTable({ rows, onSelectEntry }: LeaderboardTableProps) {
  return (
    <section className="leaderboard-table-card">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className={`leaderboard-row ${row.id === CURRENT_USER_ID ? "leaderboard-row--you" : ""}`}
              key={row.id}
            >
              <td data-label="Rank">
                <span className={`rank-text ${row.id === CURRENT_USER_ID ? "rank-text--you" : ""}`}>
                  {String(row.rank).padStart(2, "0")}
                </span>
              </td>
              <td data-label="Player">
                <div className="entrant-cell">
                  <div className="entrant-main">
                    <span className="entrant-avatar">{initials(row.displayName)}</span>
                    <button
                      className="entrant-name entrant-name-button"
                      type="button"
                      onClick={() => onSelectEntry(row.id)}
                      aria-label={`View ${row.displayName} predictions`}
                    >
                      {row.displayName}
                    </button>
                  </div>
                </div>
              </td>
              <td data-label="Points">
                <span className={`score-text ${row.id === CURRENT_USER_ID ? "score-text--you" : ""}`}>
                  {`${row.totalPoints.toLocaleString()} (${row.projectedTotalPoints.toLocaleString()}, +${row.projectedAdditionalPoints.toLocaleString()})`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
