import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import ComparisonRows from "../components/ComparisonRows";
import Flag from "../components/Flag";
import { groupForPlayer, groupKeys } from "../lib/groupStage";
import { SCORING } from "../lib/scoring";
import { COLORS, FONTS, CARD_SHADOW, CARD_SHADOW_SM, HEADER_SHADOW, sectionLabel } from "../lib/ui";
import type {
  ActualResultsPayload,
  BracketsPayload,
  EntryProgressPayload,
} from "../types/leaderboard";

type GroupsViewProps = {
  actualResults: ActualResultsPayload;
  brackets: BracketsPayload;
  entryProgress: EntryProgressPayload;
  focusPlayerId?: string;
};

const subBase: React.CSSProperties = {
  flex: 1,
  border: "none",
  cursor: "pointer",
  fontFamily: FONTS.body,
  fontWeight: 600,
  fontSize: 12.5,
  padding: "8px 0",
  borderRadius: 999,
};

const perfectBadge = (
  <span
    style={{
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: "0.04em",
      color: COLORS.goldText,
      background: COLORS.goldSoft,
      padding: "3px 7px",
      borderRadius: 6,
    }}
  >
    ★ PERFECT
  </span>
);

function ptsPill(label: string) {
  return (
    <span
      style={{
        fontFamily: FONTS.mono,
        fontWeight: 700,
        fontSize: 12,
        color: COLORS.green,
        background: COLORS.greenSoft,
        padding: "4px 9px",
        borderRadius: 8,
      }}
    >
      {label}
    </span>
  );
}

export default function GroupsView({ actualResults, brackets, entryProgress, focusPlayerId }: GroupsViewProps) {
  const keys = groupKeys(actualResults);
  const players = entryProgress.entries;
  const bracketById = new Map(brackets.entries.map((e) => [e.id, e]));

  const firstFinalized = keys.find((k) => actualResults.groupStage.groups[k]?.finalized) ?? keys[0] ?? "A";

  const [tab, setTab] = useState<"byGroup" | "byPlayer">(focusPlayerId ? "byPlayer" : "byGroup");
  const [groupId, setGroupId] = useState(firstFinalized);
  const [playerId, setPlayerId] = useState(focusPlayerId ?? players[0]?.id ?? "");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (focusPlayerId) {
      setTab("byPlayer");
      setPlayerId(focusPlayerId);
    }
  }, [focusPlayerId]);

  const groupTabs: Array<{ key: "byGroup" | "byPlayer"; label: string }> = [
    { key: "byGroup", label: "By group" },
    { key: "byPlayer", label: "By player" },
  ];

  return (
    <div data-screen-label="Group Stage">
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 5,
          background: "#fff",
          border: `1px solid ${COLORS.line}`,
          borderRadius: 999,
          marginBottom: 20,
          maxWidth: 320,
        }}
      >
        {groupTabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{ ...subBase, background: active ? COLORS.green : "transparent", color: active ? "#fff" : "#7A857C" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "byGroup" ? (
        <ByGroup
          keys={keys}
          groupId={groupId}
          setGroupId={setGroupId}
          actualResults={actualResults}
          players={players}
          bracketById={bracketById}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      ) : (
        <ByPlayer
          keys={keys}
          players={players}
          playerId={playerId}
          setPlayerId={setPlayerId}
          actualResults={actualResults}
          bracketById={bracketById}
        />
      )}
    </div>
  );
}

type ByGroupProps = {
  keys: string[];
  groupId: string;
  setGroupId: (id: string) => void;
  actualResults: ActualResultsPayload;
  players: EntryProgressPayload["entries"];
  bracketById: Map<string, BracketsPayload["entries"][number]>;
  expanded: Record<string, boolean>;
  setExpanded: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
};

