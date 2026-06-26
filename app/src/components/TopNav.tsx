type TopNavProps = {
  activeView: "leaderboard" | "group-stage" | "bracket";
  onNavigate: (view: "leaderboard" | "group-stage" | "bracket") => void;
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
          className={activeView === "group-stage" ? "is-active" : undefined}
          type="button"
          onClick={() => onNavigate("group-stage")}
        >
          Group Stage
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
