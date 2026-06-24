from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "generated" / "leaderboard.json"
DEST_DIR = ROOT / "app" / "public" / "data"
DEST = DEST_DIR / "leaderboard.json"


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing generated leaderboard file: {SOURCE}")

    DEST_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, DEST)
    print(f"Copied {SOURCE} -> {DEST}")


if __name__ == "__main__":
    main()
