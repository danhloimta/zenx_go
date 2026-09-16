# Game subdomain bootstrap

Game subdomains are data-driven. A new game created in Command Hub does not
need a new Nginx vhost, service, or deploy when wildcard host infrastructure is
already present.

## One-time infrastructure setup

1. Point `BASE_DOMAIN` and `*.BASE_DOMAIN` DNS records at the same ingress.
2. Issue a wildcard TLS certificate with DNS-01 and keep its full-chain/key on
   the production server.
3. Set production environment values: `PUBLIC_BASE_DOMAIN`,
   `PUBLIC_WEB_ORIGIN`, `COOKIE_DOMAIN`, `COOKIE_SECURE=true`, and
   `ALLOW_GAME_SUBDOMAINS=true`.
4. On the server, run the safe provisioning step:

   ```bash
   BASE_DOMAIN=zenxgo.io.vn \
   TLS_CERT_PATH=/etc/letsencrypt/live/zenxgo.io.vn/fullchain.pem \
   TLS_KEY_PATH=/etc/letsencrypt/live/zenxgo.io.vn/privkey.pem \
   bash /opt/zenx-go/scripts/provision-server.sh --apply
   ```

The provisioner writes the Nginx wildcard vhost and the two systemd unit files,
validates Nginx, enables the services, and reloads Nginx. It does not modify
DNS, obtain certificates, create games, or start application services.

## Per-game setup

1. In Command Hub create the game and choose a lowercase unique subdomain.
2. Assign a `GAME_ADMIN`, Content Manager, or Player Moderator as needed.
3. Configure the exact SSO callback and create/rotate the game SSO secret.
4. Store the one-time secret in the game server secret manager.
5. Publish the game only when its public site is ready.
6. Verify routing:

   ```bash
   bash scripts/verify-game-host.sh --domain zenxgo.io.vn --subdomain orion --expect-public
   ```

`/admin` uses the same game host as the public site. It is available for a
known draft game, while public routes require the game to be published.
