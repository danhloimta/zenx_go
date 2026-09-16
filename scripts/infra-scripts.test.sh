#!/usr/bin/env bash

set -Eeuo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$root_dir/scripts/provision-server.sh" --help | grep -Fq 'Provision ZENX GO host integration'
BASE_DOMAIN=zenxgo.io.vn bash "$root_dir/scripts/provision-server.sh" --dry-run | grep -Fq 'Dry run.'
bash "$root_dir/scripts/verify-game-host.sh" --help | grep -Fq 'Verify a ZENX GO game subdomain'
grep -Fq 'server_name {{BASE_DOMAIN}} *.{{BASE_DOMAIN}};' "$root_dir/deploy/nginx/zenx-go.conf.template"
grep -Fq 'ExecStart={{NODE_BIN_DIR}}/node {{DEPLOY_DIR}}/apps/api/dist/src/main.js' "$root_dir/deploy/systemd/zenxgo-api.service.template"
