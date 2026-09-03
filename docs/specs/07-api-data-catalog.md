# API & data catalog

> Loại tài liệu: canonical API/data inventory
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

## Global contract

- Base path: `/api/v1`.
- JSON responses dùng `{ data, error }`; HTTP status vẫn phản ánh success/failure. SePay webhook là exception có response `{ success: true }`.
- Browser mutation chịu `OriginGuard`; signed payment/webhook callback đánh dấu skip origin.
- `AuthGuard` dùng HttpOnly `zenx_access` cookie, chỉ nhận JWT `type: access`, kiểm tra account status, `authVersion` và user ownership.
- `/admin/*` dùng `AuthGuard` + live database `AdminGuard`; Phase 1 chỉ cấp role `SUPER_ADMIN`.
- Refresh cookie là `zenx_refresh`, path `/api/v1/auth`; access cookie path `/`.
- DTO validation chạy global với `whitelist`, `transform`, `forbidUnknownValues`.
- API public không trả password hash, OTP/code hash, secret answer/hash, ciphertext identity hoặc storage IDs không cần thiết.

## Authentication API

| ID                           | Method/path                   | Auth                        | Status        | Input/output boundary                                                               | Source/test                                                  |
| ---------------------------- | ----------------------------- | --------------------------- | ------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `API-AUTH-REGISTER`          | `POST /auth/register`         | Public                      | `IMPLEMENTED` | `RegisterDto`; verify phone token, accept terms/privacy; trả public user + cookies. | `apps/api/src/auth/auth.controller.ts`; vertical integration |
| `API-AUTH-LOGIN`             | `POST /auth/login`            | Public                      | `IMPLEMENTED` | `LoginDto`; trả public user, redirectTo và cookies.                                 | auth controller; vertical/auth E2E                           |
| `API-AUTH-REFRESH`           | `POST /auth/refresh`          | Refresh cookie/body         | `IMPLEMENTED` | Xoay refresh session, revoke old token, trả cookies mới.                            | auth controller; vertical integration                        |
| `API-AUTH-LOGOUT`            | `POST /auth/logout`           | Optional session            | `IMPLEMENTED` | Revoke refresh nếu có và clear access/refresh cookies.                              | auth controller; auth E2E                                    |
| `API-AUTH-FORGOT`            | `POST /auth/forgot-password`  | Public                      | `IMPLEMENTED` | Email input; response accepted không lộ account existence.                          | auth service; vertical integration                           |
| `API-AUTH-RESET`             | `POST /auth/reset-password`   | Public + verification token | `IMPLEMENTED` | Email/token/new password; reset password và revoke sessions.                        | auth service; vertical integration                           |
| `API-AUTH-ME`                | `GET /auth/me`                | Access                      | `IMPLEMENTED` | Trả userId/username từ access session.                                              | auth controller; vertical integration                        |
| `API-AUTH-GOOGLE-START`      | `GET /auth/google`            | Public hoặc link session    | `PARTIAL`     | OAuth mode/returnTo; redirect provider hoặc `not_configured`.                       | auth controller/social service; social E2E                   |
| `API-AUTH-GOOGLE-CALLBACK`   | `GET /auth/google/callback`   | OAuth state                 | `PARTIAL`     | code/state/error; verify state, exchange profile, login/link và redirect.           | auth controller; social E2E                                  |
| `API-AUTH-FACEBOOK-START`    | `GET /auth/facebook`          | Public hoặc link session    | `PARTIAL`     | OAuth mode/returnTo; redirect provider hoặc `not_configured`.                       | auth controller/social service; social E2E                   |
| `API-AUTH-FACEBOOK-CALLBACK` | `GET /auth/facebook/callback` | OAuth state                 | `PARTIAL`     | code/state/error; verify state, exchange profile, login/link và redirect.           | auth controller; social E2E                                  |

## Account API

