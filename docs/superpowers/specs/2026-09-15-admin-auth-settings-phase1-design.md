# Admin authentication settings — Phase 1 design

> Status: approved design for implementation
>
> Date: 2026-09-15
>
> Scope: admin control of Google and Facebook login/registration availability

## Summary

Phase 1 adds two independent, database-backed switches:

- Google login/registration enabled
- Facebook login/registration enabled

Both switches default to enabled, preserving current behavior after migration. An enabled switch permits the existing social `mode=login` flow, which either logs in a linked identity or creates an account for a new provider identity. A disabled switch removes that provider from the public login and registration screens and causes the backend to reject both OAuth initiation and callback completion for that login/registration flow.

The backend decision is authoritative. Each relevant public read, OAuth start, and OAuth callback request reads the singleton row from the current database state. There is no application cache, process-local copy, event bus, or replica-invalidation mechanism in this phase.

Account link and unlink behavior is explicitly unchanged. The existing `mode=link` flow and account social-management screens continue to work regardless of the login/registration switches.

## Goals

- Let an authorized administrator independently enable or disable Google and Facebook as login/registration methods at `/admin/settings`.
- Stop disabled providers at the backend, including direct navigation to OAuth routes.
- Reject a callback that arrives after its provider was disabled, even if its OAuth state was issued while the provider was enabled.
- Expose only the two safe availability booleans to unauthenticated clients.
- Preserve current behavior on rollout by creating the settings row with both providers enabled.
- Fit the existing NestJS, Prisma/SQL Server, Next.js, API-client, React Query, and CASL conventions.

## Non-goals

Phase 1 does not include:

- a key/value store, setting registry, categories, dynamic schemas, or general-purpose settings infrastructure;
- storing, editing, validating, or exposing Google/Facebook client IDs, client secrets, redirect URIs, or other OAuth credentials;
- changing password registration, password login, password reset, OTP delivery, or session behavior;
- changing account link/unlink routes, `/account/social`, or the social controls embedded in account profile screens;
- production OTP-provider work;
- activity or audit logging for settings changes;
- DOB, CCCD, wallet, payment, content, support, or unrelated account-lifecycle corrections;
- caching, pub/sub, polling infrastructure, or multi-replica cache invalidation;
- scheduling, environment-specific overrides, provider health checks, or provider credential status in the settings UI;
- separate login and registration switches for the same provider.

## Existing behavior and terminology

`GET /api/v1/auth/google` and `GET /api/v1/auth/facebook` currently start OAuth. Their signed state has `mode=login` or `mode=link`. Despite the name, `mode=login` also creates a new local account when the provider identity is not linked and its email does not collide with an existing account. Consequently, each Phase 1 switch controls **both login and registration** by governing `mode=login`.

The public register page calls the same `mode=login` start route as the login page. No new OAuth mode or registration endpoint is introduced.

## Architecture

### Responsibility boundaries

1. `AuthSettingsService` owns reading and conditionally updating the one typed settings row. It returns typed values and never handles OAuth credentials.
2. The admin controller exposes the full Phase 1 settings representation, including `updatedAt`, behind admin authentication and one CASL permission.
3. The public auth controller exposes a read-only projection containing only provider booleans.
4. The OAuth controller asks `AuthSettingsService` whether the provider is allowed for `mode=login` at both the start and callback boundaries. `SocialService` remains responsible for signed state, provider exchange, profile mapping, login/registration, link, and unlink behavior.
5. The shared API client defines the request/response types used by both admin and public web screens.
6. The web UI consumes the public projection for presentation and the admin representation for editing. UI visibility never substitutes for backend enforcement.

The settings service may live in a small auth-settings module imported where needed. It must not become a generic configuration abstraction or absorb environment configuration.

### Request flows

Public rendering:

1. Login or register UI requests the public availability projection.
2. While that request is pending, no social provider button or social-divider copy is rendered.
3. A provider button is rendered only when its returned boolean is `true`.
4. Password login and password registration remain usable independently of this request.

