// Deterministic per-entrant avatar colors. The six known entrants are pinned to
// the exact hues from the Claude Design source; any other id falls back to a
// stable hash-derived hue so new entrants still get a distinct color.

const PINNED_COLORS: Record<string, string> = {
  nfry: "oklch(0.60 0.14 145)",
  shreyas: "oklch(0.60 0.15 25)",
  liz: "oklch(0.64 0.15 70)",
  chit: "oklch(0.60 0.13 200)",
  dinkelberg: "oklch(0.56 0.13 285)",
  heathernr24: "oklch(0.63 0.15 340)",
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function playerColor(id: string): string {
  if (PINNED_COLORS[id]) {
    return PINNED_COLORS[id];
  }
  const hue = hash(id) % 360;
  return `oklch(0.60 0.14 ${hue})`;
}

export function playerInitial(displayName: string): string {
  const trimmed = displayName.trim();
  return (trimmed[0] ?? "?").toUpperCase();
}