| ID                                 | Method/path                                  | Auth                     | Status        | Input/output boundary                                                                            | Source/test                                                        |
| ---------------------------------- | -------------------------------------------- | ------------------------ | ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `API-ACCOUNT-ME`                   | `GET /account/me`                            | Access                   | `IMPLEMENTED` | Public account summary, profile, social flags, wallet summary; không sensitive profile.          | `apps/api/src/account/account.controller.ts`; vertical integration |
| `API-ACCOUNT-UPDATE`               | `PATCH /account/me`                          | Access                   | `IMPLEMENTED` | Basic `UpdateAccountDto`; fullName/DOB/gender/city/address/avatarUrl.                            | account service; vertical/account E2E                              |
| `API-ACCOUNT-COMPLETE`             | `POST /account/complete-profile`             | Access                   | `IMPLEMENTED` | Complete basic profile và set `profileCompletedAt`.                                              | account service; vertical/account E2E                              |
| `API-ACCOUNT-AVATAR`               | `POST /account/avatar`                       | Access                   | `IMPLEMENTED` | Multipart image ≤2 MB, JPEG/PNG/WebP signature; trả avatar URL.                                  | account controller; vertical/account E2E                           |
| `API-ACCOUNT-PASSWORD`             | `POST /account/change-password`              | Access                   | `IMPLEMENTED` | Current/new password; strength, reuse check, revoke sessions.                                    | account service; vertical integration                              |
| `API-ACCOUNT-EMAIL`                | `POST /account/change-email`                 | Access + OTP token       | `IMPLEMENTED` | New email + verification token; unique/verified update.                                          | account service; vertical integration                              |
| `API-ACCOUNT-PHONE`                | `POST /account/change-phone`                 | Access + OTP token       | `IMPLEMENTED` | New phone + verification token; normalize/unique update.                                         | account service; vertical integration                              |
| `API-ACCOUNT-SENSITIVE-SUMMARY`    | `GET /account/sensitive-profile`             | Access                   | `IMPLEMENTED` | Masked CCCD last4, security status/question code; không plaintext/hash.                          | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-QUESTIONS`  | `GET /account/sensitive-profile/questions`   | Access                   | `IMPLEMENTED` | Active `security_questions` ordered by sortOrder.                                                | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-OTP-SEND`   | `POST /account/sensitive-profile/otp`        | Access                   | `IMPLEMENTED` | Không nhận destination; ưu tiên verified phone, fallback verified email; trả masked destination. | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-OTP-VERIFY` | `POST /account/sensitive-profile/otp/verify` | Access                   | `IMPLEMENTED` | Channel + 6-digit code gắn user; trả sensitive token TTL 5 phút.                                 | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-CHALLENGE`  | `POST /account/sensitive-profile/challenge`  | Access                   | `IMPLEMENTED` | `SECRET_CODE` hoặc `SECURITY_ANSWER`; lockout 5 sai/15 phút; trả token.                          | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-REVEAL`     | `POST /account/sensitive-profile/reveal`     | Access + sensitive token | `IMPLEMENTED` | Token hợp lệ trả CCCD/ngày/nơi cấp rõ; không trả security secrets.                               | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SENSITIVE-UPDATE`     | `PATCH /account/sensitive-profile`           | Access + sensitive token | `IMPLEMENTED` | Update/delete identity/security; validate unique CCCD và security group.                         | sensitive service; sensitive integration                           |
| `API-ACCOUNT-SOCIAL-LINK`          | `POST /account/social/:provider/link`        | Access + OAuth flow      | `IMPLEMENTED` | Validate provider Google/Facebook, hoàn tất link qua callback.                                   | account/social service; social E2E                                 |
| `API-ACCOUNT-SOCIAL-UNLINK`        | `DELETE /account/social/:provider`           | Access                   | `IMPLEMENTED` | Unlink provider nếu không làm mất login method cuối.                                             | account/social service; vertical integration                       |

## OTP API

