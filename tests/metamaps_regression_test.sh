#!/usr/bin/env bash
# Defect regression for MetaFam/Fork-The-World issue #5 "MetaMaps Simple Mapping".
#
# This repository is a static GitHub-Flavored Markdown bounty board; its product
# surface is README.md. The reported defect: the "MetaMaps Simple Mapping
# Bounty" entry shipped as a one-line stub ("The basic version is done...")
# that documents none of issue #5's submission requirements.
#
# This test is intentionally self-contained: it reads README.md directly and
# does NOT depend on scripts/verify-metamaps-bounty.sh, so it still reproduces
# the defect when only the companion test files are retained against the
# untouched product source. It exits non-zero while any requirement is missing
# and exits 0 once the entry documents all of them.
#
# Usage: tests/metamaps_regression_test.sh [path-to-README.md]
# Exit codes:
#   0 - entry documents every issue #5 submission requirement
#   1 - entry present but one or more requirements missing (defect reproduced)
#   2 - README file not found
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README="${1:-$ROOT/README.md}"

if [ ! -f "$README" ]; then
  echo "REGRESSION: README not found: $README" >&2
  exit 2
fi

# Isolate the MetaMaps bounty entry (from its header to the next '### ' header).
entry="$(awk '
  /^### \*\*MetaMaps Simple Mapping Bounty\*\*/{print; found=1; next}
  found && /^### /{exit}
  found{print}
' "$README")"

missing=()
require() {
  local name="$1" pattern="$2"
  if ! printf '%s' "$entry" | grep -qiE "$pattern"; then
    missing+=("$name")
  fi
}

require "black board" "black board"
require "drag & drop sprites" "drag[[:space:]]*&[[:space:]]*drop|drag and drop"
require "change wallpaper" "wallpaper"
require "default shapes" "default shapes"
require "button links to a page" "another page"
require "button opens a popup container" "pop.?up"
require "line connections between pieces" "line|connected"
require "MetaMask login to edit" "MetaMask"

if [ "${#missing[@]}" -ne 0 ]; then
  echo "REGRESSION: README MetaMaps Simple Mapping Bounty entry does not document the issue #5 submission requirements"
  for name in "${missing[@]}"; do
    echo "missing requirement: $name"
  done
  exit 1
fi

echo "REGRESSION: README MetaMaps Simple Mapping Bounty entry documents all issue #5 submission requirements"
exit 0
