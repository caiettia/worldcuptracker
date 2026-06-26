import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import Flag from "../components/Flag";
import { knockoutRounds, totalMatches, type KnockoutMatch } from "../lib/knockout";
import { SCORING } from "../lib/scoring";
import { COLORS, FONTS, CARD_SHADOW_SM, HEADER_SHADOW } from "../lib/ui";
import type { BracketsPayload, EntryProgressPayload } from "../types/leaderboard";

type BracketViewProps = {
  brackets: BracketsPayload;
  entryProgress: EntryProgressPayload;
  focusPlayerId?: string;
};

function MatchCard({ match }: { match: KnockoutMatch }) {
  const okIcon = match.status === "correct" ? "✓" : match.status === "wrong" ? "✕" : "·";
  const okColor = match.status === "correct" ? "#1E9E5A" : match.status === "wrong" ? "#D86560" : COLORS.faint3;
  const note =
    match.status === "correct"
      ? "Pick advanced"
      : match.status === "wrong"
        ? `Picked ${match.winnerName ?? "—"}`
        : "Awaiting result";

  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 9, boxShadow: CARD_SHADOW_SM }}>
      {match.teams.map((team) => (
        <div
          key={team.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 7px",
            borderRadius: 9,
            background: team.advanced ? COLORS.greenSoft : "transparent",
          }}
        >
          <Flag team={team.name} size={22} />
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: team.advanced ? 700 : 500,
              color: team.advanced ? COLORS.green : COLORS.faint2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {team.name}
          </span>
          {team.advanced ? (
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.05em", color: COLORS.green }}>ADV</span>
          ) : null}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, padding: "0 7px" }}>
        <span style={{ fontWeight: 800, fontSize: 12, color: okColor }}>{okIcon}</span>
        <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>{note}</span>
      </div>
    </div>
  );
}

export default function BracketView({ brackets, entryProgress, focusPlayerId }: BracketViewProps) {
  const progressById = useMemo(
    () => new Map(entryProgress.entries.map((e) => [e.id, e])),
    [entryProgress],
  );
  const players = brackets.entries.filter((e) => progressById.has(e.id));

  const [playerId, setPlayerId] = useState(focusPlayerId ?? players[0]?.id ?? "");
  useEffect(() => {
    if (focusPlayerId) {
      setPlayerId(focusPlayerId);
    }
  }, [focusPlayerId]);

  const bracketEntry = players.find((p) => p.id === playerId) ?? players[0];
  const progress = bracketEntry ? progressById.get(bracketEntry.id) : undefined;
  if (!bracketEntry || !progress) {
    return null;
  }

  const rounds = knockoutRounds(bracketEntry, progress);
  const matchCount = totalMatches(rounds);
  const champ = progress.knockout.champion;
  const championTeam = champ.predictedTeam;
  const championStatus: "pending" | "correct" | "wrong" =
    champ.actualTeam === null ? "pending" : champ.correct ? "correct" : "wrong";

  return (
    <div data-screen-label="Bracket">
      <div className="wct-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0 12px", marginBottom: 16 }}>
        {players.map((p) => {
          const active = p.id === playerId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlayerId(p.id)}
              style={{
                borderRadius: 999,
                padding: "8px 15px",
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: active ? COLORS.green : "#fff",
                color: active ? "#fff" : "#46524A",
                border: `1px solid ${active ? COLORS.green : COLORS.lineHard}`,
              }}
            >
              {p.displayName}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          background: "#fff",
          border: `1px solid ${COLORS.line}`,
          borderRadius: 18,
          padding: "14px 16px",
          marginBottom: 18,
          boxShadow: HEADER_SHADOW,
        }}
      >
        <Avatar id={bracketEntry.id} displayName={bracketEntry.displayName} size={46} fontSize={19} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.head, fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", color: COLORS.ink }}>{bracketEntry.displayName}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>{matchCount} knockout matches</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 20, color: COLORS.green }}>{progress.knockout.points.toLocaleString()}</div>
          <div style={{ fontSize: 9.5, color: COLORS.faint, letterSpacing: "0.06em", fontWeight: 600 }}>KO PTS</div>
        </div>
      </div>

      {rounds.map((round) => (
        <div key={round.name} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11, padding: "0 2px" }}>
            <h3 style={{ margin: 0, fontFamily: FONTS.head, fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", color: COLORS.ink }}>{round.name}</h3>
            <span style={{ fontSize: 10.5, color: COLORS.faint3, fontWeight: 600 }}>
              {round.pointsEarned > 0 ? `${round.pointsEarned} pts · ` : ""}+{round.pointsPerMatch} / match
            </span>
          </div>

          {round.matches.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.muted, padding: "0 2px" }}>No picks submitted.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          background: "linear-gradient(135deg,#0E6E42,#0A5733)",
          borderRadius: 18,
          padding: "18px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 14px 32px rgba(14,110,66,0.28)",
        }}
      >
        {championTeam ? (
          <span style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #E8A23D", display: "block" }}>
            <Flag team={championTeam} size={42} />
          </span>
        ) : (
          <span style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, border: "3px solid #E8A23D", background: "rgba(255,255,255,0.12)" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "#E8C98C", fontWeight: 700, textTransform: "uppercase" }}>
            Champion · {championTeam ?? "No pick"}
          </div>
          <div style={{ fontFamily: FONTS.head, fontWeight: 800, fontSize: 18, color: "#fff", marginTop: 2 }}>
            {championStatus === "correct"
              ? `You called it · +${SCORING.knockout.champion}`
              : championStatus === "wrong"
                ? `Actual: ${champ.actualTeam}`
                : `Awaiting final · +${SCORING.knockout.champion} if correct`}
          </div>
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: championStatus === "wrong" ? "#F0B5B2" : "#E8C98C" }}>
          {championStatus === "correct" ? "✓" : championStatus === "wrong" ? "✕" : "·"}
        </span>
      </div>
    </div>
  );
}
