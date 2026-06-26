import type { ActualResultsPayload, BracketEntry, EntryProgressRow } from "../types/leaderboard";

type EntryDetailViewProps = {
  actualResults: ActualResultsPayload;
  bracketEntry: BracketEntry;
  entryProgress: EntryProgressRow;
  onBack: () => void;
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
      {teams.map((team) => (
        <li key={team}>{team}</li>
      ))}
    </ol>
  );
}

export default function EntryDetailView({
  actualResults,
  bracketEntry,
  entryProgress,
  onBack,
}: EntryDetailViewProps) {
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
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          Back to Leaderboard
        </button>
      </div>

      <div className="group-cards">
        {groupKeys(actualResults, bracketEntry).map((groupKey) => {
          const actualGroup = actualResults.groupStage.groups[groupKey];
          const predictedStandings = bracketEntry.groupStage.groups[groupKey] ?? [];
          const points = entryProgress.groupStage.pointsByGroup[groupKey] ?? 0;
          const isPerfect = entryProgress.groupStage.perfectGroups.includes(groupKey);

          return (
            <article className="group-card" key={groupKey}>
              <div className="group-card__header">
                <div>
                  <p className="eyebrow">Group {groupKey}</p>
                  <h2>Group {groupKey}</h2>
                </div>
                <div className="group-card__score">
                  <span>Group Points: {points}</span>
                  {isPerfect ? <span className="group-card__bonus">Perfect group bonus</span> : null}
                </div>
              </div>

              <div className="group-card__columns">
                <section className="group-card__column">
                  <h3>Actual Outcome</h3>
                  {renderStandings(actualGroup?.standings ?? [], "Awaiting finalized standings")}
                </section>
                <section className="group-card__column">
                  <h3>Your Prediction</h3>
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