OAuth start for `mode=login`:

1. Validate/resolve the existing safe `returnTo` behavior.
2. Read the singleton row from the database.
3. If the selected provider is disabled, reject locally. Do not create OAuth state, set an OAuth-state cookie, or redirect/contact the provider.
4. If enabled, continue the existing authorization URL and state-cookie flow.

OAuth callback:

1. Verify the signed provider state and state cookie using the existing logic. This establishes the trustworthy mode; the query string must not select the policy path.
2. Consume or clear the used state cookie as the existing callback does.
3. If verified state is `mode=login`, read the singleton row from the database and reject when that provider is disabled.
4. Only after the check succeeds may the backend exchange the authorization code, fetch a profile, log in an identity, or create a local account.
5. If verified state is `mode=link`, continue the existing callback unchanged and do not apply these switches.

This callback check means a state issued before an admin change does not bypass the new state. “Immediate” means every newly handled relevant request observes the current primary-database row without a cache. A request that has already passed its authoritative check is not cancelled mid-flight; Phase 1 does not introduce distributed cancellation or a long-held database lock around an external provider exchange.

## Data model and defaults

Add exactly one Prisma model representing a singleton table:

```prisma
model AuthSettings {
  id                                   Int      @id
  googleLoginRegistrationEnabled      Boolean  @default(true) @map("google_login_registration_enabled")
  facebookLoginRegistrationEnabled    Boolean  @default(true) @map("facebook_login_registration_enabled")
  updatedAt                            DateTime @updatedAt @map("updated_at")

  @@map("auth_settings")
}
```

The only valid identity is `id = 1`. The SQL Server migration must:

- create `dbo.auth_settings` with the two `BIT NOT NULL DEFAULT 1` columns and `updated_at DATETIME2 NOT NULL`;
- add a check constraint requiring `id = 1`, so singleton cardinality is enforced by the database rather than convention alone;
- insert row `id = 1` with both booleans set to `1` in the same migration transaction;
- add the new `settings.auth.manage` permission described below and associate it with the `SUPER_ADMIN` system role for role-matrix consistency.

The normal development seed must also idempotently create row `id = 1` when missing, using both booleans as `true`, but use `update: {}` for an existing row so rerunning seed never overwrites administrator choices. The migration is the production default/bootstrap mechanism; runtime reads must not create or repair the row.

`updatedAt` is concurrency metadata, not a user-facing setting. No `updatedBy`, history, JSON payload, key/value child table, credential field, or nullable provider flag is added.

## Authorization

Add one permission, the smallest capability needed for this screen and both endpoints:

| Code | Module | CASL action | CASL subject | Purpose |
| --- | --- | --- | --- | --- |
| `settings.auth.manage` | `settings` | `manage` | `AuthSettings` | View and update login/registration provider switches |

Both admin read and update endpoints require `AuthGuard`, `AdminGuard`, and `PermissionGuard` with this permission. This follows the current rule that a custom role also needs `admin.access` to enter AdminCP. `SUPER_ADMIN` remains unrestricted through `manage all`; its persisted permission association keeps the role-management matrix complete. `SUPPORT` does not receive this permission by default.

The admin navigation item and `/admin/settings` route gate use `ability.can('manage', 'AuthSettings')`. Hiding the item is convenience only; the API remains the enforcement point.

## API contracts

All JSON endpoints use the existing `{ data, error }` envelope under `/api/v1`.

### Public provider availability

`GET /auth/provider-availability`

- Authentication: none.
- Response `200`:

```json
{
  "data": {
    "google": true,
    "facebook": true
  },
  "error": null
}
```

The booleans mean “admin allows login/registration.” They intentionally do not reveal or infer whether credentials are configured, secret values, redirect URIs, provider health, timestamps, administrator identity, or any other setting. An enabled but environmentally unconfigured provider retains the current `not_configured` behavior when its start route is used.

