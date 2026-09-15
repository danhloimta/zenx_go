# Admin Auth Settings Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authorized administrators independently enable or disable Google and Facebook login/registration, with immediate database-backed enforcement and safe public UI projection.

**Architecture:** Add one SQL Server/Prisma singleton owned by a narrow `AuthSettingsService`. Public/admin HTTP controllers and the existing OAuth controller consume that policy; the shared API client and React Query hooks project it into AdminCP and public auth pages without caching secrets or moving OAuth responsibilities out of `SocialService`.

**Tech Stack:** SQL Server, Prisma 6, NestJS 11, CASL 7, class-validator, Jest/Supertest, Next.js 15, React 19, TanStack Query 5, Playwright, pnpm/Turbo.

**Spec:** `docs/superpowers/specs/2026-09-15-admin-auth-settings-phase1-design.md`

## Global Constraints

- Implement Phase 1 only; keep phases 2–6 held.
- The only persisted settings are singleton `AuthSettings` fields `googleLoginRegistrationEnabled`, `facebookLoginRegistrationEnabled`, and `updatedAt`, with `id = 1`.
- Defaults are `true`/`true`; migrations and development seed may create the singleton, but application runtime must never recreate a missing row.
- Read current database state for every relevant request; add no cache, key/value or JSON settings framework, pub/sub, activity log, or generic configuration abstraction.
- OAuth credentials, secrets, redirect URIs, and provider health remain environment-only and never enter these models, APIs, or screens.
- Enforce only OAuth `mode=login`; preserve `mode=link`, unlink, password login/registration, OTP, DOB, CCCD, wallet, sessions, and credentials.
- Verify callback state before consulting settings, then enforce settings before provider code exchange, profile lookup, login, or user creation.
- Keep API responses under `/api/v1` in the existing `{ data, error }` envelope; public availability responses must set `Cache-Control: no-store`.
- Use exactly `settings.auth.manage` / CASL `manage AuthSettings`; grant it to `SUPER_ADMIN`, not `SUPPORT` by default.
- Execute tasks serially. Only the current task's listed files are writable moving scope; finish its tests and commit before opening the next task.

---

## Baseline Verification (before Task 1)

- [ ] Record the starting revision and clean tree.

Run:

```bash
git rev-parse HEAD
git status --short
```

Expected: revision `80c78057920edf78dc09c1d6f351d972c2fcc22f` (or its accepted descendant) and no implementation changes.

- [ ] Install the locked dependencies if `node_modules` is absent, then run the existing fast gates separately.

Run:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
```

Expected: each command exits `0`. If a baseline command fails, record the exact failure and get a Lead ruling before attributing it to Phase 1.

- [ ] Prepare/reset SQL Server and run the existing integration suite.

Run:

```bash
pnpm test:db:prepare
pnpm test:db:reset
pnpm test:integration
```

Expected: database prepare/reset and every pre-existing integration suite pass before Phase 1 changes.

### Task 1: Persist the singleton and seed its permission

**Files:**
- Create: `apps/api/prisma/migrations/202609150001_auth_settings_phase1/migration.sql`
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/prisma/seed.ts`
- Modify: `apps/api/src/admin/permissions.ts`
- Modify: `apps/api/src/admin/permissions.spec.ts`
- Create: `apps/api/test/integration/auth-settings.integration.spec.ts`

**Interfaces:**
- Consumes: existing Prisma `Permission`, `RolePermission`, `SUPER_ADMIN`, and `SUPPORT` records.
- Produces: Prisma delegate `prisma.authSettings`; singleton row `{ id: 1, googleLoginRegistrationEnabled: boolean, facebookLoginRegistrationEnabled: boolean, updatedAt: Date }`; `PERMISSIONS.AUTH_SETTINGS_MANAGE = { code: 'settings.auth.manage', action: 'manage', subject: 'AuthSettings' }`.

- [ ] **Step 1: Write failing permission and persistence tests.**

Extend `permissions.spec.ts` with an exact registry assertion. Create `auth-settings.integration.spec.ts` using `PrismaClient`, `execFileSync`, and repository root `resolve(__dirname, '../../../..')`; assert that reset/seed leaves row `id=1` enabled/enabled, `SUPER_ADMIN` owns `settings.auth.manage`, `SUPPORT` does not, inserting `id=2` is rejected, and rerunning `pnpm --filter api prisma:seed` after setting both flags false preserves false/false. Restore true/true in `afterAll`.