function ByGroup({ keys, groupId, setGroupId, actualResults, players, bracketById, expanded, setExpanded }: ByGroupProps) {
  const actualGroup = actualResults.groupStage.groups[groupId];
  const standings = actualGroup?.standings ?? [];
  const finalized = actualGroup?.finalized ?? false;

  const scoreboard = players
    .map((player) => ({
      player,
      data: groupForPlayer(groupId, actualResults, bracketById.get(player.id), player),
    }))
    .sort((a, b) => (b.data.points ?? b.data.exact) - (a.data.points ?? a.data.exact));

  return (
    <div>
      <div className="wct-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0 12px", marginBottom: 16 }}>
        {keys.map((key) => {
          const active = key === groupId;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setGroupId(key)}
              style={{
                minWidth: 44,
                height: 44,
                borderRadius: 14,
                border: active ? "1px solid transparent" : `1px solid ${COLORS.lineHard}`,
                fontFamily: FONTS.head,
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                flexShrink: 0,
                background: active ? COLORS.green : "#fff",
                color: active ? "#fff" : COLORS.ink,
                boxShadow: active ? "0 4px 12px rgba(14,110,66,0.28)" : undefined,
              }}
            >
              {key}
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 22, padding: "20px 18px", boxShadow: CARD_SHADOW }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontFamily: FONTS.head, fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", color: COLORS.ink }}>
            Group {groupId}
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: finalized ? COLORS.green : COLORS.faint,
              background: finalized ? "rgba(14,110,66,0.1)" : "rgba(166,172,159,0.14)",
              padding: "5px 11px",
              borderRadius: 999,
              letterSpacing: "0.03em",
            }}
          >
            {finalized ? "Finalized" : "Pending"}
          </span>
        </div>

        <div style={{ ...sectionLabel, marginBottom: 9 }}>{finalized ? "Final standings" : "Provisional standings"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 22 }}>
          {standings.map((team, i) => {
            const advanced = i < 2;
            return (
              <div
                key={team}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 10px",
                  borderRadius: 12,
                  background: advanced ? "rgba(14,110,66,0.05)" : "transparent",
                }}
              >
                <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 13, color: COLORS.faint2, width: 14 }}>{i + 1}</span>
                <Flag team={team} size={26} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{team}</span>
                {advanced ? (
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em", color: COLORS.goldText, background: COLORS.goldSoft, padding: "3px 7px", borderRadius: 6 }}>
                    ADV
                  </span>
                ) : null}
              </div>
            );
          })}
          {standings.length === 0 ? <div style={{ fontSize: 13, color: COLORS.muted, padding: "4px 10px" }}>Awaiting standings</div> : null}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11 }}>
          <div style={sectionLabel}>How everyone scored</div>
          <div style={{ fontSize: 10.5, color: COLORS.faint3, fontWeight: 500 }}>
            +{SCORING.groupStage.correctPositionPerTeam} exact · +{SCORING.groupStage.perfectGroupBonus} perfect
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {scoreboard.map(({ player, data }, i) => {
            const key = `${groupId}-${player.id}`;
            const isOpen = !!expanded[key];
            return (
              <div key={player.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 14, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "11px 12px",
                    background: COLORS.fieldBg,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FONTS.body,
                  }}
                >
                  <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 13, color: COLORS.faint2, width: 14 }}>{i + 1}</span>
                  <Avatar id={player.id} displayName={player.displayName} size={32} fontSize={13} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: COLORS.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {player.displayName}
                  </span>
                  {data.perfect ? perfectBadge : null}
                  <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>
                    {data.exact}/{data.rows.length} exact
                  </span>
                  {ptsPill(data.points === null ? "Pending" : `${data.points} pts`)}
                  <span style={{ color: COLORS.faint3, fontSize: 11, width: 12 }}>{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen ? (
                  <div style={{ padding: "6px 12px 12px", background: "#fff" }}>
                    <ComparisonRows rows={data.rows} pending={!data.finalized} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ByPlayerProps = {
  keys: string[];
  players: EntryProgressPayload["entries"];
  playerId: string;
  setPlayerId: (id: string) => void;
  actualResults: ActualResultsPayload;
  bracketById: Map<string, BracketsPayload["entries"][number]>;
};

function ByPlayer({ keys, players, playerId, setPlayerId, actualResults, bracketById }: ByPlayerProps) {
  const player = players.find((p) => p.id === playerId) ?? players[0];
  if (!player) {
    return null;
  }

  const groups = keys.map((key) => groupForPlayer(key, actualResults, bracketById.get(player.id), player));

  return (
    <div>
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
          marginBottom: 14,
          boxShadow: HEADER_SHADOW,
        }}
      >
        <Avatar id={player.id} displayName={player.displayName} size={46} fontSize={19} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.head, fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", color: COLORS.ink }}>{player.displayName}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>Group-stage breakdown</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 20, color: COLORS.green }}>
            {player.groupStage.points.toLocaleString()}
          </div>
          <div style={{ fontSize: 9.5, color: COLORS.faint, letterSpacing: "0.06em", fontWeight: 600 }}>GROUP PTS</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {groups.map((g) => (
          <div key={g.groupId} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 14, boxShadow: CARD_SHADOW_SM }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: FONTS.head, fontWeight: 800, fontSize: 16, color: COLORS.ink }}>Group {g.groupId}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {g.perfect ? perfectBadge : null}
                {ptsPill(g.points === null ? "Pending" : `${g.points} pts`)}
              </span>
            </div>
            <ComparisonRows rows={g.rows} pending={!g.finalized} />
          </div>
        ))}
      </div>
    </div>
  );
}
