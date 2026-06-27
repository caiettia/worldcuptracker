import Flag from "./Flag";
import { COLORS, FONTS } from "../lib/ui";
import type { ThirdPlaceCallRow } from "../lib/thirdPlace";

type ThirdPlaceCallTableProps = {
  rows: ThirdPlaceCallRow[];
};

function statusBadge(adv: boolean) {
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.05em",
        padding: "3px 8px",
        borderRadius: 6,
        color: adv ? COLORS.green : COLORS.faint2,
        background: adv ? "rgba(14,110,66,0.12)" : "rgba(120,128,118,0.12)",
      }}
    >
      {adv ? "ADV" : "OUT"}
    </span>
  );
}

// Confusion-matrix view of an entrant's best-third calls: for every team in play,
// what the tournament did (Actual) against what they backed (Their call).
export default function ThirdPlaceCallTable({ rows }: ThirdPlaceCallTableProps) {
  if (rows.length === 0) {
    return <div style={{ fontSize: 13, color: COLORS.muted, padding: "4px 8px" }}>No third-place picks recorded.</div>;
  }

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
        <span style={{ flex: 1 }}>Team</span>
        <span style={{ width: 52, textAlign: "center" }}>Actual</span>
        <span style={{ width: 60, textAlign: "center" }}>Their call</span>
        <span style={{ width: 20 }} />
      </div>
      {rows.map((row, i) => {
        const okColor = row.ok ? COLORS.green : COLORS.redText;
        const rowBg = row.ok ? COLORS.greenSoftRow : COLORS.redSoftRow;
        return (
          <div
            key={row.team}
            style={{ display: "flex", alignItems: "center", padding: "7px 8px", borderRadius: 9, background: rowBg }}
          >
            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 12, color: COLORS.faint2, width: 18 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Flag team={row.team} size={20} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.team}
              </span>
            </span>
            <span style={{ width: 52, display: "flex", justifyContent: "center" }}>{statusBadge(row.actualAdv)}</span>
            <span style={{ width: 60, display: "flex", justifyContent: "center" }}>{statusBadge(row.pickedAdv)}</span>
            <span style={{ width: 20, textAlign: "center", fontWeight: 800, fontSize: 13, color: okColor }}>
              {row.ok ? "✓" : "✕"}
            </span>
          </div>
        );
      })}
    </>
  );
}
