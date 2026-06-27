import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import Flag from "../components/Flag";
import { knockoutRounds, totalMatches, type KnockoutMatch, type KnockoutRound } from "../lib/knockout";
import { SCORING } from "../lib/scoring";
import { COLORS, FONTS, HEADER_SHADOW } from "../lib/ui";
import type { BracketsPayload, EntryProgressPayload } from "../types/leaderboard";

type BracketViewProps = {
  brackets: BracketsPayload;
  entryProgress: EntryProgressPayload;
  focusPlayerId?: string;
};

const KO_SHORT: Record<string, string> = {
  "Round of 16": "R16",
  Quarterfinals: "QF",
  Semifinals: "SF",
  Final: "Final",
};

function MatchCard({ match, pointsPerMatch }: { match: KnockoutMatch; pointsPerMatch: number }) {
  const okIcon = match.status === "correct" ? "✓" : match.status === "wrong" ? "✕" : "·";
  const statusColor = match.status === "correct" ? COLORS.green : match.status === "wrong" ? "#C0473C" : COLORS.faint3;
  const statusBg =
    match.status === "correct"
      ? "rgba(14,110,66,0.07)"
      : match.status === "wrong"
        ? "rgba(216,58,54,0.06)"
        : "rgba(166,172,159,0.08)";
  const note =
    match.status === "correct"
      ? `Correct +${pointsPerMatch}`
      : match.status === "wrong"
        ? `Picked ${match.winnerName ?? "—"}`
        : "Awaiting result";

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: `1px solid ${COLORS.line}`,
        borderRadius: 13,
        boxShadow: "0 4px 14px rgba(20,40,30,0.05)",
        overflow: "hidden",
      }}
    >
      {match.teams.map((team) => (
        <div
          key={team.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: team.advanced ? "rgba(14,110,66,0.08)" : "#fff",
          }}
        >
          <Flag team={team.name} size={22} />
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: team.advanced ? 700 : 500,
              color: team.advanced ? COLORS.green : COLORS.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {team.name}
          </span>
          {team.advanced ? (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: COLORS.green,
                background: "rgba(14,110,66,0.12)",
                padding: "2px 6px",
                borderRadius: 5,
              }}
            >
              ADV
            </span>
          ) : null}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: statusBg }}>
        <span style={{ fontWeight: 800, fontSize: 11, color: statusColor }}>{okIcon}</span>
        <span style={{ fontSize: 10.5, color: statusColor, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {note}
        </span>
      </div>
    </div>
  );
}

function RoundColumn({
  round,
  index,
  isFinal,
  setColRef,
}: {
  round: KnockoutRound;
  index: number;
  isFinal: boolean;
  setColRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  const pairs: KnockoutMatch[][] = [];
  for (let i = 0; i < round.matches.length; i += 2) {
    pairs.push(round.matches.slice(i, i + 2));
  }

  return (
    <div
      className={index > 0 ? "wct-ko-round has-in" : "wct-ko-round"}
      ref={(el) => setColRef(index, el)}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, padding: "0 6px" }}>
        <h3 style={{ margin: 0, fontFamily: FONTS.head, fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em", color: COLORS.ink }}>
          {round.name}
        </h3>
        <span style={{ fontSize: 10, color: COLORS.faint3, fontWeight: 700 }}>+{round.pointsPerMatch} / match</span>
      </div>
      <div className="wct-ko-col">
        {round.matches.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.muted, padding: "0 6px" }}>No picks submitted.</div>
        ) : (
          pairs.map((pair, pi) => (
            <div key={pi} className={isFinal ? "wct-ko-pair is-final" : "wct-ko-pair"}>
              {pair.map((match) => (
                <div key={match.id} className="wct-ko-slot">
                  <MatchCard match={match} pointsPerMatch={round.pointsPerMatch} />
                </div>
              ))}
              {!isFinal ? <div className="wct-ko-bracket" /> : null}
            </div>
          ))
        )}
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
  const [koRound, setKoRound] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (focusPlayerId) {
      setPlayerId(focusPlayerId);
    }
  }, [focusPlayerId]);

  const setColRef = (index: number, el: HTMLDivElement | null) => {
    colRefs.current[index] = el;
  };

  // Keep the active round step in sync with whichever column is centered.
  const handleScroll = () => {
    const sc = scrollRef.current;
    if (!sc) {
      return;
    }
    const rect = sc.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    colRefs.current.forEach((col, i) => {
      if (!col) {
        return;
      }
      const cr = col.getBoundingClientRect();
      const dist = Math.abs(cr.left + cr.width / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setKoRound((prev) => (prev === best ? prev : best));
  };

  const scrollToRound = (i: number) => {
    const sc = scrollRef.current;
    const col = colRefs.current[i];
    if (!sc || !col) {
      return;
    }
    const left =
      sc.scrollLeft + col.getBoundingClientRect().left - sc.getBoundingClientRect().left - (sc.clientWidth - col.offsetWidth) / 2;
    sc.scrollTo({ left, behavior: "smooth" });
  };

  const bracketEntry = players.find((p) => p.id === playerId) ?? players[0];
  const progress = bracketEntry ? progressById.get(bracketEntry.id) : undefined;
  if (!bracketEntry || !progress) {
    return null;
  }

  const rounds = knockoutRounds(bracketEntry, progress);
  const matchCount = totalMatches(rounds);
  const correctCount = rounds.reduce(
    (sum, round) => sum + round.matches.filter((m) => m.status === "correct").length,
    0,
  );
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
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>
            {correctCount}/{matchCount} knockout picks
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 20, color: COLORS.green }}>{progress.knockout.points.toLocaleString()}</div>
          <div style={{ fontSize: 9.5, color: COLORS.faint, letterSpacing: "0.06em", fontWeight: 600 }}>KO PTS</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        {rounds.map((round, i) => {
          const active = i === koRound;
          return (
            <button
              key={round.name}
              type="button"
              onClick={() => scrollToRound(i)}
              style={{
                flex: 1,
                border: active ? "none" : `1px solid ${COLORS.lineHard}`,
                cursor: "pointer",
                fontFamily: FONTS.body,
                fontSize: 12,
                fontWeight: active ? 700 : 600,
                padding: "7px 0",
                borderRadius: 999,
                whiteSpace: "nowrap",
                transition: "all .15s",
                background: active ? COLORS.green : "#fff",
                color: active ? "#fff" : "#7A857C",
                boxShadow: active ? "0 2px 8px rgba(14,110,66,0.28)" : undefined,
              }}
            >
              {KO_SHORT[round.name] ?? round.name}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.faint, fontWeight: 500, margin: "0 2px 14px" }}>
        <span>Swipe across the rounds toward the final</span>
        <span style={{ fontSize: 13 }}>→</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="wct-ko-scroll wct-scroll"
        style={{ margin: "0 -16px 20px", padding: "0 12px" }}
      >
        {rounds.map((round, i) => (
          <RoundColumn
            key={round.name}
            round={round}
            index={i}
            isFinal={i === rounds.length - 1}
            setColRef={setColRef}
          />
        ))}
      </div>

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
