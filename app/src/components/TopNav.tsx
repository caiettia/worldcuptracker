type TopNavProps = {
  activeView: "leaderboard" | "bracket";
  onNavigate: (view: "leaderboard" | "bracket") => void;
};

export default function TopNav({ activeView, onNavigate }: TopNavProps) {
  return (
    <nav className="top-nav">
      <div className="top-nav__brand">World Cup Tracker</div>
      <div className="top-nav__links">
        <button
          className={activeView === "leaderboard" ? "is-active" : undefined}
          type="button"
          onClick={() => onNavigate("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={activeView === "bracket" ? "is-active" : undefined}
          type="button"
          onClick={() => onNavigate("bracket")}
        >
          Bracket
        </button>
      </div>
    </nav>
  );
}
