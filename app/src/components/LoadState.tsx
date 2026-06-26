import { COLORS, FONTS, card } from "../lib/ui";

type LoadStateProps = {
  title: string;
  message: string;
};

export default function LoadState({ title, message }: LoadStateProps) {
  return (
    <section
      aria-live="polite"
      style={{
        ...card,
        padding: "40px 24px",
        textAlign: "center",
        maxWidth: 420,
        margin: "48px auto 0",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10.5,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: COLORS.faint,
        }}
      >
        {title}
      </p>
      <h2
        style={{
          margin: "10px 0 0",
          fontFamily: FONTS.head,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "-0.01em",
          color: COLORS.ink,
        }}
      >
        {message}
      </h2>
    </section>
  );
}
