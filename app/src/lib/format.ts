export function formatAsOfLabel(value: string | null): string {
  if (!value) {
    return "Awaiting tournament results";
  }

  return new Date(value).toLocaleString();
}

export function formatProgressLabel(groupsFinalized: number, championKnown: boolean): string {
  if (championKnown) {
    return "Tournament complete";
  }

  if (groupsFinalized === 0) {
    return "Predictions locked in, results pending";
  }

  return `${groupsFinalized} groups finalized`;
}
