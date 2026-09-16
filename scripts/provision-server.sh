#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Provision ZENX GO host integration.

This script installs Nginx and systemd configuration for the root domain and
all first-level game subdomains. It never changes DNS and never requests TLS
certificates; provide an already-issued wildcard certificate.

Required environment variables for --apply:
  BASE_DOMAIN       Example: zenxgo.io.vn
  TLS_CERT_PATH     Full-chain certificate path
  TLS_KEY_PATH      Private key path

Optional environment variables:
  DEPLOY_DIR        Default: /opt/zenx-go
  NODE_BIN_DIR      Default: /root/.nvm/versions/node/v22.22.1/bin
  SERVICE_USER      Default: root
  NGINX_CONF_PATH   Default: /etc/nginx/sites-available/zenx-go.conf
  NGINX_ENABLED_PATH Default: /etc/nginx/sites-enabled/zenx-go.conf

Usage:
  BASE_DOMAIN=zenxgo.io.vn TLS_CERT_PATH=/etc/letsencrypt/live/zenxgo.io.vn/fullchain.pem \
  TLS_KEY_PATH=/etc/letsencrypt/live/zenxgo.io.vn/privkey.pem bash scripts/provision-server.sh --apply

  BASE_DOMAIN=zenxgo.io.vn bash scripts/provision-server.sh --dry-run

Use --dry-run to print the planned operation without changing the server. Run it on the
production server as root after wildcard DNS/TLS are ready, then deploy code.
EOF
}

fail() {
  printf 'Provision failed: %s\n' "$*" >&2
  exit 1
}

escape_sed() {
  printf '%s' "$1" | sed -e 's/[&|\\]/\\&/g'
}

apply=0
case "${1:-}" in
  --apply) apply=1 ;;
  --dry-run) apply=0 ;;
  --help|-h|'') usage; exit 0 ;;
  *) usage; fail "Unknown option: $1" ;;
esac

readonly BASE_DOMAIN="${BASE_DOMAIN:-}"
readonly DEPLOY_DIR="${DEPLOY_DIR:-/opt/zenx-go}"
readonly NODE_BIN_DIR="${NODE_BIN_DIR:-/root/.nvm/versions/node/v22.22.1/bin}"
readonly SERVICE_USER="${SERVICE_USER:-root}"
readonly TLS_CERT_PATH="${TLS_CERT_PATH:-}"
readonly TLS_KEY_PATH="${TLS_KEY_PATH:-}"
readonly NGINX_CONF_PATH="${NGINX_CONF_PATH:-/etc/nginx/sites-available/zenx-go.conf}"
readonly NGINX_ENABLED_PATH="${NGINX_ENABLED_PATH:-/etc/nginx/sites-enabled/zenx-go.conf}"

[[ "$apply" == '1' ]] || {
  printf 'Dry run. Would provision root + wildcard host integration for BASE_DOMAIN=%s.\n' "${BASE_DOMAIN:-<required>}"
  printf 'Run with --apply once BASE_DOMAIN, TLS_CERT_PATH and TLS_KEY_PATH are set.\n'
  exit 0
}

[[ "$(id -u)" == '0' ]] || fail 'Run --apply as root.'
[[ "$BASE_DOMAIN" =~ ^[A-Za-z0-9.-]+$ && "$BASE_DOMAIN" == *.* ]] || fail 'BASE_DOMAIN must be a hostname.'
[[ -f "$TLS_CERT_PATH" ]] || fail 'TLS_CERT_PATH must point to an existing certificate.'
[[ -f "$TLS_KEY_PATH" ]] || fail 'TLS_KEY_PATH must point to an existing private key.'
[[ -x "$NODE_BIN_DIR/node" ]] || fail 'NODE_BIN_DIR/node is not executable.'
[[ -d "$DEPLOY_DIR" ]] || fail 'DEPLOY_DIR does not exist; deploy the repository first.'
command -v nginx >/dev/null || fail 'nginx is not installed.'
command -v systemctl >/dev/null || fail 'systemctl is not installed.'
id "$SERVICE_USER" >/dev/null 2>&1 || fail 'SERVICE_USER does not exist.'

readonly NGINX_TEMPLATE="$ROOT_DIR/deploy/nginx/zenx-go.conf.template"
readonly API_TEMPLATE="$ROOT_DIR/deploy/systemd/zenxgo-api.service.template"
readonly WEB_TEMPLATE="$ROOT_DIR/deploy/systemd/zenxgo-web.service.template"
[[ -f "$NGINX_TEMPLATE" && -f "$API_TEMPLATE" && -f "$WEB_TEMPLATE" ]] || fail 'Provision templates are missing.'

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

render() {
  local template="$1" destination="$2"
  sed \
    -e "s|{{BASE_DOMAIN}}|$(escape_sed "$BASE_DOMAIN")|g" \
    -e "s|{{DEPLOY_DIR}}|$(escape_sed "$DEPLOY_DIR")|g" \
    -e "s|{{NODE_BIN_DIR}}|$(escape_sed "$NODE_BIN_DIR")|g" \
    -e "s|{{SERVICE_USER}}|$(escape_sed "$SERVICE_USER")|g" \
    -e "s|{{TLS_CERT_PATH}}|$(escape_sed "$TLS_CERT_PATH")|g" \
    -e "s|{{TLS_KEY_PATH}}|$(escape_sed "$TLS_KEY_PATH")|g" \
    "$template" > "$destination"
}

render "$NGINX_TEMPLATE" "$tmp_dir/zenx-go.conf"
render "$API_TEMPLATE" "$tmp_dir/zenxgo-api.service"
render "$WEB_TEMPLATE" "$tmp_dir/zenxgo-web.service"

install -d "$(dirname "$NGINX_CONF_PATH")" "$(dirname "$NGINX_ENABLED_PATH")"
install -m 0644 "$tmp_dir/zenx-go.conf" "$NGINX_CONF_PATH"
ln -sfn "$NGINX_CONF_PATH" "$NGINX_ENABLED_PATH"
install -m 0644 "$tmp_dir/zenxgo-api.service" /etc/systemd/system/zenxgo-api.service
install -m 0644 "$tmp_dir/zenxgo-web.service" /etc/systemd/system/zenxgo-web.service

nginx -t
systemctl daemon-reload
systemctl enable zenxgo-api.service zenxgo-web.service
systemctl reload nginx

printf 'Provisioned wildcard host integration for %s and *.%s.\n' "$BASE_DOMAIN" "$BASE_DOMAIN"
printf 'Services were enabled but not started; run the normal deploy script next.\n'
