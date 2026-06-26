import { playerColor, playerInitial } from "../lib/players";
import { FONTS } from "../lib/ui";

type AvatarProps = {
  id: string;
  displayName: string;
  size: number;
  fontSize?: number;
  ring?: string;
  shadow?: string;
};

// Circular monogram avatar for an entrant, colored deterministically by id.
export default function Avatar({ id, displayName, size, fontSize, ring, shadow }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: playerColor(id),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: FONTS.head,
        fontWeight: 800,
        fontSize: fontSize ?? Math.round(size * 0.4),
        border: ring ? `3px solid ${ring}` : undefined,
        boxShadow: shadow,
      }}
    >
      {playerInitial(displayName)}
    </div>
  );
}
