import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import Flag from "../components/Flag";
import { SCORING } from "../lib/scoring";
import { COLORS, FONTS, CARD_SHADOW_SM, HEADER_SHADOW } from "../lib/ui";
import type {
  BracketsPayload,
  EntryProgressPayload,
  EntryProgressRow,
  KnockoutRoundBreakdown,
} from "../types/leaderboard";

type BracketViewProps = {
  brackets: BracketsPayload;
  entryProgress: EntryProgressPayload;
  focusPlayerId?: string;
};

type RoundSpec = {
  name: string;
  perTeam: number;
  predictedTeams: string[];
  breakdown: KnockoutRoundBreakdown;
};

// Each round shows the teams an entrant predicted to *reach* that round, scored
// against the teams that actually got there (see scoring.py ROUND_SPECS).
function roundsFor(
  bracketEntry: BracketsPayload["entries"][number],
  progress: EntryProgressRow,
): RoundSpec[] {
  return [
    { name: "Round of 16", perTeam: SCORING.knockout.roundOf16, predictedTeams: bracketEntry.knockout.roundOf32Winners, breakdown: progress.knockout.roundOf16 },
    { name: "Quarterfinals", perTeam: SCORING.knockout.quarterfinal, predictedTeams: bracketEntry.knockout.roundOf16Winners, breakdown: progress.knockout.quarterfinal },
    { name: "Semifinals", perTeam: SCORING.knockout.semifinal, predictedTeams: bracketEntry.knockout.quarterfinalWinners, breakdown: progress.knockout.semifinal },
    { name: "Final", perTeam: SCORING.knockout.final, predictedTeams: bracketEntry.knockout.semifinalWinners, breakdown: progress.knockout.final },
  ];
}

type TeamStatus = "pending" | "correct" | "wrong";

function teamStatus(team: string, breakdown: KnockoutRoundBreakdown): TeamStatus {
  if (breakdown.actualKnownCount === 0) {
    return "pending";
  }
  return breakdown.correctTeams.includes(team) ? "correct" : "wrong";
}

export default function BracketView({ brackets, entryProgress, focusPlayerId }: BracketViewProps) {
  const progressById = new Map(entryProgress.entries.map((e) => [e.id, e]));
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

  const rounds = roundsFor(bracketEntry, progress);
  const totalPicks = rounds.reduce((sum, r) => sum + r.predictedTeams.length, 0);
  const champ = progress.knockout.champion;
  const championTeam = champ.predictedTeam;
  const championStatus: TeamStatus = champ.actualTeam === null ? "pending" : champ.correct ? "correct" : "wrong";

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
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>{totalPicks} knockout picks</div>
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
              {round.breakdown.points > 0 ? `${round.breakdown.points} pts · ` : ""}+{round.perTeam}/team
            </span>
          </div>

          {round.predictedTeams.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.muted, padding: "0 2px" }}>No picks submitted.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
              {round.predictedTeams.map((team) => {
                const status = teamStatus(team, round.breakdown);
                const accent = status === "correct" ? COLORS.green : status === "wrong" ? COLORS.red : COLORS.faint3;
                const note =
                  status === "correct" ? `Advanced +${round.perTeam}` : status === "wrong" ? "Eliminated" : "Awaiting result";
                return (
                  <div key={team} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 9, boxShadow: CARD_SHADOW_SM }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 7px",
                        borderRadius: 9,
                        background: status === "correct" ? COLORS.greenSoft : "transparent",
                      }}
                    >
                      <Flag team={team} size={22} />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: status === "wrong" ? 500 : 700,
                          color: status === "correct" ? COLORS.green : status === "wrong" ? COLORS.faint2 : COLORS.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {team}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, padding: "0 7px" }}>
                      <span style={{ fontWeight: 800, fontSize: 12, color: accent }}>
                        {status === "correct" ? "✓" : status === "wrong" ? "✕" : "·"}
                      </span>
                      <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>{note}</span>
                    </div>
                  </div>
                );
              })}
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
