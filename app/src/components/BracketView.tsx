import type { BracketEntry } from "../types/leaderboard";

type BracketViewProps = {
  entries: BracketEntry[];
  selectedEntryId: string;
  onSelectEntry: (entryId: string) => void;
};

export default function BracketView({
  entries,
  selectedEntryId,
  onSelectEntry,
}: BracketViewProps) {
  const selectedEntry =
    entries.find((entry) => entry.id === selectedEntryId) ??
    entries[0] ??
    null;

  if (!selectedEntry) {
    return null;
  }

  return (
    <section className="detail-view">
      <div className="detail-view__header detail-view__header--stacked">
        <div>
          <p className="eyebrow">Bracket Picks</p>
          <h1>Bracket Picks</h1>
          <p className="detail-view__copy">
            Choose an entrant to review the original group stage sheet and knockout bracket images.
          </p>
        </div>
        <label className="entry-selector" htmlFor="bracket-entry-selector">
          <span>Choose a player</span>
          <select
            id="bracket-entry-selector"
            value={selectedEntry.id}
            onChange={(event) => onSelectEntry(event.target.value)}
          >
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bracket-gallery">
        <div className="bracket-gallery__intro">
          <h2>{selectedEntry.displayName} Submission</h2>
        </div>
        <article className="bracket-panel">
          <h3>Group Stage Sheet</h3>
          <img
            className="bracket-image"
            src={selectedEntry.sourceImages.groupStage}
            alt={`${selectedEntry.displayName} group stage bracket`}
          />
        </article>
        <article className="bracket-panel">
          <h3>Knockout Bracket</h3>
          <img
            className="bracket-image"
            src={selectedEntry.sourceImages.knockouts}
            alt={`${selectedEntry.displayName} knockout bracket`}
          />
        </article>
      </div>
    </section>
  );
}
