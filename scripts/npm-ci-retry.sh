#!/usr/bin/env bash
set -u

LOG_FILE="${1:-npm-ci.log}"
MAX_ATTEMPTS="${NPM_CI_MAX_ATTEMPTS:-3}"

: > "$LOG_FILE"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "npm ci attempt ${attempt}/${MAX_ATTEMPTS}" | tee -a "$LOG_FILE"

  set +e
  npm ci 2>&1 | tee -a "$LOG_FILE"
  status=${PIPESTATUS[0]}
  set -e

  if [ "$status" -eq 0 ]; then
    exit 0
  fi

  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "npm ci failed after ${MAX_ATTEMPTS} attempts" | tee -a "$LOG_FILE"
    exit "$status"
  fi

  # npm ci is designed for a clean tree, but a failed network/cache operation can
  # leave a partial node_modules directory. Remove it before the next strict run.
  rm -rf node_modules
  sleep $((attempt * 5))
done
