# ZENX GO

ZENX GO Phase 1 is a TypeScript account portal and ZENX Coin wallet.

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

The web app runs at `http://localhost:3000`, the API at `http://localhost:4000`, and Swagger at `http://localhost:4000/docs`. Browser E2E runs the API on port `4100` against the isolated test database.

The default OTP and payment implementations are mocks. The mock OTP provider logs a development code and the mock payment provider exposes deterministic callback data for local development.

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
