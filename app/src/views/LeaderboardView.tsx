import Avatar from "../components/Avatar";
import { COLORS, FONTS, CARD_SHADOW } from "../lib/ui";
import type { EntryProgressRow, LeaderboardRow } from "../types/leaderboard";

type LeaderboardViewProps = {
  rows: LeaderboardRow[];
  entriesById: Map<string, EntryProgressRow>;
  currentUserId?: string;
  onSelectEntry: (entryId: string) => void;
};

const PODIUM_STYLE: Record<number, { step: string; ring: string; h: number }> = {
  1: { step: "linear-gradient(180deg,#ECA93B,#CE8A1B)", ring: "#D9931F", h: 94 },
  2: { step: "linear-gradient(180deg,#C8D0CB,#9FA8A2)", ring: "#B4BBB5", h: 72 },
  3: { step: "linear-gradient(180deg,#D29C65,#AE7740)", ring: "#BC8550", h: 58 },
};

export default function LeaderboardView({
  rows,
  entriesById,
  currentUserId,
  onSelectEntry,
}: LeaderboardViewProps) {
  const leaderTotal = rows[0]?.totalPoints || 1;

  const podium = [
    { row: rows[1], place: 2 },
    { row: rows[0], place: 1 },
    { row: rows[2], place: 3 },
  ].filter((slot) => slot.row);

  return (
    <div data-screen-label="Leaderboard">
      {/* Podium */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 10,
          marginBottom: 26,
          paddingTop: 6,
        }}
      >
        {podium.map(({ row, place }) => {
          const style = PODIUM_STYLE[place];
          return (
            <div
              key={row.id}
              style={{ flex: 1, maxWidth: 150, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div style={{ position: "relative", marginBottom: 10 }}>
                <Avatar
                  id={row.id}
                  displayName={row.displayName}
                  size={62}
                  fontSize={24}
                  ring={style.ring}
                  shadow="0 6px 16px rgba(20,40,30,0.14)"
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONTS.mono,
                    fontWeight: 700,
                    fontSize: 11,
                    color: "#fff",
                    background: style.ring,
                    border: "2px solid #FBF4E6",
                  }}
                >
                  {place}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectEntry(row.id)}
                title={`View ${row.displayName}`}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 13,
                  color: COLORS.ink,
                  textAlign: "center",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.displayName}
              </button>
              <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 15, color: COLORS.green, marginTop: 1 }}>
                {row.totalPoints.toLocaleString()}
              </div>
              <div
                style={{
                  width: "100%",
                  height: style.h,
                  marginTop: 9,
                  borderRadius: "14px 14px 0 0",
                  background: style.step,
                  boxShadow: "inset 0 2px 6px rgba(255,255,255,0.25)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Standings */}
      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 22, padding: 6, boxShadow: CARD_SHADOW }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "13px 16px 9px",
            fontSize: 10.5,
            letterSpacing: "0.09em",
            color: COLORS.faint,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 56 }}>Rank</span>
          <span style={{ flex: 1 }}>Player</span>
          <span>Points</span>
        </div>

        {rows.map((row, index) => {
          const correct = entriesById.get(row.id)?.groupStage.correctPositions ?? 0;
          const isYou = row.id === currentUserId;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelectEntry(row.id)}
              aria-label={`View ${row.displayName} predictions`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 15,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: FONTS.body,
                background: isYou ? "rgba(232,162,61,0.12)" : "transparent",
              }}
            >
              <div style={{ width: 44, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                  {String(row.rank).padStart(2, "0")}
                </span>
              </div>
              <Avatar id={row.id} displayName={row.displayName} size={40} fontSize={16} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.displayName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 5 }}>
                  <div style={{ flex: 1, height: 5, background: "#F1EBDA", borderRadius: 99, overflow: "hidden", maxWidth: 128 }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: index === 0 ? COLORS.gold : COLORS.green,
                        width: `${Math.round((row.totalPoints / leaderTotal) * 100)}%`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {correct} exact · proj {row.projectedTotalPoints.toLocaleString()}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 18, color: COLORS.ink, lineHeight: 1.1 }}>
                  {row.totalPoints.toLocaleString()}
                </div>
                <div style={{ fontSize: 9.5, color: COLORS.faint, letterSpacing: "0.06em", fontWeight: 600 }}>PTS</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