```ts
expect(PERMISSIONS.AUTH_SETTINGS_MANAGE).toEqual({
  code: 'settings.auth.manage',
  action: 'manage',
  subject: 'AuthSettings',
});

const settings = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });
expect(settings).toMatchObject({
  googleLoginRegistrationEnabled: true,
  facebookLoginRegistrationEnabled: true,
});

await prisma.authSettings.update({
  where: { id: 1 },
  data: { googleLoginRegistrationEnabled: false, facebookLoginRegistrationEnabled: false },
});
execFileSync('pnpm', ['--filter', 'api', 'prisma:seed'], { cwd: repoRoot, env: process.env });
await expect(prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } })).resolves.toMatchObject({
  googleLoginRegistrationEnabled: false,
  facebookLoginRegistrationEnabled: false,
});
```

- [ ] **Step 2: Run the focused tests to verify the contracts do not exist.**

Run:

```bash
pnpm --filter api test -- permissions.spec.ts --runInBand
pnpm --filter api test:integration -- auth-settings.integration.spec.ts
```

Expected: unit compilation fails because `AUTH_SETTINGS_MANAGE` is absent; integration compilation fails because Prisma has no `authSettings` delegate.

- [ ] **Step 3: Add the minimal Prisma model, migration, seed, and registry entry.**

Add this model to `schema.prisma`:

```prisma
model AuthSettings {
  id                                   Int      @id @default(1)
  googleLoginRegistrationEnabled      Boolean  @default(true) @map("google_login_registration_enabled")
  facebookLoginRegistrationEnabled    Boolean  @default(true) @map("facebook_login_registration_enabled")
  updatedAt                            DateTime @updatedAt @map("updated_at")

  @@map("auth_settings")
}
```

The migration must run in the repository's `BEGIN TRY` transaction style and create `[dbo].[auth_settings]` with primary key/default/check constraints, default-true bits, and `updated_at DATETIME2`. Insert row `id=1`, insert permission `settings.auth.manage`, and insert its `role_permissions` relation by joining the `SUPER_ADMIN` role; do not grant it to `SUPPORT`.

Add `AUTH_SETTINGS_MANAGE` to `PERMISSIONS`. Add the same permission object to `seedRolesAndPermissions()` so its existing loop assigns it to `SUPER_ADMIN` only. At the start of `main()`, seed settings without overwriting live choices:

```ts
await prisma.authSettings.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1 },
});
```

- [ ] **Step 4: Generate Prisma and prove migration/seed behavior.**

Run:

```bash
pnpm db:generate
pnpm test:db:reset
pnpm --filter api test -- permissions.spec.ts --runInBand
pnpm --filter api test:integration -- auth-settings.integration.spec.ts
```

Expected: generation/reset succeed; registry, singleton constraint/default, role grant, and non-overwriting seed tests pass.

- [ ] **Step 5: Commit the persistence foundation.**

```bash
git add apps/api/prisma apps/api/src/admin/permissions.ts apps/api/src/admin/permissions.spec.ts apps/api/test/integration/auth-settings.integration.spec.ts
git commit -m "feat: add auth settings persistence"
```

### Task 2: Implement the narrow auth-settings policy service

**Files:**
- Create: `apps/api/src/auth-settings/auth-settings.service.ts`
- Create: `apps/api/src/auth-settings/auth-settings.service.spec.ts`
- Create: `apps/api/src/auth-settings/auth-settings.module.ts`
- Modify: `apps/api/src/common/errors.ts`

**Interfaces:**
- Consumes: `PrismaService.authSettings` from Task 1 and `SocialProvider` (`'GOOGLE' | 'FACEBOOK'`).
- Produces: `AuthSettingsState`, `AuthProviderAvailability`, `UpdateAuthSettingsInput`; methods `readCurrent(): Promise<AuthSettingsState>`, `providerAvailability(): Promise<AuthProviderAvailability>`, `update(input: UpdateAuthSettingsInput): Promise<AuthSettingsState>`, and `assertLoginRegistrationEnabled(provider: SocialProvider): Promise<void>`; exported `AuthSettingsModule`.

