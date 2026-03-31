#!/bin/bash
# Chaos Cycle Runner — Orchestrates 1000 iterations of test-fix-deploy cycles
#
# Usage: bash e2e/run-chaos-cycle.sh [start_iteration] [end_iteration]
# Example: bash e2e/run-chaos-cycle.sh 1 1000

set -euo pipefail

START=${1:-1}
END=${2:-1000}
RESULTS_DIR="e2e/chaos-results"
STAGING_URL="https://lemon-wave-0a1790b0f.6.azurestaticapps.net"
API_URL="https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io"

mkdir -p "$RESULTS_DIR"

echo "=== CHAOS CYCLE: iterations $START to $END ==="
echo "Staging: $STAGING_URL"
echo "API: $API_URL"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
FIX_COUNT=0

for i in $(seq "$START" "$END"); do
  echo ""
  echo "============================================"
  echo "  ITERATION $i / $END"
  echo "============================================"
  echo ""

  LOG_FILE="$RESULTS_DIR/iteration-$i.log"

  ITERATION=$i BASE_URL=$STAGING_URL API_URL=$API_URL \
    npx --prefix e2e playwright test chaos-cycle \
    --project=chromium-desktop \
    --reporter=list \
    2>&1 | tee "$LOG_FILE"

  EXIT_CODE=${PIPESTATUS[0]}

  if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✓ Iteration $i PASSED"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ✗ Iteration $i FAILED — see $LOG_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))

    # Signal that a fix is needed (will be handled by the orchestrator/Claude)
    echo "FAIL" > "$RESULTS_DIR/iteration-$i.status"
    echo ""
    echo "  >>> FIX NEEDED — stopping for manual intervention <<<"
    echo "  After fixing, commit, push, wait for deploy, then re-run from iteration $i"
    echo ""
    echo "  Resume command:"
    echo "    bash e2e/run-chaos-cycle.sh $i $END"
    echo ""

    # Write summary so far
    echo "Iterations: $START-$i / $END" > "$RESULTS_DIR/summary.txt"
    echo "Passed: $PASS_COUNT" >> "$RESULTS_DIR/summary.txt"
    echo "Failed: $FAIL_COUNT" >> "$RESULTS_DIR/summary.txt"
    echo "Fixed: $FIX_COUNT" >> "$RESULTS_DIR/summary.txt"

    exit 1
  fi

  echo "PASS" > "$RESULTS_DIR/iteration-$i.status"
done

echo ""
echo "============================================"
echo "  ALL ITERATIONS COMPLETE"
echo "============================================"
echo "  Total: $((END - START + 1))"
echo "  Passed: $PASS_COUNT"
echo "  Failed: $FAIL_COUNT"

echo "Total: $((END - START + 1))" > "$RESULTS_DIR/summary.txt"
echo "Passed: $PASS_COUNT" >> "$RESULTS_DIR/summary.txt"
echo "Failed: $FAIL_COUNT" >> "$RESULTS_DIR/summary.txt"