| ID               | Method/path        | Auth   | Status | Input/output boundary                                                                                            | Source/test                                           |
| ---------------- | ------------------ | ------ | ------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `API-OTP-SEND`   | `POST /otp/send`   | Public | `MOCK` | Channel + purpose + destination; từ chối `MANAGE_SENSITIVE_PROFILE` vì purpose này phải đi qua account endpoint. | `apps/api/src/otp/otp.controller.ts`; OTP/integration |
| `API-OTP-VERIFY` | `POST /otp/verify` | Public | `MOCK` | Channel + purpose + destination + 6-digit code; trả one-time verification token.                                 | OTP controller/service; OTP/integration               |

## Wallet API

| ID                        | Method/path                               | Auth   | Status        | Input/output boundary                                                           | Source/test                                         |
| ------------------------- | ----------------------------------------- | ------ | ------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `API-WALLET-SUMMARY`      | `GET /wallet`                             | Access | `IMPLEMENTED` | Currency, balance, updatedAt; không storage IDs.                                | `apps/api/src/wallet`; vertical integration         |
| `API-WALLET-TRANSACTIONS` | `GET /wallet/transactions`                | Access | `IMPLEMENTED` | Page/pageSize/type/status/from/to/search; user-scoped public transaction items. | wallet controller/service; vertical integration     |
| `API-WALLET-EXPORT`       | `GET /wallet/transactions/export`         | Access | `IMPLEMENTED` | Cùng filters; CSV tối đa 10,000 rows.                                           | wallet controller/service; vertical integration     |
| `API-WALLET-DETAIL`       | `GET /wallet/transactions/:transactionNo` | Access | `IMPLEMENTED` | User-owned transaction detail, masked provider ID.                              | wallet controller/service; vertical integration/E2E |

## Payment API

| ID                          | Method/path                               | Auth             | Status        | Input/output boundary                                                  | Source/test                                            |
| --------------------------- | ----------------------------------------- | ---------------- | ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `API-PAYMENT-PACKAGES`      | `GET /coin-packages`                      | Public           | `IMPLEMENTED` | Active package list.                                                   | `apps/api/src/payment`; portal/payment integration     |
| `API-PAYMENT-CONFIG`        | `GET /payment-config`                     | Public           | `IMPLEMENTED` | Provider, supported methods, demo/mock flags.                          | payment service; payment E2E                           |
| `API-PAYMENT-CREATE`        | `POST /payments`                          | Access           | `PARTIAL`     | Package ID + method + optional idempotency key; trả public payment.    | payment controller/service; vertical/sepay integration |
| `API-PAYMENT-GET`           | `GET /payments/:paymentNo`                | Access           | `PARTIAL`     | User-owned payment; expire pending payment if needed.                  | payment service; vertical/sepay integration            |
| `API-PAYMENT-LIST`          | `GET /payments`                           | Access           | `PARTIAL`     | User payment history tối đa 100 item.                                  | payment service; vertical integration                  |
| `API-PAYMENT-MOCK-COMPLETE` | `POST /payments/:paymentNo/mock-complete` | Access, non-prod | `MOCK`        | Generate verified mock success callback; disabled production.          | payment service; vertical/sepay E2E                    |
| `API-PAYMENT-CALLBACK`      | `POST /payments/:provider/callback`       | Signature        | `MOCK`        | Verify mock callback signature và process payment callback.            | payment controller/provider; vertical integration      |
| `API-PAYMENT-SEPAY-WEBHOOK` | `POST /webhooks/sepay`                    | SePay signature  | `PARTIAL`     | Validate incoming transfer/account/amount/provider, credit TOPUP once. | SePay controller/service; sepay integration            |

## Support API