Use response headers appropriate for a fresh read (`Cache-Control: no-store`), and do not give this React Query request a nonzero `staleTime` or persistence. HTTP/CDN caching must not weaken immediate UI reflection.

### Admin read

`GET /admin/settings/auth-providers`

- Authentication: access session plus `settings.auth.manage`.
- Response `200`:

```json
{
  "data": {
    "googleLoginRegistrationEnabled": true,
    "facebookLoginRegistrationEnabled": true,
    "updatedAt": "2026-09-15T08:00:00.000Z"
  },
  "error": null
}
```

### Admin update

`PATCH /admin/settings/auth-providers`

- Authentication: access session plus `settings.auth.manage`.
- Protected by the existing global `OriginGuard` for browser mutation requests.
- Request:

```json
{
  "googleLoginRegistrationEnabled": false,
  "facebookLoginRegistrationEnabled": true,
  "expectedUpdatedAt": "2026-09-15T08:00:00.000Z"
}
```

Rules:

- `expectedUpdatedAt` is required and must be an ISO date-time.
- Each provider field is optional to allow a partial update, but at least one must be present.
- Supplied provider values must be booleans; unknown fields are removed by the existing global validation policy.
- Update row `id = 1` with an atomic predicate on `updatedAt`; do not implement read-then-unconditional-write.
- A successful update returns the same shape as the admin read with the new `updatedAt`.
- Sending a value equal to its current value is allowed and still produces a successful representation; the implementation may avoid changing `updatedAt` only if it can do so without weakening the concurrency predicate. The simplest implementation updates the row and advances `updatedAt`.
- A stale predicate returns `409 STALE_AUTH_SETTINGS_UPDATE`; the UI refetches and asks the operator to review the newer values instead of automatically retrying the mutation.

## OAuth rejection and failure behavior

OAuth start and callback are browser navigation routes and retain the existing redirect-based error transport. Add `provider_disabled` as the public `social_error` value.

When a `mode=login` start or callback is disabled:

- redirect through the existing safe destination logic with `social_error=provider_disabled` (falling back to `/auth/login`);
- show neutral copy such as “Đăng nhập/đăng ký bằng nhà cung cấp này hiện đã tắt.”;
- do not contact the provider on start, and do not exchange the code or mutate a user/social identity on callback;
- do not identify which administrator made the change or expose internal configuration.

Provider cancellation, invalid state, unlinked existing email, missing credentials, and provider failures retain their current distinct outcomes. State validation precedes the callback availability check, so malformed or forged callbacks still return `invalid_state` rather than becoming a settings oracle.

Settings data is security-relevant policy. If the singleton row is missing or its database read fails:

- public availability returns `503 SETTINGS_UNAVAILABLE` and no guessed/default booleans;
- admin read/update returns `503 SETTINGS_UNAVAILABLE` unless the database layer already produces the repository's standard database failure envelope;
- OAuth `mode=login` start/callback fails closed via `social_error=settings_unavailable`, before provider contact, token exchange, login, or registration;
- link/unlink flows retain their existing behavior because these switches do not govern them;
- password login and registration remain available.

The public login/register UI treats an availability-load failure as social providers unavailable for that render: it keeps both buttons and the social divider hidden while leaving password forms usable. It may show a small retryable status, but it must not substitute hard-coded `true` values. AdminCP keeps the last form unsaved, reports the error, and offers refetch/retry; it must not claim the update succeeded.

## AdminCP UI

Add `/admin/settings` and one navigation item, “Cài đặt”, under the existing “Hệ thống” section. Both are visible only with `manage AuthSettings`.

The page contains one “Đăng nhập & đăng ký mạng xã hội” card with:

- a Google switch labelled as controlling Google login and registration;
- a Facebook switch labelled as controlling Facebook login and registration;
- concise help text that account linking/unlinking is unaffected;
- loading skeleton, read error with retry, save-pending state, success feedback, and stale-update feedback;
- one explicit save action rather than saving each toggle immediately.

