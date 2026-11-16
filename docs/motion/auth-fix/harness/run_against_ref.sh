#!/usr/bin/env bash
# Build any branch/commit of themiddleman-web in a throwaway worktree and run the auth-slide suite against it.
# Usage: run_against_ref.sh <git-ref> [port] [outdir]
#   e.g. run_against_ref.sh origin/design/ui8-dark
# Env: REPO (default /workspace/middleman), ENV_FILE (stub .env.local, default /workspace/wt-auth/.env.local; fake values only),
#      KEEP_WORKTREE=1 to keep the build tree; EXPECT=links-only (default; links-slide|tabs-slide are deprecated aliases).
# The product no longer ships a Log in / Create account tab bar; only the inline links below the form switch modes.
set -euo pipefail
REF=${1:?git ref}; PORT=${2:-3480}
REPO=${REPO:-/workspace/middleman}; ENV_FILE=${ENV_FILE:-/workspace/wt-auth/.env.local}
HERE=$(cd "$(dirname "$0")" && pwd)
git -C "$REPO" fetch -q origin || true
SHA=$(git -C "$REPO" rev-parse --short "$REF")
OUT=${3:-$HERE/../runs/$SHA-${EXPECT:-links-only}}
WT=/tmp/mm-suite-$SHA
export COREPACK_HOME=/tmp/corepack; mkdir -p "$COREPACK_HOME"
[ -d "$WT" ] || git -C "$REPO" worktree add -q --detach "$WT" "$SHA"
cp "$ENV_FILE" "$WT/.env.local"
cd "$WT"
pnpm install --frozen-lockfile >"$WT/.suite-install.log" 2>&1
pnpm lint >"$WT/.suite-lint.log" 2>&1 && echo "lint: ok ($(grep -o '[0-9]* errors, [0-9]* warnings' "$WT/.suite-lint.log" | tail -1))" || echo "lint: FAILED (see $WT/.suite-lint.log)"
pnpm build >"$WT/.suite-build.log" 2>&1 && echo "build: ok" || { echo "build: FAILED (see $WT/.suite-build.log)"; exit 1; }
setsid pnpm start -p "$PORT" >"$WT/.suite-server.log" 2>&1 &
PGID=$!
trap 'kill -- -$PGID 2>/dev/null || true; [ "${KEEP_WORKTREE:-0}" = 1 ] || git -C "$REPO" worktree remove --force "$WT"' EXIT
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/signup?mode=signin" && break; sleep 1; done
python3 "$HERE/authslide_suite.py" --base "http://localhost:$PORT" --out "$OUT" --label "$REF @ $SHA" --expect "${EXPECT:-links-only}"
python3 "$HERE/contrast_probe.py" --base "http://localhost:$PORT" --out "$OUT/contrast.json" >"$OUT/contrast.log" 2>&1 \
  && echo "contrast: $OUT/contrast.json" || echo "contrast: FAILED (see $OUT/contrast.log)"
echo "results: $OUT/SUMMARY.md"