| ID                          | Method/path                      | Auth   | Status        | Input/output boundary                                      | Source/test                                         |
| --------------------------- | -------------------------------- | ------ | ------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `API-SUPPORT-FAQS`          | `GET /support/faqs`              | Public | `IMPLEMENTED` | Active categories/FAQs theo sort order.                    | `apps/api/src/support`; support integration/E2E     |
| `API-SUPPORT-TICKET-CREATE` | `POST /support/tickets`          | Access | `IMPLEMENTED` | Category ID + subject + description; tạo `NEW` ticket.     | support controller/service; support integration/E2E |
| `API-SUPPORT-TICKETS`       | `GET /support/tickets`           | Access | `IMPLEMENTED` | User-scoped list page/pageSize/filter.                     | support service; support integration/E2E            |
| `API-SUPPORT-TICKET-DETAIL` | `GET /support/tickets/:ticketNo` | Access | `IMPLEMENTED` | User-scoped detail; other user's ticket appears not found. | support service; support integration/E2E            |

## Game and portal API

| ID                      | Method/path                              | Auth   | Status        | Input/output boundary                                        | Source/test                               |
| ----------------------- | ---------------------------------------- | ------ | ------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `API-GAME-LIST`         | `GET /games`                             | Public | `IMPLEMENTED` | Public game summaries; status/genre/platform filters.        | `apps/api/src/game`; game integration     |
| `API-GAME-BY-SUBDOMAIN` | `GET /games/by-subdomain/:subdomain`     | Public | `IMPLEMENTED` | Public game detail/config by host context.                   | game service; game/portal integration     |
| `API-GAME-ARTICLE`      | `GET /games/:slug/articles/:articleSlug` | Public | `IMPLEMENTED` | Published safe article detail + related.                     | game service; game integration            |
| `API-GAME-ARTICLES`     | `GET /games/:slug/articles`              | Public | `IMPLEMENTED` | Published article list for game.                             | game service; game integration            |
| `API-GAME-ROADMAP`      | `GET /games/:slug/roadmap`               | Public | `IMPLEMENTED` | Roadmap milestones/checklists.                               | game service; game integration            |
| `API-GAME-DETAIL`       | `GET /games/:slug`                       | Public | `IMPLEMENTED` | Public game detail/theme/feature config/articles/milestones. | game service; game integration            |
| `API-PORTAL-HOME`       | `GET /portal/home`                       | Public | `IMPLEMENTED` | Announcement, hero/games, latest articles, active events.    | `apps/api/src/portal`; portal integration |
| `API-PORTAL-NEWS`       | `GET /portal/news`                       | Public | `IMPLEMENTED` | Published news page with game/category filters.              | portal service; portal integration        |
| `API-PORTAL-EVENTS`     | `GET /portal/events`                     | Public | `IMPLEMENTED` | Published events page with game/status filters.              | portal service; portal integration        |
| `API-PORTAL-EVENT`      | `GET /portal/events/:slug`               | Public | `IMPLEMENTED` | Event detail + safe HTML/SEO metadata.                       | portal service; portal integration        |

## Admin API (Phase 1)

