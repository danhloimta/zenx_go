#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  cat <<'EOF'
Verify a ZENX GO game subdomain.

Usage:
  bash scripts/verify-game-host.sh --domain zenxgo.io.vn --subdomain orion [--expect-public] [--insecure]

Checks DNS/TLS/proxy routing through the public host, confirms that the game is
known to the API, and verifies the game-admin rewrite. --expect-public also
requires the public game home to return HTTP 200.
EOF
}

fail() {
  printf 'Verification failed: %s\n' "$*" >&2
  exit 1
}

domain=''
subdomain=''
expect_public=0
insecure=0

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --domain) domain="${2:-}"; shift 2 ;;
    --subdomain) subdomain="${2:-}"; shift 2 ;;
    --expect-public) expect_public=1; shift ;;
    --insecure) insecure=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) usage; fail "Unknown option: $1" ;;
  esac
done

[[ "$domain" =~ ^[A-Za-z0-9.-]+$ && "$domain" == *.* ]] || fail '--domain must be a hostname.'
[[ "$subdomain" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || fail '--subdomain must be a lowercase DNS label.'

curl_args=(--fail --silent --show-error --location --max-time 15 --output /dev/null --write-out '%{http_code}')
[[ "$insecure" == '1' ]] && curl_args+=(--insecure)

check_200() {
  local label="$1" url="$2" status
  status="$(curl "${curl_args[@]}" "$url")" || fail "$label is unreachable: $url"
  [[ "$status" == '200' ]] || fail "$label returned HTTP $status: $url"
  printf 'OK  %s\n' "$label"
}

host="${subdomain}.${domain}"
check_200 'root portal' "https://${domain}/"
check_200 'known game API route' "https://${host}/api/v1/games/admin-by-subdomain/${subdomain}"
check_200 'game admin rewrite' "https://${host}/admin"
if [[ "$expect_public" == '1' ]]; then
  check_200 'public game home' "https://${host}/"
fi

printf 'Verified %s.\n' "$host"