- [ ] **Step 1: Write service tests for fresh reads, safe projection, concurrency, disabled providers, and fail-closed reads.**

Use a mocked `authSettings` delegate. Assert every method performs a new `findUnique`, public projection contains exactly `google` and `facebook`, disabled providers throw `SOCIAL_PROVIDER_DISABLED`, missing/rejected reads and rejected writes throw `SETTINGS_UNAVAILABLE` with status `503`, a zero-count CAS update with an extant row throws `STALE_AUTH_SETTINGS_UPDATE` with status `409`, and successful partial updates return the reread row.

```ts
await expect(service.providerAvailability()).resolves.toEqual({ google: true, facebook: false });
expect(prisma.authSettings.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });

await expect(service.assertLoginRegistrationEnabled('FACEBOOK')).rejects.toMatchObject({
  code: 'SOCIAL_PROVIDER_DISABLED',
});

expect(prisma.authSettings.updateMany).toHaveBeenCalledWith({
  where: { id: 1, updatedAt: new Date('2026-09-15T10:00:00.000Z') },
  data: { googleLoginRegistrationEnabled: false },
});
```

- [ ] **Step 2: Run the service test and verify it fails.**

Run:

```bash
pnpm --filter api test -- auth-settings.service.spec.ts --runInBand
```

Expected: FAIL because `AuthSettingsService` and the three new error codes are absent.

- [ ] **Step 3: Implement the policy without fallback state.**

Add error codes `SETTINGS_UNAVAILABLE`, `STALE_AUTH_SETTINGS_UPDATE`, and `SOCIAL_PROVIDER_DISABLED`. Implement exact exported types:

```ts
export type AuthSettingsState = {
  googleLoginRegistrationEnabled: boolean;
  facebookLoginRegistrationEnabled: boolean;
  updatedAt: Date;
};

export type AuthProviderAvailability = { google: boolean; facebook: boolean };

export type UpdateAuthSettingsInput = {
  expectedUpdatedAt: string;
  googleLoginRegistrationEnabled?: boolean;
  facebookLoginRegistrationEnabled?: boolean;
};
```

`readCurrent()` must query only `id=1`, select the three public/admin fields, and translate missing rows or Prisma failures to `SETTINGS_UNAVAILABLE`. `update()` must call `updateMany({ where: { id: 1, updatedAt: new Date(input.expectedUpdatedAt) }, data })`; on count `0`, reread to distinguish missing/unavailable from stale, then throw `STALE_AUTH_SETTINGS_UPDATE`. It must not upsert. `assertLoginRegistrationEnabled()` must read fresh state and choose only the provider's matching flag.

Register and export only `AuthSettingsService` from `AuthSettingsModule`; the global `DatabaseModule` already supplies Prisma.

- [ ] **Step 4: Run focused service proof.**

Run:

```bash
pnpm --filter api test -- auth-settings.service.spec.ts --runInBand
pnpm --filter api typecheck
```

Expected: all service cases pass and API typecheck exits `0`.

- [ ] **Step 5: Commit the policy service.**

```bash
git add apps/api/src/auth-settings apps/api/src/common/errors.ts
git commit -m "feat: add auth settings policy service"
```

### Task 3: Expose public and permission-protected settings APIs

**Files:**
- Create: `apps/api/src/auth-settings/provider-availability.controller.ts`
- Create: `apps/api/src/auth-settings/admin-auth-settings.controller.ts`
- Create: `apps/api/src/auth-settings/auth-settings.dto.ts`
- Modify: `apps/api/src/auth-settings/auth-settings.module.ts`
- Modify: `apps/api/src/admin/admin.module.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/test/integration/auth-settings.integration.spec.ts`

**Interfaces:**
- Consumes: Task 2 service methods and existing `AuthGuard`, `AdminGuard`, `PermissionGuard`, `RequirePermission`.
- Produces: `GET /api/v1/auth/provider-availability`; `GET|PATCH /api/v1/admin/settings/auth-providers`; `AdminAuthSettingsUpdateDto` with `expectedUpdatedAt: string` and at least one optional boolean.

- [ ] **Step 1: Extend integration tests through the real Nest application.**

