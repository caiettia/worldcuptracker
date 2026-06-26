import Flag from "./Flag";
import { COLORS, FONTS } from "../lib/ui";
import type { ComparisonRow } from "../lib/groupStage";

type ComparisonRowsProps = {
  rows: ComparisonRow[];
  // When the group is not finalized, outcomes are provisional: render neutral
  // rather than scoring each row as right/wrong.
  pending?: boolean;
};

function teamCell(team: string | null, muted: boolean) {
  return (
    <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      {team ? <Flag team={team} size={20} /> : <span style={{ width: 20, height: 20, flexShrink: 0 }} />}
      <span
        style={{
          fontSize: 13,
          fontWeight: muted ? 500 : 600,
          color: muted ? COLORS.subtle : COLORS.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {team ?? "—"}
      </span>
    </span>
  );
}

export default function ComparisonRows({ rows, pending = false }: ComparisonRowsProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          fontSize: 9.5,
          letterSpacing: "0.07em",
          color: COLORS.faint3,
          fontWeight: 700,
          textTransform: "uppercase",
          padding: "0 8px 6px",
        }}
      >
        <span style={{ width: 18 }} />
        <span style={{ flex: 1 }}>{pending ? "Provisional" : "Actual"}</span>
        <span style={{ flex: 1 }}>Their pick</span>
        <span style={{ width: 20 }} />
      </div>
      {rows.map((row) => {
        const okColor = row.ok ? COLORS.green : COLORS.redText;
        const rowBg = pending
          ? "transparent"
          : row.ok
            ? COLORS.greenSoftRow
            : COLORS.redSoftRow;
        return (
          <div
            key={row.pos}
            style={{ display: "flex", alignItems: "center", padding: "7px 8px", borderRadius: 9, background: rowBg }}
          >
            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 12, color: COLORS.faint2, width: 18 }}>
              {row.pos}
            </span>
            {teamCell(row.actualTeam, false)}
            {teamCell(row.predictedTeam, true)}
            <span style={{ width: 20, textAlign: "center", fontWeight: 800, fontSize: 13, color: pending ? COLORS.faint3 : okColor }}>
              {pending ? "·" : row.ok ? "✓" : "✕"}
            </span>
          </div>
        );
      })}
    </>
  );
}