The form initializes from the admin read response, submits both current booleans with `expectedUpdatedAt`, disables duplicate submission while pending, and refreshes its baseline from the successful response. Navigating away with unsaved changes may use the browser's existing simple confirmation pattern; no reusable form framework is required.

The page does not display credential configuration, credential health, raw row IDs, audit history, environment names, or unrelated settings.

## Public UI

Both `/auth/login` and `/auth/register` request `GET /auth/provider-availability` through the shared API client.

- Render Google only when `google === true`.
- Render Facebook only when `facebook === true`.
- Remove the “social” divider/heading when neither provider is visible.
- Do not render disabled buttons, placeholders named after a disabled provider, or links that can initiate it.
- Preserve the existing password forms, return path handling, and social error toast behavior.
- Add provider-neutral messages for `provider_disabled` and `settings_unavailable`; existing Google-specific fallback text should not be reused for Facebook.

No account page or account social-management component consumes the public availability projection in Phase 1.

## Migration, deployment, and rollback

### Forward migration

The change is additive: create the singleton table and seed row, add the permission, then deploy API/API-client/web support. The migration must be transactional following existing SQL Server migration conventions. Existing users, social identities, sessions, and OAuth credentials are untouched.

For a rolling or multi-replica deployment, administrators must not be allowed to disable a provider until every serving API replica contains both start and callback enforcement. The safe release sequence is:

1. Apply the additive migration.
2. Deploy and verify all API replicas with settings reads and OAuth enforcement.
3. Deploy the API client and web UI, including AdminCP.
4. Only then permit operators to change the defaults.

This activation ordering prevents an old replica from accepting a disabled provider during a mixed-version rollout without adding invalidation infrastructure.

### Rollback

The additive database objects are backward compatible with the previous application. If application rollback is required, first re-enable both providers while the new admin/API path is still available, then roll back all application replicas. Leaving the unused table and permission in place is the preferred immediate rollback because it avoids destructive schema work.

If a later maintenance change removes the database objects, do so only after all new-code replicas are gone: remove role-permission associations, remove `settings.auth.manage`, then drop `auth_settings`. SQL Server/Prisma migrations have no automatic down migration in this repository, so rollback is an explicit operational procedure. Dropping the table discards only these two operator choices; it does not affect accounts or social identities.

## Test strategy

### Policy/service unit tests

- Default row serialization returns both booleans and admin metadata correctly.
- Provider mapping is exhaustive for `GOOGLE` and `FACEBOOK` and selects only its own field.
- Missing row becomes `SETTINGS_UNAVAILABLE`; it is not auto-created or treated as enabled.
- Partial update accepts either or both booleans, rejects an empty payload, and performs an optimistic conditional update.
- Stale `expectedUpdatedAt` returns `STALE_AUTH_SETTINGS_UPDATE`.
- Public projection contains exactly `google` and `facebook` booleans.

### Controller/OAuth tests

- Public read is unauthenticated, enveloped, and marked `no-store`.
- Admin read/update reject no session, no admin access, and missing `manage AuthSettings` permission.
- `SUPER_ADMIN` and an authorized custom role can read/update; `SUPPORT` cannot by default.
- Disabled Google and disabled Facebook each reject direct `mode=login` start before state/cookie/provider work.
- A callback whose signed state is `mode=login` is rejected before code exchange when disabled.
- A state issued while enabled is rejected if the setting is disabled before callback handling.
- Invalid callback state remains `invalid_state` even when the provider is disabled.
- `mode=link` start/callback and unlink continue to work while the corresponding login/registration switch is disabled.
- Settings read failure is fail-closed for login/registration and does not block password auth.
- Existing enabled-provider, missing-credential, return-to, cookie, login, and first-time-account flows remain green.

