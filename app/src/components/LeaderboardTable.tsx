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
