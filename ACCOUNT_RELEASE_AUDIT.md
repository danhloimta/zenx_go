# ZENX GO Account Screens — Release Gate Audit

Date: 2026-08-25

## Scope

The audit covers `Thông tin cá nhân`, `Bảo mật`, `Đổi mật khẩu`, and `Liên kết tài khoản` on desktop Chromium and mobile Chromium. The product specification and API contract are the source of truth; the supplied screenshot is used only for visual/navigation comparison.

## Changes verified

- Profile values no longer fall back to sample personal data. Email and phone can be changed through OTP-verified flows, and avatar uploads validate size, MIME type, and image signatures.
- Security status now uses `emailVerifiedAt`, `phoneVerifiedAt`, and `hasPassword`; it no longer infers verification from whether a value exists.
- Password changes enforce the same strength policy in the UI and API, reject reuse, support social-only accounts setting their first password, and keep error/loading states visible.
- Google/Facebook status is conditional on the API response. OAuth now uses signed, expiring state, provider code exchange, profile lookup, identity collision checks, authenticated linking, and last-login-method protection.
- Completing onboarding updates the account query cache before redirecting, preventing the AppShell from sending the user back to onboarding.
- E2E setup uses isolated ports (`3300`/`4300`) and an isolated Next build directory so stale development servers cannot affect the gate.

## Test evidence

| Check | Result |
|---|---|
| API unit tests | 4 suites, 10 tests passed |
| API SQL Server integration | 11 tests passed |
| Web/API lint | Passed |
| Web/API typecheck | Passed |
| Production build (`NEXT_DIST_DIR=.next-release`) | Passed |
| E2E Chromium desktop + mobile Chromium | 8 tests passed |

## Release verdict

**BLOCKED for public release until external social-login acceptance is completed.** The local environment has no Google/Facebook client credentials, so live OAuth cannot be exercised. In addition, an unlinked provider currently returns `not_linked` during login; the first-time social signup/onboarding flow from the product specification still needs to be implemented or explicitly removed from the release scope.

The four password-account screens and their authenticated account/API journeys pass the automated release gate. The remaining blocker is environment/product scope, not a failing account-screen regression.

Non-blocking warnings remain for the existing Next ESLint plugin and Prisma package configuration deprecation.

## Second-pass fixes

The second pass also fixed session refresh/retry, account-status checks, password-session revocation, current-email OTP verification, localized account errors, invalid social-provider rejection, OAuth provider timeouts, and multi-tab OAuth state handling.

The only remaining release blocker is **P0 — first-time social login**: an unlinked Google/Facebook identity redirects to `not_linked`; the product specification still describes a first-time social signup and phone-verification flow. Provider credentials are also intentionally deferred until the owner supplies the keys.