Use mocks/spies at the provider adapter to prove disabled paths make no token/userinfo calls and at Prisma to prove no social identity/user mutation follows rejection.

### Migration/integration tests

- Apply migrations to an empty test database and assert row `id = 1` exists with both flags enabled.
- Assert the database check constraint rejects any second singleton identity.
- Run seed twice after changing a flag and prove seed does not overwrite the change.
- Exercise admin update followed immediately by public read, direct start, and callback against the same test database.
- Exercise concurrent admin updates and prove exactly one writer wins for the same `expectedUpdatedAt`.
- Verify permission seeding and custom-role authorization through the real guards.

### Web/browser tests

- Login and register show both providers at defaults.
- Each page hides only Google, only Facebook, and then the complete social section when both are disabled.
- No provider button flashes while availability is loading.
- Availability failure leaves password auth usable and does not show social buttons.
- Admin settings is absent from navigation and route-gated without permission.
- An authorized admin loads settings, changes one or both switches, saves, and sees the returned state.
- Stale admin submission preserves unsaved choices, displays conflict feedback, and can refetch.
- A direct disabled start and an in-flight-state callback surface the neutral disabled message and create no account.
- Account social link/unlink controls remain present and functional while login/registration is disabled.

### Proportionate verification commands

Implementation should run at minimum:

```bash
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test:e2e
```

If full browser or database tests cannot run, the implementation handoff must identify the exact skipped command and environment limitation; typecheck/unit results alone do not prove callback enforcement or migration defaults.

## Documentation updates required with implementation

Because canonical documents describe implemented source rather than future design, update them in the implementation change set after behavior exists:

- `docs/specs/02-auth-account.md`: provider policy, immediate backend checks, unchanged link/unlink boundary, and test evidence;
- `docs/specs/06-screen-catalog.md`: `/admin/settings` plus availability consumption on login/register;
- `docs/specs/07-api-data-catalog.md`: public availability and admin settings endpoints/data boundary;
- `docs/specs/08-traceability-matrix.md`: feature-to-screen/API/source/test mapping;
- `docs/specs/09-admin.md`: permission, screen, API, data model, migration, operations, and known limits;
- `docs/specs/README.md` only if the canonical index or inventory count changes;
- root/environment documentation only if implementation changes setup (it should not, because credentials remain environment secrets).

Update each affected document's verification date/commit according to repository convention. Do not mark the feature `IMPLEMENTED` before its code and proportional tests exist.

## Acceptance checklist

- [ ] One typed `AuthSettings` singleton exists; no general settings mechanism exists.
- [ ] Migration and idempotent seed default both providers to enabled and preserve later admin choices.
- [ ] One narrow CASL permission controls admin read, update, navigation, and route gate.
- [ ] Public projection exposes exactly two safe booleans and is not cached.
- [ ] Login/register UI hides disabled providers without affecting password auth.
- [ ] Direct OAuth `mode=login` start and callback reject disabled providers from fresh DB state.
- [ ] Disabled callbacks perform no provider exchange, login, identity creation, or account creation.
- [ ] Existing `mode=link` and unlink behavior/screens are unchanged.
- [ ] Credentials remain environment-only and are absent from schema and responses.
- [ ] Missing/unreadable settings fail closed for social login/registration.
- [ ] Migration, rollback, unit, integration, and browser evidence is recorded.
- [ ] Canonical documentation is updated only when implementation is complete.

## Residual risks and deliberate limits

- “Immediate” is request-boundary consistency, not cancellation of a callback that already passed its database check. Closing that very small in-flight interval would require stronger transaction/distributed coordination outside Phase 1.
- During a mixed-version API rollout, an old replica cannot enforce a setting it does not know about. The documented activation sequence is therefore mandatory before an operator changes defaults.
- The public booleans represent administrator policy, not provider configuration or health. A provider can be enabled yet fail with the existing `not_configured` or provider error.
- Database unavailability removes social login/registration until settings can be read, by design; password authentication remains the recovery path.
