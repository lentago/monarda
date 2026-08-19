#!/usr/bin/env python3
"""Check that relative links between markdown files resolve to real files.

Vendored from lentago/shared-workflows so this template carries no cross-org
CI dependency (fleet decision 2026-08-19, "inline for kits, pin for fleet").
Scans every markdown file in the repo (not just the PR diff) so that a rename
or deletion elsewhere in the tree is still caught.
"""

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

REPO_ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {".git", "node_modules", "dist"}

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def find_markdown_files():
    for path in REPO_ROOT.rglob("*.md"):
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue
        yield path


def is_relative_link(target: str) -> bool:
    if not target or target.startswith("#"):
        return False
    if target.startswith("//"):
        return False
    if target.startswith("mailto:"):
        return False
    return not urlsplit(target).scheme


def check_file(md_file: Path):
    errors = []
    text = md_file.read_text(encoding="utf-8")
    for match in LINK_RE.finditer(text):
        target = match.group(1).strip()
        if target.startswith("<") and target.endswith(">"):
            target = target[1:-1]
        # Drop an optional link title: [text](path "title")
        target = target.split(" ", 1)[0]
        if not is_relative_link(target):
            continue
        path_part, _, _fragment = target.partition("#")
        if not path_part:
            continue  # pure-anchor link; already excluded above, but be safe
        if path_part.startswith("/"):
            resolved = REPO_ROOT / path_part.lstrip("/")
        else:
            resolved = (md_file.parent / path_part).resolve()
        if not resolved.exists():
            errors.append(f"{md_file.relative_to(REPO_ROOT)}: broken link -> {target}")
    return errors


def main():
    all_errors = []
    for md_file in sorted(find_markdown_files()):
        all_errors.extend(check_file(md_file))

    if all_errors:
        print("Broken relative links found:\n")
        for error in all_errors:
            print(f"  {error}")
        print(f"\n{len(all_errors)} broken link(s).")
        return 1

    print("All relative markdown links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
