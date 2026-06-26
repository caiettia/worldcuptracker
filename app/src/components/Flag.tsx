import { getCountryFlagSrc } from "../lib/countryFlags";

type FlagProps = {
  team: string;
  size: number;
};

// Circular flag chip. Reuses the local flag SVGs already shipped in /public/flags.
// Falls back to a neutral monogram circle when a country has no local asset.
export default function Flag({ team, size }: FlagProps) {
  const src = getCountryFlagSrc(team);

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    display: "block",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  };

  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={{
          ...base,
          background: "#E7E0CF",
          color: "#8A938B",
          fontSize: Math.round(size * 0.42),
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {(team.trim()[0] ?? "?").toUpperCase()}
      </span>
    );
  }

  return (
    <span style={base}>
      <img
        src={src}
        alt={`${team} flag`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </span>
  );
}
