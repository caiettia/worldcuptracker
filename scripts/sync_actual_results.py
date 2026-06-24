from __future__ import annotations

import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from worldcup_tracker.results_sync import run_sync_from_env


def main() -> None:
    output_path = Path("data/actual-results.json")
    document = run_sync_from_env(os.environ, output_path)
    print(
        json.dumps(
            {
                "provider": document["metadata"]["provider"],
                "asOf": document["metadata"]["asOf"],
                "outputPath": str(output_path),
            }
        )
    )


if __name__ == "__main__":
    main()
