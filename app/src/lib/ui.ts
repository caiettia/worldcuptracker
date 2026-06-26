// Design tokens lifted from the Claude Design "World Cup Tracker" file
// (design files/UI Redesign/World Cup Tracker.dc.html).

export const COLORS = {
  green: "#0E6E42",
  greenDark: "#0A5733",
  greenSoft: "rgba(14,110,66,0.09)",
  greenSoftRow: "rgba(14,110,66,0.06)",
  gold: "#E8A23D",
  goldText: "#C9831F",
  goldSoft: "rgba(232,162,61,0.16)",
  red: "#D83A36",
  redText: "#C9402F",
  redSoftRow: "rgba(216,58,54,0.045)",
  ink: "#16241C",
  subtle: "#56615A",
  muted: "#8A938B",
  faint: "#A6AC9F",
  faint2: "#9AA39B",
  faint3: "#B0B6A8",
  line: "#EFE7D6",
  lineSoft: "#EEE6D5",
  lineHard: "#EAE2D1",
  fieldBg: "#FCFAF4",
} as const;

export const FONTS = {
  head: "'Bricolage Grotesque',system-ui,sans-serif",
  body: "'Plus Jakarta Sans',system-ui,sans-serif",
  mono: "'Space Mono',ui-monospace,monospace",
} as const;

export const CARD_SHADOW = "0 12px 34px rgba(20,40,30,0.055)";
export const CARD_SHADOW_SM = "0 6px 18px rgba(20,40,30,0.04)";
export const HEADER_SHADOW = "0 10px 28px rgba(20,40,30,0.05)";

export const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 22,
  boxShadow: CARD_SHADOW,
};

export const sectionLabel: React.CSSProperties = {
  fontSize: 10.5,
  letterSpacing: "0.09em",
  color: COLORS.faint,
  fontWeight: 700,
  textTransform: "uppercase",
};
