#!/usr/bin/env bash
# Regression test for MetaFam/Fork-The-World issue #5 "MetaMaps Simple Mapping".
#
# This repository is a static GitHub-Flavored Markdown bounty board; its product
# content is README.md. Issue #5 requires the MetaMaps bounty to describe a
# black board with drag & drop sprites, wallpaper change, default shapes,
# button pieces (link to another page or open a popup container), line
# connections between pieces, and MetaMask login to edit the map.
#
# This script isolates the "MetaMaps Simple Mapping Bounty" entry in the
# supplied README and asserts it documents every submission requirement from
# issue #5. Exit non-zero if any requirement is missing (defect reproduced).
#
# Usage: verify-metamaps-bounty.sh <path-to-README.md>
# Exit codes:
#   0 - all requirements documented (happy path)
#   1 - entry present but one or more requirements missing (boundary/regression)
#   2 - null/negative input: no argument, missing or non-regular file, or bad usage
#   3 - empty input: empty README or no MetaMaps entry found
set -euo pipefail

if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "FAIL: null input - missing README argument (usage: verify-metamaps-bounty.sh <path-to-README.md>)" >&2
  exit 2
fi

README="$1"

if [ ! -e "$README" ]; then
  echo "FAIL: negative input - README not found: $README" >&2
  exit 2
fi
if [ ! -f "$README" ]; then
  echo "FAIL: negative input - README is not a regular file: $README" >&2
  exit 2
fi
if [ ! -s "$README" ]; then
  echo "FAIL: empty input - README is empty: $README" >&2
  exit 3
fi

# Isolate the MetaMaps bounty entry (from its header to the next '### ' header).
entry=$(awk '
  /^### \*\*MetaMaps Simple Mapping Bounty\*\*/{print; found=1; next}
  found && /^### /{exit}
  found{print}
' "$README")

if [ -z "$entry" ]; then
  echo "FAIL: empty input - no '\''MetaMaps Simple Mapping Bounty'\'' entry in $README" >&2
  exit 3
fi

# The entry must carry content beyond its header line, otherwise the bounty is
# effectively an empty submission and is rejected as empty input.
body="$(printf '%s\n' "$entry" | sed '1d' || true)"
if [ -z "$(printf '%s' "$body" | tr -d '[:space:]')" ]; then
  echo "FAIL: empty input - MetaMaps entry has no content in $README" >&2
  exit 3
fi

fail=0
check() {
  local name="$1" pattern="$2"
  if printf '%s' "$entry" | grep -qiE "$pattern"; then
    echo "OK: $name"
  else
    echo "FAIL: missing requirement '$name' (pattern: $pattern)" >&2
    fail=1
  fi
}

check "black board" "black board"
check "drag and drop sprites" "drag[[:space:]]*&[[:space:]]*drop|drag and drop"
check "change wallpaper" "wallpaper"
check "default shapes" "default shapes"
check "button links to a page" "another page"
check "button opens a popup container" "pop.?up"
check "line connections between pieces" "line|connected"
check "MetaMask login to edit" "MetaMask"

if [ "$fail" -ne 0 ]; then
  echo "RESULT: FAIL - MetaMaps bounty entry does not cover issue #5 requirements" >&2
  exit 1
fi
echo "RESULT: PASS - MetaMaps bounty entry covers issue #5 submission requirements"
exit 0