| ID                              | Method/path                                             | Auth                         | Status        | Input/output boundary                                                                                 | Source/test                                      |
| ------------------------------- | ------------------------------------------------------- | ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `API-ADMIN-ME`                  | `GET /admin/me`                                         | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Admin summary, role và profile.                                                                        | `apps/api/src/admin`; admin integration          |
| `API-ADMIN-DASHBOARD`           | `GET /admin/dashboard`                                  | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | User totals/status counts, registrations 7 ngày, recent users/activity.                               | admin service; admin integration                 |
| `API-ADMIN-USERS`               | `GET /admin/users`                                      | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Search/filter/page user summaries, không password/hash/sensitive payload.                              | admin service; admin integration                 |
| `API-ADMIN-USER`                | `GET /admin/users/:userId`                              | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Account/profile/roles/social, wallet read-only, recent ledger và related audit.                         | admin service; admin integration                 |
| `API-ADMIN-USER-PROFILE`        | `PATCH /admin/users/:userId/profile`                    | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Full basic/contact profile, verified flags, reason và `expectedUpdatedAt`.                             | admin service; admin integration                 |
| `API-ADMIN-USER-STATUS`         | `PATCH /admin/users/:userId/status`                     | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Chuyển `ACTIVE`/`SUSPENDED`, revoke token/session, reason và optimistic concurrency.                    | admin service; admin integration                 |
| `API-ADMIN-REVOKE-SESSIONS`     | `POST /admin/users/:userId/revoke-sessions`             | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Tăng `authVersion`, revoke refresh sessions, reason.                                                    | admin service; admin integration                 |
| `API-ADMIN-RESET-PASSWORD`      | `POST /admin/users/:userId/reset-password`              | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Hash mật khẩu tạm, bắt đổi lần login tiếp theo, revoke sessions, reason.                               | admin service; admin integration                 |
| `API-ADMIN-SENSITIVE-REVEAL`    | `POST /admin/users/:userId/sensitive-profile/reveal`   | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Reason bắt buộc; trả CCCD plaintext sau audit; không secret/ciphertext.                                | admin service; admin integration                 |
| `API-ADMIN-AUDIT-LOGS`          | `GET /admin/audit-logs`                                | Access + `SUPER_ADMIN`       | `IMPLEMENTED` | Page/filter actor/action/target/date, metadata đã redact.                                               | admin service; admin integration                 |

## Platform API

| ID                                                                                                                                     | Method/path   | Auth            | Status        | Purpose                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | ------------- | -------------------------------------------------- |
| `API-HEALTH`                                                                                                                           | `GET /health` | Public/internal | `IMPLEMENTED` | Reports API status, database status and timestamp. |
| SePay ingress được ghi ở `API-PAYMENT-SEPAY-WEBHOOK` trong bảng Payment API; đây là một route duy nhất, không tạo thêm alias tracking. |

## Non-controller HTTP surfaces

Các surface này được mount trong `apps/api/src/main.ts`, không phải method của controller; chúng vẫn được tracking vì có HTTP behavior observable.

| ID                | Method/path      | Auth               | Status        | Purpose                                                 | Source/test                                          |
| ----------------- | ---------------- | ------------------ | ------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `SURFACE-SWAGGER` | `GET /docs`      | Internal/developer | `INTERNAL`    | Swagger UI và OpenAPI explorer cho API runtime.         | `apps/api/src/main.ts`; manual local smoke           |
| `SURFACE-UPLOADS` | `GET /uploads/*` | Public asset URL   | `IMPLEMENTED` | Serve avatar/static uploads từ configured `UPLOAD_DIR`. | `apps/api/src/main.ts`, account service; account E2E |

## Data model boundary

