# ZENX GO

ZENX GO Phase 1 is a TypeScript account portal and ZENX Coin wallet.

## Product planning

The UI-first Game Hub MVP and multi-game subdomain expansion plan is documented in [docs/game-hub/README.md](docs/game-hub/README.md).

## Local setup

Requirements: Node.js 22.13+, Corepack/pnpm 10+, and Docker.

```bash
cp .env.example .env
corepack enable
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.test.example apps/api/.env.test
docker compose up -d sqlserver
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter web exec playwright install chromium
pnpm dev
```

The web app runs at `http://localhost:3000`, the API at `http://localhost:4000`, and Swagger at `http://localhost:4000/docs`. With the default local domain configuration, game hosts are available at `http://lucdia.localhost:3000`, `http://hoalong.localhost:3000`, `http://thitranmay.localhost:3000`, and `http://orion.localhost:3000`; `/preview/games/[slug]` is available when wildcard DNS is not. Browser E2E runs the API on port `4300` against the isolated test database.

Production domain routing uses `PUBLIC_BASE_DOMAIN`, `PUBLIC_WEB_ORIGIN`, `ALLOWED_WEB_ORIGINS`, `ALLOW_GAME_SUBDOMAINS`, and `COOKIE_DOMAIN`. Configure wildcard DNS/TLS and route `/api/v1` on every public hostname to the same API before enabling cross-subdomain login.

The default OTP and payment implementations are mocks. The mock OTP provider logs a development code and the mock payment provider exposes deterministic callback data for local development.

To enable SePay VietQR, set `PAYMENT_PROVIDER=sepay`, then fill `SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_HOLDER`, and `SEPAY_WEBHOOK_SECRET` in `.env`. In both SePay Test and Live settings, configure the payment-code structure as alphanumeric with the same 2–5 character prefix as `SEPAY_TRANSFER_PREFIX` and an exact 12-character suffix. SePay should POST signed callbacks to `/api/v1/webhooks/sepay`; the webhook endpoint requires the HMAC-SHA256 headers documented by SePay.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Integration and browser tests use the isolated `zenx_go_test` database:

```bash
pnpm test:integration
pnpm test:e2e
```

Both commands prepare and reset only the `_test` database. Test scripts refuse any database URL that does not end in `_test`.
