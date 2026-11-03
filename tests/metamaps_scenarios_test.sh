#!/usr/bin/env bash
# Companion scenario suite for MetaFam/Fork-The-World issue #5
# "MetaMaps Simple Mapping" (bounty board README entry).
#
# Exercises scripts/verify-metamaps-bounty.sh and the README MetaMaps bounty
# entry across the required scenarios:
#   HAPPY_PATH   - shipped README documents every issue #5 requirement
#   NULL_INPUT   - verifier called with no argument
#   EMPTY_INPUT  - empty README file / entry header with no content
#   BOUNDARY     - entry missing exactly one requirement (half-open at 7/8)
#   NEGATIVE     - missing file and non-regular file inputs
#   CONCURRENCY  - many simultaneous verifier runs stay consistent
#   REGRESSION   - the shipped base stub entry does not cover the requirements
#
# Usage: tests/metamaps_scenarios_test.sh   (run from repository root)
# Exit 0 only if every scenario assertion holds.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERIFY="$ROOT/scripts/verify-metamaps-bounty.sh"
README="$ROOT/README.md"

if [ ! -f "$VERIFY" ]; then
  echo "FAIL: verifier not found: $VERIFY" >&2
  exit 2
fi
if [ ! -f "$README" ]; then
  echo "FAIL: README not found: $README" >&2
  exit 2
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0

expect() {
  local desc="$1" expected="$2"
  shift 2
  local rc=0
  "$@" >/dev/null 2>&1 || rc=$?
  if [ "$rc" -eq "$expected" ]; then
    echo "OK: $desc (exit=$rc)"
    pass=$((pass + 1))
  else
    echo "FAIL: $desc (expected exit=$expected, got exit=$rc)" >&2
    fail=$((fail + 1))
  fi
}

full_fixture() {
  cat <<'EOF'
### **MetaMaps Simple Mapping Bounty** $500 [Attack](https://gitcoin.co/issue/MetaFam/Fork-The-World/5/100023426)

-   A **black board** with the ability to **drag & drop sprites** and **change the wallpaper**.
-   A few **default shapes** to start from.
-   Buttons take you to **another page** or open a **pop-up** container.
-   Pieces are visually **connected** by a **line**.
-   Edit the map by logging in with **MetaMask**.

### **Skill Tree - Mapping Web3 Knowledge** $500
EOF
}

base_stub_fixture() {
  cat <<'EOF'
### **MetaMaps Simple Mapping Bounty** $500 [Attack](https://gitcoin.co/issue/MetaFam/Fork-The-World/5/100023426)

-   The basic version is done, which means this bounty now becomes an open raid like MyMeta, and anyone helping upgrade it gains.

### **Skill Tree - Mapping Web3 Knowledge** $500
EOF
}

# --- SCENARIO_HAPPY_PATH -----------------------------------------------------
expect "HAPPY_PATH: shipped README covers all requirements" 0 \
  bash "$VERIFY" "$README"

# --- SCENARIO_NULL_INPUT -----------------------------------------------------
expect "NULL_INPUT: no argument" 2 bash "$VERIFY"
expect "NULL_INPUT: empty-string argument" 2 bash "$VERIFY" ""

# --- SCENARIO_EMPTY_INPUT ----------------------------------------------------
: >"$TMP/empty.md"
expect "EMPTY_INPUT: empty README file" 3 bash "$VERIFY" "$TMP/empty.md"
printf '### **MetaMaps Simple Mapping Bounty** $500\n' >"$TMP/header_only.md"
expect "EMPTY_INPUT: entry header with no content" 3 bash "$VERIFY" "$TMP/header_only.md"

# --- SCENARIO_BOUNDARY_LIMIT -------------------------------------------------
full_fixture >"$TMP/full.md"
base_stub_fixture >"$TMP/base_stub.md"
# 7 of 8 requirements present (missing MetaMask) -> must fail at the boundary.
grep -v 'MetaMask' "$TMP/full.md" >"$TMP/missing_one.md"
expect "BOUNDARY: all requirements present" 0 bash "$VERIFY" "$TMP/full.md"
expect "BOUNDARY: exactly one requirement missing" 1 bash "$VERIFY" "$TMP/missing_one.md"
# Every single requirement missing on the base stub -> first failure exit 1.
expect "BOUNDARY: base stub fails" 1 bash "$VERIFY" "$TMP/base_stub.md"

# --- SCENARIO_NEGATIVE_FAILURE ----------------------------------------------
expect "NEGATIVE: nonexistent file" 2 bash "$VERIFY" "$TMP/does-not-exist.md"
expect "NEGATIVE: directory instead of file" 2 bash "$VERIFY" "$TMP"

# --- SCENARIO_CONCURRENCY_RACE ----------------------------------------------
concurrent=8
pids=()
codes_dir="$TMP/codes"
mkdir -p "$codes_dir"
for i in $(seq 1 "$concurrent"); do
  ( bash "$VERIFY" "$README" >/dev/null 2>&1; echo "$?" >"$codes_dir/$i" ) &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  wait "$pid"
done
conc_ok=1
for i in $(seq 1 "$concurrent"); do
  if [ "$(cat "$codes_dir/$i")" != "0" ]; then
    conc_ok=0
  fi
done
if [ "$conc_ok" -eq 1 ]; then
  echo "OK: CONCURRENCY: $concurrent parallel verifier runs all exit 0"
  pass=$((pass + 1))
else
  echo "FAIL: CONCURRENCY: parallel verifier runs disagreed" >&2
  fail=$((fail + 1))
fi

# --- SCENARIO_DEFECT_REGRESSION ---------------------------------------------
# The defect state shipped in the bounty board: the MetaMaps entry only says
# "The basic version is done…". The verifier must reject that entry.
expect "REGRESSION: base stub entry reproduced as failing" 1 \
  bash "$VERIFY" "$TMP/base_stub.md"

echo "----------------------------------------"
echo "scenarios: $pass passed, $fail failed"
if [ "$fail" -ne 0 ]; then
  echo "RESULT: FAIL" >&2
  exit 1
fi
echo "RESULT: PASS"
exit 0
