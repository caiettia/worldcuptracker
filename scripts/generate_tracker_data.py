from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from worldcup_tracker.scoring import write_tracker_outputs


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate leaderboard and per-entry progress JSON for the World Cup tracker."
    )
    parser.add_argument(
        "--brackets",
        default="data/brackets.json",
        help="Path to parsed bracket predictions JSON.",
    )
    parser.add_argument(
        "--results",
        default="data/actual-results.json",
        help="Path to actual tournament results JSON.",
    )
    parser.add_argument(
        "--scoring",
        default="data/scoring-system.json",
        help="Path to scoring rules JSON.",
    )
    parser.add_argument(
        "--out",
        default="data/generated",
        help="Directory where generated JSON files should be written.",
    )
    parser.add_argument(
        "--generated-at",
        default=None,
        help="Optional stable timestamp to write into generated metadata.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    outputs = write_tracker_outputs(
        brackets_path=Path(args.brackets),
        actual_results_path=Path(args.results),
        scoring_rules_path=Path(args.scoring),
        output_dir=Path(args.out),
        generated_at=args.generated_at,
    )
    print(
        json.dumps(
            {
                "leaderboardPath": str(Path(args.out) / "leaderboard.json"),
                "entryProgressPath": str(Path(args.out) / "entry-progress.json"),
                "entrants": outputs["leaderboard"]["metadata"]["entrants"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
