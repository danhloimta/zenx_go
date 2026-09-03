# System overview

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

## Phạm vi hệ thống

ZENX GO là monorepo TypeScript gồm cổng tài khoản, ví ZENX Coin, payment/support và lớp Game Hub phục vụ nhiều game trên subdomain dùng chung session.

| Layer     | Công nghệ/source                        | Vai trò                                                                |
| --------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Web       | Next.js App Router — `apps/web`         | Render portal, account pages, game sites và các client-side flow.      |
| API       | NestJS — `apps/api/src`                 | Auth, account, OTP, wallet, payment, support, game và portal REST API. |
| Data      | Prisma + SQL Server — `apps/api/prisma` | Persistence, migration, seed và transaction/ledger.                    |
| Workspace | pnpm + Turborepo                        | Build, typecheck, lint và test theo package/app.                       |

## Host và routing

| Host/context                                                | Hành vi                                                                                  | Status        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------- |
| Root portal (`zenxgo.io.vn`, local `lvh.me`)                | Homepage, catalog, content, auth, account, wallet, payment, support, legal.              | `IMPLEMENTED` |
| Game subdomain (`lucdia`, `hoalong`, `thitranmay`, `orion`) | Middleware rewrite sang `/game-site/[gameKey]`, dùng dữ liệu game để dựng theme/content. | `IMPLEMENTED` |
| `/preview/games/[slug]`                                     | Preview game trên root portal khi không dùng wildcard host.                              | `INTERNAL`    |
| `/game-site/[gameKey]/tai-game`                             | Distribution URL chưa có, middleware/page chủ động trả 404.                              | `HIDDEN`      |
| `/_host-error`                                              | Fallback khi truy cập game-site trên host không hợp lệ.                                  | `INTERNAL`    |
| `/docs`                                                     | Swagger UI cho REST contract ở API runtime.                                              | `INTERNAL`    |
| `/uploads/*`                                                | Static asset serving cho avatar upload từ `UPLOAD_DIR`.                                  | `IMPLEMENTED` |

Middleware bỏ qua `/api`, `_next` và asset; kiểm tra base domain, game subdomain được cấu hình, canonical redirect cho `www`, rồi rewrite host game sang internal route. Session cookie dùng chung `.lvh.me` ở local và `COOKIE_DOMAIN` ở production.

## API boundary

- Global prefix là `/api/v1`.
- Swagger UI được mount tại `/docs`; đây là technical surface, không phải controller endpoint.
- Express static middleware mount `/uploads`; file avatar được lưu dưới `/uploads/avatars/`.
- `AuthGuard` đọc access cookie, kiểm tra JWT type `access`, account status và user tồn tại.
- `OriginGuard` bảo vệ các browser mutation; webhook/payment callback có decorator bỏ qua origin khi cần.
- Response interceptor chuẩn hóa envelope `{ data, error }`, ngoại trừ webhook đã đánh dấu skip.
- Global validation bật `whitelist`, `transform` và `forbidUnknownValues`.
- Global throttler cung cấp rate limit nền; OTP, challenge và webhook có rule riêng ở domain/service.

## Module inventory

| ID                  | Module                    | Source                                                                       | API/controller                                     | Test evidence                                       | Status        |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- | ------------- |
| `FEAT-PLATFORM-001` | App/config/database       | `apps/api/src/app.module.ts`, `apps/api/src/config`, `apps/api/src/database` | Health, global guards/interceptors                 | `apps/api/src/config/*.spec.ts`, integration suites | `IMPLEMENTED` |
| `FEAT-AUTH-001`     | Authentication/social     | `apps/api/src/auth`, `apps/api/src/social`                                   | `/auth/*`                                          | vertical slice, social specs, auth E2E              | `IMPLEMENTED` |
| `FEAT-ACCOUNT-001`  | Account/profile/security  | `apps/api/src/account`                                                       | `/account/*`                                       | vertical slice, sensitive integration, account E2E  | `IMPLEMENTED` |
| `FEAT-OTP-001`      | OTP delivery/verification | `apps/api/src/otp`                                                           | `/otp/*`                                           | OTP unit/integration coverage                       | `MOCK`        |
| `FEAT-WALLET-001`   | Wallet ledger             | `apps/api/src/wallet`                                                        | `/wallet/*`                                        | vertical slice integration, wallet E2E              | `IMPLEMENTED` |
| `FEAT-PAYMENT-001`  | Payment orchestration     | `apps/api/src/payment`                                                       | `/coin-packages`, `/payment-config`, `/payments/*` | SePay/payment integration, E2E                      | `PARTIAL`     |
| `FEAT-SUPPORT-001`  | FAQ/tickets               | `apps/api/src/support`                                                       | `/support/*`                                       | support integration/E2E                             | `IMPLEMENTED` |
| `FEAT-GAME-001`     | Game catalog/sites        | `apps/api/src/game`, `apps/web/app/(game)`                                   | `/games/*`, internal game-site pages               | game/portal integration, portal E2E                 | `IMPLEMENTED` |
| `FEAT-CONTENT-001`  | Portal news/events        | `apps/api/src/portal`, `apps/web/app/news`, `apps/web/app/events`            | `/portal/*`                                        | portal integration/E2E                              | `IMPLEMENTED` |

## Shared lifecycle states

- Loading và error state phải được mô tả ở screen catalog, không coi skeleton là dữ liệu.
- Empty state hiển thị khi API trả danh sách rỗng; không chèn sample data vào account/content.
- `MOCK` chỉ mô tả provider/flow demo, không được ghi là production payment/OTP.
- Auth-required screen redirect về login hoặc onboarding theo state từ account query.
- Data nhạy cảm (CCCD, secret code, secret answer) không đi qua `GET /account/me`; chỉ summary masked hoặc reveal sau challenge.

## Test/runtime references

- Local setup, `/docs` API explorer và quality gates: root `README.md`.
- API integration dùng database có hậu tố `_test` và migration/seed hiện hành.
- Browser E2E chạy root portal và game hosts trên isolated ports, kiểm tra desktop/mobile ở các suite tương ứng.