Initialize `AppModule` with the same cookie parser, global prefix, `ValidationPipe`, `ApiErrorFilter`, and `ResponseInterceptor` used by other integration suites. Create/login one `SUPER_ADMIN` and one `SUPPORT` user. Assert:

```ts
expect(publicRead.status).toBe(200);
expect(publicRead.headers['cache-control']).toBe('no-store');
expect(publicRead.body.data).toEqual({ google: true, facebook: true });
expect(Object.keys(publicRead.body.data).sort()).toEqual(['facebook', 'google']);

expect(await http().get('/admin/settings/auth-providers')).toMatchObject({ status: 401 });
expect(supportRead.status).toBe(403);
expect(supportRead.body.error.code).toBe('PERMISSION_REQUIRED');
```

Read as admin, issue two PATCH requests with the same `expectedUpdatedAt`, and assert the first partial update succeeds with all three fields while the second returns `409 STALE_AUTH_SETTINGS_UPDATE`. Temporarily delete `id=1` inside a transaction/test cleanup window and assert public/admin GET return `503 SETTINGS_UNAVAILABLE`; restore the saved row in `finally`. Assert request bodies with neither boolean or with non-booleans return `400`.

- [ ] **Step 2: Run the integration file and verify endpoint failures.**

Run:

```bash
pnpm --filter api test:integration -- auth-settings.integration.spec.ts
```

Expected: persistence tests still pass, while HTTP tests fail with `404` because the controllers are absent.

- [ ] **Step 3: Implement DTOs, controllers, headers, guards, and composition.**

Define the update DTO with `@IsDateString()` and boolean validation. Enforce “at least one” without a generic validator: validate Facebook as required when Google is undefined, while each supplied field uses `@IsBoolean()`.

```ts
export class AdminAuthSettingsUpdateDto {
  @IsDateString()
  expectedUpdatedAt!: string;

  @IsOptional()
  @IsBoolean()
  googleLoginRegistrationEnabled?: boolean;

  @ValidateIf((value: AdminAuthSettingsUpdateDto) => value.googleLoginRegistrationEnabled === undefined)
  @IsDefined()
  @IsBoolean()
  facebookLoginRegistrationEnabled?: boolean;
}
```

The public controller calls `providerAvailability()` and sets `Cache-Control: no-store` via `@Header`. The admin controller uses class-level `@UseGuards(AuthGuard, AdminGuard, PermissionGuard)`, exact route `admin/settings/auth-providers`, and `@RequirePermission(PERMISSIONS.AUTH_SETTINGS_MANAGE)` on both GET and PATCH. GET calls `readCurrent()`; PATCH calls `update(dto)`.

Register the public controller in `AuthSettingsModule`. Import that module into `AuthModule` so OAuth can consume the exported service in Task 4. Import it into `AdminModule` and register `AdminAuthSettingsController` there so existing admin guards are available without a module cycle.

- [ ] **Step 4: Prove HTTP shape, RBAC, CAS conflict, validation, and unavailable behavior.**

Run:

```bash
pnpm --filter api test:integration -- auth-settings.integration.spec.ts
pnpm --filter api test -- permissions.spec.ts auth-settings.service.spec.ts --runInBand
pnpm --filter api typecheck
```

Expected: public payload/header, admin authorization, first-writer-wins, validation, and `503` cases all pass.

- [ ] **Step 5: Commit the HTTP contracts.**

```bash
git add apps/api/src/auth-settings apps/api/src/admin/admin.module.ts apps/api/src/auth/auth.module.ts apps/api/test/integration/auth-settings.integration.spec.ts
git commit -m "feat: expose auth settings APIs"
```

### Task 4: Enforce current settings at OAuth start and callback

**Files:**
- Create: `apps/api/src/auth/auth.controller.spec.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/test/integration/auth-settings.integration.spec.ts`

**Interfaces:**
- Consumes: `AuthSettingsService.assertLoginRegistrationEnabled(provider)` from Task 2; existing `SocialService.verifyState`, `getAuthorizationUrl`, `exchangeCode`, `linkIdentity`, and `loginIdentity` remain responsible for OAuth mechanics.
- Produces: login-mode redirects `social_error=provider_disabled` or `social_error=settings_unavailable`; no settings check for verified `mode=link` or unlink.

- [ ] **Step 1: Write controller ordering and mode-isolation tests.**