| Model/table                                                       | Dữ liệu chính                                                                | Public exposure                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| `User` / `users`                                                  | Identity login, email/phone, status, verification timestamps, authVersion, forced-password flag, password hash. | Public account fields đã lọc; không passwordHash.       |
| `UserRole` / `user_roles`                                         | User-to-role assignments; Phase 1 dùng `SUPER_ADMIN`.                     | Chỉ admin authorization; không public.                  |
| `AdminAuditLog` / `admin_audit_logs`                               | Append-only admin action, actor/target, reason, safe metadata, request context. | Chỉ `SUPER_ADMIN` qua audit API.                        |
| `UserProfile` / `user_profiles`                                   | Basic profile, avatar, DOB/gender/city/address, terms/privacy.               | `AccountMe.profile`; không sensitive identity.          |
| `SensitiveProfile` / `sensitive_profiles`                         | AES-GCM CCCD payload/metadata, Argon2 code/answer hashes, version/lockout.   | Summary masked hoặc reveal sau sensitive token.         |
| `SecurityQuestion` / `security_questions`                         | Code, Vietnamese label, sort order, active flag.                             | Active options qua account questions endpoint.          |
| `OtpRequest` / `otp_requests`                                     | Destination, purpose/channel, code hash, attempts/expiry/status.             | Không public trực tiếp.                                 |
| `OtpVerification` / `otp_verifications`                           | One-time token hash, purpose, expiry/consumedAt.                             | Chỉ raw token một lần ở verify response.                |
| `SocialIdentity` / `social_identities`                            | Provider identity/link/login timestamps.                                     | Chỉ boolean provider flags ở account response.          |
| `RefreshSession` / `refresh_sessions`                             | Refresh token hash, expiry, revocation và rotation link.                     | Không public trực tiếp; chỉ cookie rotation.            |
| `Wallet` / `wallets`                                              | User currency/balance.                                                       | Summary currency/balance/update time.                   |
| `WalletTransaction` / `wallet_transactions`                       | Ledger amount, before/after, type/status/reference/idempotency.              | Public safe transaction; storage IDs loại bỏ.           |
| `CoinPackage` / `coin_packages`                                   | Active package price/coin/sort.                                              | Public active list.                                     |
| `Payment` / `payments`                                            | Payment lifecycle/provider payload/callback metadata.                        | Public payment fields; payload secrets/storage IDs lọc. |
| `SupportCategory`, `SupportFaq`, `SupportTicket`                  | FAQ catalog và user ticket lifecycle.                                        | FAQ public; ticket user-scoped.                         |
| `Game`, `Genre`, `GameGenre`, `GamePlatform`                      | Public game catalog, genre/platform joins, filtering và host mapping.        | Public summaries/details theo `isPublic`.               |
| `GameArticle`, `GameMilestone`, `GameEvent`, `PortalAnnouncement` | Published content, roadmap, events, announcement windows.                    | Public khi status/time/isPublic rules pass.             |

## Error/status conventions

- Auth/session: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_SUSPENDED`, `VERIFICATION_TOKEN_INVALID`.
- Identity uniqueness: `USERNAME_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS`, `CITIZEN_ID_ALREADY_EXISTS`.
- OTP: `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `OTP_ALREADY_USED`.
- Sensitive profile: `INVALID_SENSITIVE_PROFILE`, `INVALID_SENSITIVE_CHALLENGE`, `SENSITIVE_CHALLENGE_LOCKED`, `SENSITIVE_PROFILE_OTP_UNAVAILABLE`, `SENSITIVE_ACCESS_TOKEN_INVALID`, `SENSITIVE_SECURITY_REQUIRED`.
- Wallet/payment: `INSUFFICIENT_BALANCE`, `PAYMENT_NOT_FOUND`, `PAYMENT_FAILED`, `INVALID_PAYMENT_CALLBACK`, `PAYMENT_ALREADY_PROCESSED` và các filter/idempotency errors.
- Content/support: `GAME_NOT_FOUND`, `GAME_ARTICLE_NOT_FOUND`, `PORTAL_EVENT_NOT_FOUND`, `SUPPORT_CATEGORY_NOT_FOUND`, `SUPPORT_TICKET_NOT_FOUND`.
- Admin: `ADMIN_ACCESS_REQUIRED`, `ADMIN_SELF_ACTION_FORBIDDEN`, `LAST_SUPER_ADMIN_PROTECTED`, `PASSWORD_CHANGE_REQUIRED`, `STALE_ADMIN_UPDATE`, `ADMIN_CONTACT_VERIFICATION_REQUIRED`, `ADMIN_STATUS_TRANSITION_INVALID`.

## Test evidence and gaps

- API unit suites nằm cạnh service trong `apps/api/src/**/*.spec.ts`: config, OTP, payment provider, social, support, sensitive profile và common guards/normalization/serialization/domain policy/web-domain.
- Integration inventory: `apps/api/test/integration/*.integration.spec.ts`.
- Browser flows: `apps/web/e2e/*.spec.ts`.
- Test gap: OAuth provider thật và payment provider ngoài mock/SePay chưa có source implementation. CMS và staff/support admin operations vẫn deferred; account-admin API/UI đã có integration/browser coverage.
