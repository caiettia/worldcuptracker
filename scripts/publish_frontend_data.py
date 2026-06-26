from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEST_DIR = ROOT / "app" / "public" / "data"
BRACKETS_SOURCE_DIR = ROOT / "brackets"
BRACKETS_DEST_DIR = ROOT / "app" / "public" / "brackets"

DATA_FILES = {
    ROOT / "data" / "generated" / "leaderboard.json": DEST_DIR / "leaderboard.json",
    ROOT / "data" / "generated" / "entry-progress.json": DEST_DIR / "entry-progress.json",
    ROOT / "data" / "actual-results.json": DEST_DIR / "actual-results.json",
    ROOT / "data" / "brackets.json": DEST_DIR / "brackets.json",
}


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    for source, destination in DATA_FILES.items():
        if not source.exists():
            raise FileNotFoundError(f"Missing frontend data file: {source}")

        shutil.copy2(source, destination)
        print(f"Copied {source} -> {destination}")

    if not BRACKETS_SOURCE_DIR.exists():
        raise FileNotFoundError(f"Missing bracket image directory: {BRACKETS_SOURCE_DIR}")

    if BRACKETS_DEST_DIR.exists():
        shutil.rmtree(BRACKETS_DEST_DIR)

    shutil.copytree(BRACKETS_SOURCE_DIR, BRACKETS_DEST_DIR)
    print(f"Copied {BRACKETS_SOURCE_DIR} -> {BRACKETS_DEST_DIR}")


if __name__ == "__main__":
    main()