Instantiate `AuthController` with mocks. Drive public `google`/`facebook` and callback methods with a response mock implementing `cookie`, `clearCookie`, and `redirect`. Assert login start calls settings before `social.getAuthorizationUrl`, disabled/unavailable start never creates authorization/cookies, callback calls `social.verifyState` before settings and settings before `social.exchangeCode`, and invalid state never calls settings. Assert verified link start/callback do not call settings and still call existing link methods.

```ts
expect(settings.assertLoginRegistrationEnabled).toHaveBeenCalledWith('GOOGLE');
expect(settings.assertLoginRegistrationEnabled.mock.invocationCallOrder[0]).toBeLessThan(
  social.getAuthorizationUrl.mock.invocationCallOrder[0],
);
expect(social.exchangeCode).not.toHaveBeenCalled();
expect(response.redirect).toHaveBeenCalledWith(expect.stringContaining('social_error=provider_disabled'));
```

Extend integration coverage to set a provider false through Prisma, assert start redirects before setting `zenx_oauth_state_*`, create a signed state while enabled then disable before callback and assert `provider_disabled`, and delete `id=1` to assert `settings_unavailable`. Keep the existing tampered-state assertion as `invalid_state` and a link-mode start assertion as provider redirect even while login is disabled.

- [ ] **Step 2: Run focused tests and observe missing enforcement.**

Run:

```bash
pnpm --filter api test -- auth.controller.spec.ts --runInBand
pnpm --filter api test:integration -- auth-settings.integration.spec.ts
```

Expected: unit tests fail because `AuthController` does not consume settings; integration starts disabled providers and does not return the required errors.

- [ ] **Step 3: Inject and enforce the policy at exact request boundaries.**

Add `AuthSettingsService` to the controller constructor. In `startOAuth`, after resolving `mode` but before return-to resolution, token verification, authorization URL/state creation, or cookie writes:

```ts
if (mode === 'login') await this.authSettings.assertLoginRegistrationEnabled(provider);
```

In `completeOAuth`, keep `verifyState()` first. After verified state and safe return-to resolution, but before provider-error handling and `exchangeCode()`:

```ts
if (oauthState.mode === 'login') {
  await this.authSettings.assertLoginRegistrationEnabled(provider);
}
```

Map `SOCIAL_PROVIDER_DISABLED` to `provider_disabled` and `SETTINGS_UNAVAILABLE` to `settings_unavailable` in `errorCode()`. Do not modify `SocialService`, account link/unlink endpoints, or password methods.

- [ ] **Step 4: Prove start/callback enforcement and regressions.**

Run:

```bash
pnpm --filter api test -- auth.controller.spec.ts social.service.spec.ts auth.service.spec.ts --runInBand
pnpm --filter api test:integration -- auth-settings.integration.spec.ts vertical-slice.integration.spec.ts
pnpm --filter api typecheck
```

Expected: disabled/unavailable login flows stop before provider work; stale-state callbacks close safely; invalid state wins before settings; link/unlink and password regression tests remain green.

- [ ] **Step 5: Commit OAuth enforcement.**

```bash
git add apps/api/src/auth/auth.controller.ts apps/api/src/auth/auth.controller.spec.ts apps/api/test/integration/auth-settings.integration.spec.ts
git commit -m "feat: enforce auth settings in oauth flows"
```

### Task 5: Add shared client contracts and the AdminCP settings screen

**Files:**
- Modify: `packages/api-client/src/index.ts`
- Create: `apps/web/hooks/use-auth-settings.ts`
- Create: `apps/web/app/admin/settings/page.tsx`
- Modify: `apps/web/components/admin-shell.tsx`
- Modify: `apps/web/components/admin-permission-gate.tsx`
- Create: `apps/web/e2e/auth-settings-admin.spec.ts`

**Interfaces:**
- Consumes: Task 3 admin endpoints and API envelope behavior.
- Produces: `AuthProviderAvailability`, `AdminAuthSettings`, `AdminAuthSettingsUpdateRequest`; `api.auth.providerAvailability()`, `api.admin.authSettings.get()`, `api.admin.authSettings.update(input)`; hooks `useAdminAuthSettings()` and `useUpdateAdminAuthSettings()`; route `/admin/settings` guarded by CASL `manage AuthSettings`.

