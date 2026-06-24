export default function TopNav() {
  return (
    <nav className="top-nav">
      <div className="top-nav__brand">World Cup Tracker</div>
      <div className="top-nav__links">
        <a className="is-active" href="#">
          Leaderboard
        </a>
        <a href="#">Bracket</a>
        <a href="#">Dashboard</a>
        <a href="#">Live</a>
      </div>
    </nav>
  );
}
