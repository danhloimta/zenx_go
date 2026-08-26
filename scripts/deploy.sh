#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEPLOY_HOST="${DEPLOY_HOST:-root@103.116.105.26}"
readonly DEPLOY_DIR="${DEPLOY_DIR:-/opt/zenx-go}"
readonly DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
readonly DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
readonly HEALTH_URL="${HEALTH_URL:-https://zenxgo.io.vn}"
readonly NODE_BIN_DIR="${NODE_BIN_DIR:-/root/.nvm/versions/node/v22.22.1/bin}"
readonly LOCAL_LOCK="${TMPDIR:-/tmp}/zenx-go-deploy.lock"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\nDeploy failed: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  rmdir "$LOCAL_LOCK" 2>/dev/null || true
}
trap cleanup EXIT

mkdir "$LOCAL_LOCK" 2>/dev/null || fail "Another local deploy is already running."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v git >/dev/null || fail "git is not installed."
command -v pnpm >/dev/null || fail "pnpm is not installed."
command -v rsync >/dev/null || fail "rsync is not installed."
command -v ssh >/dev/null || fail "ssh is not installed."

current_branch="$(git branch --show-current)"
[[ "$current_branch" == "$DEPLOY_BRANCH" ]] || fail "Current branch is '$current_branch'; switch to '$DEPLOY_BRANCH' first."
[[ -z "$(git status --porcelain)" ]] || fail "Working tree is not clean. Commit or stash changes first."

log "Checking SSH and the production directory"
ssh -o BatchMode=yes "$DEPLOY_HOST" "test -d '$DEPLOY_DIR' && test -f '$DEPLOY_DIR/.env' && test -f '$DEPLOY_DIR/apps/api/.env'"

log "Pulling $DEPLOY_REMOTE/$DEPLOY_BRANCH"
git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
git pull --ff-only "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
readonly DEPLOY_COMMIT="$(git rev-parse --short=12 HEAD)"

log "Running local quality gates for $DEPLOY_COMMIT"
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
if [[ "${SKIP_TESTS:-0}" != "1" ]]; then
  pnpm test
fi
pnpm build

log "Syncing source to $DEPLOY_HOST:$DEPLOY_DIR"
rsync -az --delete \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='apps/api/.env' \
  --exclude='apps/web/.env.local' \
  --exclude='node_modules/' \
  --exclude='.pnpm-store/' \
  --exclude='.turbo/' \
  --exclude='apps/api/dist/' \
  --exclude='apps/web/.next/' \
  --exclude='apps/web/.next-dev/' \
  --exclude='apps/web/.next-e2e/' \
  --exclude='apps/web/.next-release/' \
  --exclude='uploads/' \
  --exclude='coverage/' \
  --exclude='playwright-report/' \
  --exclude='test-results/' \
  ./ "$DEPLOY_HOST:$DEPLOY_DIR/"

log "Installing, building, migrating, and restarting production"
ssh "$DEPLOY_HOST" bash -s -- "$DEPLOY_DIR" "$NODE_BIN_DIR" "$DEPLOY_COMMIT" <<'REMOTE'
set -Eeuo pipefail

deploy_dir="$1"
node_bin_dir="$2"
deploy_commit="$3"
lock_file=/run/lock/zenx-go-deploy.lock

exec 9>"$lock_file"
flock -n 9 || { echo "Another server deploy is already running." >&2; exit 1; }

export PATH="$node_bin_dir:$PATH"
export COREPACK_HOME=/root/.cache/node/corepack
export NODE_OPTIONS=--max-old-space-size=1400

cd "$deploy_dir"
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
pnpm --filter api prisma:deploy

systemctl restart zenxgo-api.service
systemctl restart zenxgo-web.service

for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:4100/api/v1/support/faqs >/dev/null \
    && curl -fsS http://127.0.0.1:3100/ >/dev/null; then
    printf '%s\n' "$deploy_commit" > "$deploy_dir/.deployed-commit"
    echo "Production services are healthy."
    exit 0
  fi
  sleep 2
done

systemctl --no-pager --full status zenxgo-api.service zenxgo-web.service || true
journalctl -u zenxgo-api.service -u zenxgo-web.service -n 100 --no-pager || true
exit 1
REMOTE

log "Checking the public domain"
curl --fail --silent --show-error --retry 5 --retry-delay 2 --output /dev/null "$HEALTH_URL/"
curl --fail --silent --show-error --retry 5 --retry-delay 2 --output /dev/null "$HEALTH_URL/api/v1/support/faqs"

log "Deploy completed successfully: $DEPLOY_COMMIT"