- [ ] **Step 1: Write AdminCP E2E scenarios before adding the screen.**

Using the seeded `admin@zenxgo.vn` and `support@zenxgo.vn` accounts, assert `SUPER_ADMIN` sees “Cài đặt” under “Hệ thống”, opens `/admin/settings`, sees two named checkboxes and the explanatory link/unlink copy, changes one flag and saves, sees success, and persists after reload. Capture the page's `updatedAt`, mutate through a second authenticated API request, then save the stale page and assert conflict copy appears and controls reload to server values. Assert `SUPPORT` has no settings nav link and direct `/admin/settings` does not leave it on that route. Restore true/true in `afterEach` through the admin API.

```ts
await expect(page.getByRole('link', { name: 'Cài đặt' })).toBeVisible();
await page.getByRole('checkbox', { name: 'Google' }).uncheck();
await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
await expect(page.getByText('Đã lưu cài đặt đăng nhập mạng xã hội.')).toBeVisible();
```

- [ ] **Step 2: Run the E2E file and verify the absent route.**

Run:

```bash
pnpm test:db:reset
pnpm build
pnpm --filter web test:e2e -- auth-settings-admin.spec.ts --project=chromium
```

Expected: FAIL because `/admin/settings`, client methods, hooks, and navigation do not exist.

- [ ] **Step 3: Add exact client types/methods and React Query hooks.**

Add:

```ts
export interface AuthProviderAvailability { google: boolean; facebook: boolean; }
export interface AdminAuthSettings {
  googleLoginRegistrationEnabled: boolean;
  facebookLoginRegistrationEnabled: boolean;
  updatedAt: string;
}
export interface AdminAuthSettingsUpdateRequest {
  expectedUpdatedAt: string;
  googleLoginRegistrationEnabled?: boolean;
  facebookLoginRegistrationEnabled?: boolean;
}
```

Wire `providerAvailability: () => client.get<AuthProviderAvailability>('/auth/provider-availability')`, plus nested admin `authSettings.get()` and `.update(input)` at `/admin/settings/auth-providers`. In `use-auth-settings.ts`, use query key `['admin', 'auth-settings']`, `retry: false`, and on successful mutation replace that exact query with the returned state.

- [ ] **Step 4: Build the permission-aware page with all specified states.**

Add a `Settings` icon nav item under “Hệ thống” with `{ action: 'manage', subject: 'AuthSettings' }`, and add `/admin/settings` first in `routePermissions` so it is not swallowed by another prefix.

The page must render a loading skeleton; a load error alert with “Thử lại”; one card titled “Đăng nhập & đăng ký mạng xã hội”; native `Checkbox` controls labelled Google/Facebook; copy stating link/unlink is unaffected; and “Lưu thay đổi”. Disable controls/button while saving. Keep local form state synchronized only when a successful fresh query arrives. On success show the exact success text from Step 1. On `ApiError.code === 'STALE_AUTH_SETTINGS_UPDATE'`, show conflict text, refetch, and do not retry the write. On other save failures, retain edits and show an error with retry by pressing save again.

- [ ] **Step 5: Prove client composition, RBAC projection, success, and conflict UX.**

