import type { ActualResultsPayload, BracketEntry, EntryProgressRow } from "../types/leaderboard";
import { getCountryFlagSrc } from "../lib/countryFlags";

type EntryDetailViewProps = {
  actualResults: ActualResultsPayload;
  bracketEntry: BracketEntry;
  entryProgress: EntryProgressRow;
  allEntries: EntryProgressRow[];
  onBack: () => void;
  onSelectEntry: (entryId: string) => void;
};

function groupKeys(actualResults: ActualResultsPayload, bracketEntry: BracketEntry): string[] {
  return Array.from(
    new Set([
      ...Object.keys(actualResults.groupStage.groups),
      ...Object.keys(bracketEntry.groupStage.groups),
    ]),
  ).sort();
}

function renderStandings(teams: string[], emptyLabel: string) {
  if (teams.length === 0) {
    return <p className="group-card__empty">{emptyLabel}</p>;
  }

  return (
    <ol className="group-card__list">
      {teams.map((team) => {
        const flagSrc = getCountryFlagSrc(team);

        return (
          <li className="group-card__team" key={team}>
            <span className="group-card__team-row">
              {flagSrc ? (
                <span className="group-card__flag-avatar">
                  <img alt={`${team} flag`} className="group-card__flag-image" src={flagSrc} />
                </span>
              ) : null}
              <span>{team}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function EntryDetailView({
  actualResults,
  bracketEntry,
  entryProgress,
  allEntries,
  onBack,
  onSelectEntry,
}: EntryDetailViewProps) {
  const groupStagePoints = entryProgress.groupStage.points;

  return (
    <section className="detail-view">
      <div className="detail-view__header">
        <div>
          <p className="eyebrow">Entrant Breakdown</p>
          <h1>{entryProgress.displayName} Group Stage</h1>
          <p className="detail-view__copy">
            Actual outcomes are shown side by side with the submitted predictions and the points earned
            for each finalized group.
          </p>
          <p className="detail-view__points-summary">
            Group Stage Points: <strong>{groupStagePoints.toLocaleString()}</strong>
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          Back to Leaderboard
        </button>
      </div>

      <div className="player-switcher" role="group" aria-label="Switch player">
        {allEntries.map((entry) => (
          <button
            key={entry.id}
            className={`player-switcher__pill${entry.id === entryProgress.id ? " player-switcher__pill--active" : ""}`}
            type="button"
            onClick={() => onSelectEntry(entry.id)}
            aria-current={entry.id === entryProgress.id ? "true" : undefined}
          >
            {entry.displayName}
          </button>
        ))}
      </div>

      <div className="group-cards">
        {groupKeys(actualResults, bracketEntry).map((groupKey) => {
          const actualGroup = actualResults.groupStage.groups[groupKey];
          const predictedStandings = bracketEntry.groupStage.groups[groupKey] ?? [];
          const points = entryProgress.groupStage.pointsByGroup[groupKey] ?? 0;
          const isPerfect = entryProgress.groupStage.perfectGroups.includes(groupKey);
          const isFinalized = actualGroup?.finalized ?? false;

          return (
            <article className="group-card" key={groupKey}>
              <div className="group-card__header">
                <div>
                  <p className="eyebrow">Group {groupKey}</p>
                  <h2>Group {groupKey}</h2>
                </div>
                <div className="group-card__score">
                  <span>Group Points: {points}</span>
                  <span
                    className={`group-card__status ${
                      isFinalized ? "group-card__status--finalized" : "group-card__status--pending"
                    }`}
                  >
                    {isFinalized ? "Finalized" : "Pending"}
                  </span>
                  {isPerfect ? <span className="group-card__bonus">Perfect group bonus</span> : null}
                </div>
              </div>

              <div className="group-card__columns">
                <section className="group-card__column">
                  <h3>Actual Outcome</h3>
                  {renderStandings(actualGroup?.standings ?? [], "Awaiting finalized standings")}
                </section>
                <section className="group-card__column">
                  <h3>{entryProgress.displayName}'s Prediction</h3>
                  {renderStandings(predictedStandings, "No prediction submitted")}
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