Run:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm test:db:reset
pnpm build
pnpm --filter web test:e2e -- auth-settings-admin.spec.ts --project=chromium
```

Expected: type/lint/build pass; admin E2E proves menu/page permission, load/save/reload, pending/success, and stale conflict behavior.

- [ ] **Step 6: Commit the AdminCP slice.**

```bash
git add packages/api-client/src/index.ts apps/web/hooks/use-auth-settings.ts apps/web/app/admin/settings/page.tsx apps/web/components/admin-shell.tsx apps/web/components/admin-permission-gate.tsx apps/web/e2e/auth-settings-admin.spec.ts
git commit -m "feat: add admin auth settings screen"
```

### Task 6: Project availability onto login and registration screens

**Files:**
- Modify: `apps/web/hooks/use-auth-settings.ts`
- Modify: `apps/web/app/auth/login/page.tsx`
- Modify: `apps/web/app/auth/register/page.tsx`
- Create: `apps/web/e2e/auth-provider-availability.spec.ts`
- Modify: `apps/web/e2e/auth-subdomain.spec.ts`

**Interfaces:**
- Consumes: `api.auth.providerAvailability()` from Task 5 and unchanged `api.auth.oauthUrl(provider, 'login', returnTo?)`.
- Produces: `useAuthProviderAvailability()` using query key `['auth', 'provider-availability']`; login/register render only enabled providers and hide all social controls while loading/refetching or on error.

- [ ] **Step 1: Write public UI E2E coverage for all projections and password regressions.**

For both `/auth/login` and `/auth/register`, intercept `/api/v1/auth/provider-availability` and fulfill the normal envelope for `{true,true}`, `{true,false}`, `{false,true}`, and `{false,false}`. Assert exact Google/Facebook link counts and assert the social divider is absent when both are false. Add a deferred route test that holds the response and asserts no social links/divider during loading, then releases it. Fulfill `503 SETTINGS_UNAVAILABLE` and assert social controls remain hidden while username/password/registration fields remain enabled.

```ts
await page.route('**/api/v1/auth/provider-availability', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify({ data: { google: true, facebook: false }, error: null }),
}));
await expect(page.getByRole('link', { name: 'Google', exact: true })).toBeVisible();
await expect(page.getByRole('link', { name: 'Facebook', exact: true })).toHaveCount(0);
```

Extend `auth-subdomain.spec.ts` so its existing real Google/Facebook OAuth tests first assert the enabled social link; do not alter account-social link tests.

- [ ] **Step 2: Run the browser tests and observe unconditional buttons.**

Run:

```bash
pnpm test:db:reset
pnpm build
pnpm --filter web test:e2e -- auth-provider-availability.spec.ts --project=chromium
```

Expected: FAIL because both pages currently render both providers before and after every mocked response.

- [ ] **Step 3: Add the public hook and conditional social sections.**

Implement:

```ts
export function useAuthProviderAvailability() {
  return useQuery({
    queryKey: ['auth', 'provider-availability'],
    queryFn: api.auth.providerAvailability,
    retry: false,
    staleTime: 0,
  });
}
```

On each page, derive `const availability = !providers.isFetching && providers.isSuccess ? providers.data : undefined`. Render each `SocialAuthButton` only when its boolean is true. Render the social section/divider only when at least one is true, preserving the existing login `returnTo` URL behavior and all password/OTP form code. Add `provider_disabled` and `settings_unavailable` Vietnamese messages to the login social-error map.

- [ ] **Step 4: Prove all four combinations, fail-closed loading/error, and real OAuth regression.**

Run:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm test:db:reset
pnpm build
pnpm --filter web test:e2e -- auth-provider-availability.spec.ts auth-subdomain.spec.ts --project=chromium
```

Expected: all four combinations pass on both pages; loading/error hide social UI; password form remains; real enabled-provider OAuth still returns across subdomains.

- [ ] **Step 5: Commit the public UI projection.**

```bash
git add apps/web/hooks/use-auth-settings.ts apps/web/app/auth/login/page.tsx apps/web/app/auth/register/page.tsx apps/web/e2e/auth-provider-availability.spec.ts apps/web/e2e/auth-subdomain.spec.ts
git commit -m "feat: respect auth provider availability in public ui"
```

### Task 7: Update durable docs and run the Phase 1 release proof

**Files:**
- Modify: `docs/specs/02-auth-account.md`
- Modify: `docs/specs/06-screen-catalog.md`
- Modify: `docs/specs/07-api-data-catalog.md`
- Modify: `docs/specs/08-traceability-matrix.md`

**Interfaces:**
- Consumes: completed endpoint, screen, persistence, RBAC, and verification names from Tasks 1–6.
- Produces: durable catalog/traceability entries marking Phase 1 behavior and evidence implemented; no Phase 2–6 claims.

- [ ] **Step 1: Run a documentation red check against stale catalog claims.**

Run:

```bash
rg -n "FEAT-AUTH-004.*PARTIAL|API-AUTH-(GOOGLE|FACEBOOK).*(START|CALLBACK).*PARTIAL|SCR-ADMIN-SETTINGS|provider-availability|settings/auth-providers|AuthSettings" docs/specs
```

Expected: OAuth entries are still `PARTIAL`, and the new screen, endpoints, singleton, permission, and test evidence are absent.

- [ ] **Step 2: Update only Phase 1 documentation.**

In `02-auth-account.md`, document current DB enforcement at login-mode start/callback, fail-closed behavior, and unchanged link/unlink/password flows; mark `FEAT-AUTH-004` implemented. In `06-screen-catalog.md`, add `SCR-ADMIN-SETTINGS` at `/admin/settings`, update login/register dependencies to include availability, and name both new E2E files. In `07-api-data-catalog.md`, add the public GET and two admin settings methods with exact auth/error/cache behavior, add `AuthSettings / auth_settings` to the data catalog, and mark the four OAuth rows implemented with settings enforcement evidence. In `08-traceability-matrix.md`, connect `FEAT-AUTH-004` to the settings screen/APIs/service and the unit, integration, and E2E files from this plan.

- [ ] **Step 3: Verify documentation names and prohibited scope.**

Run:

```bash
rg -n "SCR-ADMIN-SETTINGS|provider-availability|settings/auth-providers|settings.auth.manage|AuthSettings|auth-settings.integration.spec.ts|auth-provider-availability.spec.ts" docs/specs
rg -n "cache|activity log|OTP|DOB|CCCD|wallet|mode=link|unlink" docs/specs/02-auth-account.md docs/specs/06-screen-catalog.md docs/specs/07-api-data-catalog.md docs/specs/08-traceability-matrix.md
```

Expected: the first command shows consistent exact names across catalogs; the second shows only explicit unchanged/out-of-scope statements, not new settings mechanisms or claims.

- [ ] **Step 4: Run the complete proportional release gate.**

Run each command separately:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm test:db:reset
pnpm test:integration
pnpm build
pnpm --filter web test:e2e -- auth-settings-admin.spec.ts auth-provider-availability.spec.ts auth-subdomain.spec.ts account-screens.spec.ts --project=chromium
```

Expected: unit, type, lint, integration, build, targeted Phase 1 E2E, OAuth return, and account link/unlink regression gates all exit `0`.

- [ ] **Step 5: Inspect the migration and public contract for secrets and scope drift.**

Run:

```bash
rg -n "clientSecret|client_id|redirectUri|authorizationUrl|tokenUrl|userInfoUrl" apps/api/src/auth-settings apps/web/app/admin/settings packages/api-client/src/index.ts
git diff --check
git status --short
```

Expected: secret/config search has no matches in auth-settings/AdminCP code (existing unrelated API-client OAuth URL code may match only public path construction); diff check is clean; status contains only the intended Phase 1 files and docs.

- [ ] **Step 6: Commit the durable documentation.**

```bash
git add docs/specs/02-auth-account.md docs/specs/06-screen-catalog.md docs/specs/07-api-data-catalog.md docs/specs/08-traceability-matrix.md
git commit -m "docs: record auth settings phase 1"
```

## Executor Self-Review

- [ ] Map every approved-spec paragraph to Tasks 1–7; confirm defaults/seed, singleton constraint, fresh reads, safe public projection, admin CAS/RBAC, start/callback enforcement, all UI states, and link/unlink/password regressions each have executable evidence.
- [ ] Run the writing-plans skill's red-flag scan over this plan and implementation diff; replace every non-executable instruction with exact behavior, code, and commands.
- [ ] Confirm type/signature consistency: database fields use `googleLoginRegistrationEnabled` / `facebookLoginRegistrationEnabled`; public JSON uses `google` / `facebook`; `updatedAt` is `Date` inside the API service and ISO `string` in the shared client; update requests always carry `expectedUpdatedAt` plus at least one boolean.
- [ ] Confirm route and permission consistency: `/api/v1/auth/provider-availability`, `/api/v1/admin/settings/auth-providers`, `/admin/settings`, and `settings.auth.manage` / `manage AuthSettings` match migration, seed, registry, controllers, client, hooks, nav, gate, tests, and docs.
- [ ] Confirm scope: no generic settings infrastructure, cache, activity logging, OAuth secret storage/UI, provider health, OTP/DOB/CCCD/wallet work, or behavioral changes to password and `mode=link`/unlink.
- [ ] Record final `git log --oneline --decorate -8`, `git status --short`, and all command results for Lead; do not combine or rewrite task commits without Lead direction.
