# Admin — Phase 1, Phase 2, Phase 3 & Finance Operations

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-06
>
> Verified commit: `788f781`
>
> Phạm vi: Account operations (Phase 1), Support operations (Phase 2), Content CMS (Phase 3) và Finance Operations (Phase 4)

## Mục đích

Tài liệu này là source of truth cho khu vực quản trị Phase 1/2 của ZENX GO. Nó mô tả hành vi đang có trong source, ranh giới bảo mật, contract API, màn hình, cách bootstrap và các known gaps cần xử lý trước production.

Phase 1 ưu tiên vận hành tài khoản; Phase 2 bổ sung vận hành support; Phase 3 bổ sung CMS game/content cơ bản; Phase 4 bổ sung quản trị gói nạp, payment và wallet adjustment cho `SUPER_ADMIN`.

## Trạng thái hiện tại

| Hạng mục                          | Trạng thái        | Ghi chú                                                                                    |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| Admin web tại `/admin`            | `IMPLEMENTED`     | Dùng chung root domain và session portal.                                                  |
| Role storage/RBAC                 | `IMPLEMENTED`     | Có bảng `user_roles`; Phase 1 `SUPER_ADMIN`, Phase 2 thêm `SUPPORT`.                       |
| Dashboard user KPI                | `IMPLEMENTED`     | Tổng user, status counts và user mới.                                                      |
| User list/detail                  | `IMPLEMENTED`     | Search/filter/pagination và dữ liệu vận hành an toàn.                                      |
| Profile/status/session operations | `IMPLEMENTED`     | Cập nhật trực tiếp, kiểm tra concurrency và token invalidation.                            |
| Temporary password                | `IMPLEMENTED`     | Bắt buộc user đổi sau lần login tiếp theo.                                                 |
| Admin CCCD reveal                 | `IMPLEMENTED`     | Không yêu cầu re-auth theo quyết định Phase 1.                                              |
| Multi-role permission UI          | `NOT IMPLEMENTED` | Chưa có màn hình cấp/gỡ role.                                                              |
| Support operations                | `IMPLEMENTED`     | Role `SUPPORT`, queue, conversation, unread và FAQ management; chi tiết ở `04-support.md`. |
| Content CMS                       | `IMPLEMENTED`     | `SUPER_ADMIN` quản lý game cơ bản, article, event và portal announcement; chi tiết ở `05-game-hub-content.md`. |
| Finance operations                | `IMPLEMENTED`     | Gói nạp, payment search/actions, ledger/export và cộng/trừ Coin thủ công; chỉ `SUPER_ADMIN`. |

## Access model

### Role

Phase 1/2/3/4 có các role được hỗ trợ:

| Role          | Ý nghĩa                                                                                 | Cách cấp                    |
| ------------- | --------------------------------------------------------------------------------------- | --------------------------- |
| `SUPER_ADMIN` | Toàn quyền trên các endpoint admin Phase 1/2/3/4, gồm finance.                            | CLI idempotent, chưa có UI. |
| `SUPPORT`     | Chỉ support queue, conversation và FAQ; không user-management/CCCD/wallet.               | CLI idempotent, chưa có UI. |

Role được đọc trực tiếp từ database bởi `AdminGuard` cho mỗi request. Không lưu role trong access JWT để tránh quyền cũ tồn tại sau khi bị gỡ.

### Authentication flow

1. Người dùng mở `/admin`.
2. Nếu chưa có access cookie hợp lệ, `AdminShell` chuyển về `/auth/login?returnTo=/admin`.
3. `AuthGuard` kiểm tra HttpOnly access cookie, JWT `type=access`, user tồn tại, status, `authVersion` và forced-password state.
4. `AdminGuard` kiểm tra user có role phù hợp với route (`SUPER_ADMIN` hoặc `SUPPORT`) đang tồn tại trong database.
5. User không có role nhận `403 ADMIN_ACCESS_REQUIRED`; UI cho phép về portal hoặc đăng xuất.

Access token bị vô hiệu hóa khi `authVersion` thay đổi. Refresh session cũng bị revoke trong các thao tác làm thay đổi định danh, status, mật khẩu hoặc session.

### Forced password

Khi admin đặt mật khẩu tạm:

- `passwordHash` được lưu bằng Argon2.
- `mustChangePassword=true`.
- `authVersion` tăng và refresh sessions bị revoke.
- Login bằng mật khẩu tạm vẫn được phép.
- Chỉ `/account/me` và `/account/change-password` được gọi trong trạng thái pending; API protected khác trả `PASSWORD_CHANGE_REQUIRED`.
- Sau khi user đổi mật khẩu, cờ được xóa, token/session cũ bị vô hiệu hóa và frontend đưa user về login.

## Admin surface

| Screen ID             | Route                   | Mục đích                                                                 | API chính                                     |
| --------------------- | ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| `SCR-ADMIN-HOME`      | `/admin`                | KPI user và user mới.                                                     | `GET /admin/me`, `GET /admin/dashboard`       |
| `SCR-ADMIN-USERS`     | `/admin/users`          | Search, filter status, pagination.                                       | `GET /admin/users`                            |
| `SCR-ADMIN-USER`      | `/admin/users/[userId]` | Hồ sơ, status, session, password, CCCD summary/reveal, wallet view và adjustment cho `SUPER_ADMIN`. | `GET /admin/users/:userId`, các mutation user/finance |
| `SCR-ADMIN-CONTENT`   | `/admin/content/*`      | CMS game, article, event và announcement; chỉ `SUPER_ADMIN`.            | `GET/PATCH /admin/content/*`                 |
| `SCR-ADMIN-FINANCE`   | `/admin/finance`        | KPI payment, doanh thu/refund và payment pending lâu nhất.              | `GET /admin/finance/dashboard`               |
| `SCR-ADMIN-PACKAGES`  | `/admin/finance/packages` | CRUD gói nạp, active/inactive và xóa gói chưa từng dùng.              | `GET/POST/PATCH/DELETE /admin/finance/coin-packages` |
| `SCR-ADMIN-PAYMENTS`  | `/admin/finance/payments*` | Search/detail và command success/fail/expire/cancel/refund.            | `GET /admin/finance/payments*`, payment commands |
| `SCR-ADMIN-LEDGER`    | `/admin/finance/transactions` | Ledger toàn hệ thống, filter và CSV export.                            | `GET /admin/finance/transactions*`            |

`AdminShell` là layout riêng, không dùng player `AppShell`. Mọi screen có loading/error/empty state và mutation pending state cơ bản.

Support screens và API được mô tả đầy đủ trong [Support](./04-support.md), gồm `/admin/support`, ticket conversation, unread state và FAQ management.

## User operations

### Read

Admin detail trả:

- username, email, phone, status và verification timestamps;
- basic profile: full name, DOB, gender, city, address, avatar và completion state;
- social identities ở mức provider/timestamp, không có provider secret;
- role codes;
- wallet currency/balance và giao dịch gần nhất ở chế độ read-only;
- sensitive summary: CCCD configured/last4 và security configured; không trả ciphertext, hash, secret code hoặc security answer;

Danh sách và detail không trả `passwordHash`, OTP hash, refresh token hash, sensitive ciphertext/IV/auth tag hoặc security hashes.

### Update basic profile

`PATCH /admin/users/:userId/profile` hỗ trợ username, email, phone, full name, DOB, gender, city, address, email verified flag và phone verified flag.

Rules:

- Username/email/phone được normalize và kiểm tra unique.
- Phone có thể clear về `null`, nhưng không thể verified khi rỗng.
- Admin phải chọn verified state khi thay đổi email hoặc phone.
- Thay đổi username/email/phone tăng `authVersion` và revoke refresh sessions.
- Request phải có `expectedUpdatedAt`.
- Conflict trả `409 STALE_ADMIN_UPDATE`.

### Status

- Admin chỉ chuyển `ACTIVE ↔ SUSPENDED`.
- `LOCKED` là trạng thái do security flow; admin chỉ xem, không gỡ bằng endpoint Phase 1.
- Status change tăng `authVersion` và revoke refresh sessions.
- Không cho admin suspend chính mình.
- Không cho làm mất admin active cuối cùng theo rule hiện tại.

### Sessions and password

- `POST /admin/users/:userId/revoke-sessions` tăng `authVersion` và revoke refresh sessions.
- `POST /admin/users/:userId/reset-password` nhận temporary password + confirmation và bắt buộc user đổi sau login.
- Password phải có tối thiểu 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.

### Sensitive identity

`POST /admin/users/:userId/sensitive-profile/reveal`:

- đọc và giải mã CCCD trong service;
- trả citizen ID, ngày cấp và nơi cấp;
- không yêu cầu admin nhập lại mật khẩu theo quyết định Phase 1;
- không trả secret code, security answer, hashes hoặc encryption metadata.

CCCD được lưu AES-256-GCM ở `SensitiveProfile`; admin detail chỉ nhận summary masked trước khi reveal.

## API contract

Base path: `/api/v1`.

| API ID                       | Method/path                                          | Auth                   | Input chính                                                     | Output chính                               |
| ---------------------------- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `API-ADMIN-ME`               | `GET /admin/me`                                      | Access + `SUPER_ADMIN`/`SUPPORT` | —                                                               | Admin summary/role/profile.                |
| `API-ADMIN-DASHBOARD`        | `GET /admin/dashboard`                               | Access + `SUPER_ADMIN` | —                                                               | User totals/status counts/recent users.    |
| `API-ADMIN-USERS`            | `GET /admin/users`                                   | Access + `SUPER_ADMIN` | `page`, `pageSize`, `search`, `status`                          | Paginated user summaries.                  |
| `API-ADMIN-USER`             | `GET /admin/users/:userId`                           | Access + `SUPER_ADMIN` | UUID                                                            | User detail + wallet summary.              |
| `API-ADMIN-USER-PROFILE`     | `PATCH /admin/users/:userId/profile`                 | Access + `SUPER_ADMIN` | Profile fields, verified flags, `expectedUpdatedAt`             | Updated user detail.                       |
| `API-ADMIN-USER-STATUS`      | `PATCH /admin/users/:userId/status`                  | Access + `SUPER_ADMIN` | `status`, `expectedUpdatedAt`                                   | Updated user detail.                       |
| `API-ADMIN-REVOKE-SESSIONS`  | `POST /admin/users/:userId/revoke-sessions`          | Access + `SUPER_ADMIN` | —                                                               | `{ revoked: true }`.                       |
| `API-ADMIN-RESET-PASSWORD`   | `POST /admin/users/:userId/reset-password`           | Access + `SUPER_ADMIN` | Temporary password, confirmation, `expectedUpdatedAt`           | `{ reset: true }`.                         |
| `API-ADMIN-SENSITIVE-REVEAL` | `POST /admin/users/:userId/sensitive-profile/reveal` | Access + `SUPER_ADMIN` | —                                                               | Identity plaintext or `null`.              |

All JSON responses follow `{ data, error }`. Browser mutations remain protected by `OriginGuard`.

## Finance operations — Phase 4

Finance routes chỉ yêu cầu `SUPER_ADMIN`; `SUPPORT` nhận `403 ADMIN_ACCESS_REQUIRED`. Payment và wallet transaction không có API sửa field trực tiếp hoặc xóa.

| Nhóm | Route | Hành vi |
| --- | --- | --- |
| Packages | `GET/POST/PATCH/DELETE /admin/finance/coin-packages` | Quản lý giá VND, Coin, trạng thái và thứ tự; xóa chỉ khi `INACTIVE` và chưa có payment. |
| Payment read | `GET /admin/finance/dashboard`, `/payments`, `/payments/:paymentNo` | KPI, tìm kiếm/lọc/phân trang, detail user/package/provider payload đã lọc. |
| Payment commands | `POST .../confirm-success`, `/fail`, `/expire`, `/cancel`, `/refund` | Transition hợp lệ, optimistic concurrency; success/refund cập nhật payment và ledger trong cùng transaction. |
| Ledger | `GET /admin/finance/transactions`, `/transactions/export` | Tra cứu/export tối đa 10.000 dòng; provider transaction trong list/CSV được mask. |
| Wallet adjustment | `POST /admin/finance/users/:userId/wallet/credit`, `/debit` | Tạo bút toán `CREDIT`/`DEBIT` với `clientRequestId`; debit không cho số dư âm và request lặp idempotent. |

Manual success yêu cầu provider transaction ID nếu payment chưa có. Refund chỉ áp dụng payment `SUCCESS`, thu hồi đúng số Coin và từ chối khi ví không đủ số dư. Các thao tác dùng xác nhận UI đơn giản, không yêu cầu re-auth hoặc reason bắt buộc.

Admin content API, UI và các giới hạn CMS được canonical hóa trong [Game Hub & Content](./05-game-hub-content.md). `SUPER_ADMIN` dùng chung session/RBAC với Phase 1; `SUPPORT` không được truy cập content routes.

## Support operations — Phase 2

`SUPPORT` và `SUPER_ADMIN` dùng chung các route dưới đây. `SUPPORT` chỉ nhận limited user summary trong ticket; không truy cập user-management, CCCD, wallet hoặc password.

| Nhóm | Route | Hành vi |
| --- | --- | --- |
| Queue | `GET /admin/support/dashboard`, `/agents`, `/tickets`, `/tickets/:ticketNo` | KPI, agent active, search/filter/pagination và detail ticket. |
| Workflow | `POST /admin/support/tickets/:ticketNo/claim`, `PATCH /admin/support/tickets/:ticketNo` | Claim/reassign, priority, status; mutation yêu cầu `expectedUpdatedAt`. |
| Conversation | `GET/POST /admin/support/tickets/:ticketNo/messages`, `POST .../read` | Public reply (phải là assignee), internal note, read cursor riêng từng agent. |
| FAQ | `GET /admin/support/faqs`, `POST/PATCH /admin/support/categories`, `POST/PATCH /admin/support/faqs` | Category/FAQ active toggle, sort order, không hard-delete. |

Workflow ticket: `NEW → IN_PROGRESS → WAITING_USER → IN_PROGRESS → RESOLVED → CLOSED`; `CLOSED` là trạng thái cuối. Customer chỉ reopen `RESOLVED` trong 7 ngày. Message bất biến và FAQ answer chỉ nhận limited Markdown (paragraph, line break, bold, italic, list, link `http/https`, inline code).

User-facing conversation routes là `GET/POST /support/tickets/:ticketNo/messages`, `POST /support/tickets/:ticketNo/read` và `GET /support/unread-count`; internal note không bao giờ trả qua các route này.

## Data model

### `User` additions

| Field                              | Purpose                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `authVersion INT DEFAULT 0`        | Invalidate access/refresh tokens immediately after security-sensitive operations. |
| `mustChangePassword BIT DEFAULT 0` | Enforce temporary-password flow.                                                  |

### `UserRole`

`user_roles` stores `(user_id, role)` with a unique compound key and role index. Phase 1 dùng `SUPER_ADMIN`, Phase 2 dùng thêm `SUPPORT`; user deletion cascades to assignments.

Migration: `202609030003_admin_phase1`, `202609030004_support_operations`, `202609030005_support_opening_messages`, `202609040001_remove_admin_audit`, `202609050004_finance_operations`.

### Support data model

- `SupportTicket` thêm priority, assignee và các activity/resolved/closed timestamps.
- `SupportTicketMessage` lưu text bất biến với `CUSTOMER/STAFF` và `PUBLIC/INTERNAL`.
- `SupportTicketReadState` lưu `lastReadAt` theo cặp ticket/user, để unread của customer và từng agent độc lập.
- Migration `202609030005_support_opening_messages` backfill description hiện tại thành opening public message; ticket mới cũng tạo opening message trong cùng transaction.

### Content data model

Phase 3 dùng các bảng hiện tại `Game`, `GameArticle`, `GameEvent` và `PortalAnnouncement`; không thêm migration. CMS cho phép SUPER_ADMIN cập nhật nội dung/media/CTA/trạng thái cơ bản và code/slug/subdomain của `Game`; cấu hình nâng cao chỉ đọc, cập nhật dùng optimistic concurrency và không giữ alias URL cũ. Draft không được trả bởi public API.

## Bootstrap and operations

Grant the first role to an existing user:

```bash
pnpm db:migrate
pnpm admin:role grant --email=existing-user@example.com
```

Grant/revoke a support agent:

```bash
pnpm admin:role grant --email=support@example.com --role=SUPPORT
pnpm admin:role revoke --email=support@example.com --role=SUPPORT
```

The command is idempotent and does not create or print a password. Role removal is available with `revoke`; the command protects the last active `SUPER_ADMIN`.

Operational checklist:

1. Apply migration successfully in the target environment.
2. Confirm the target user has a valid password and intended account status.
3. Grant `SUPER_ADMIN` to the smallest possible number of users.
4. Open `/admin`, verify dashboard and user search.
5. Verify finance package/payment/ledger controls after applying `202609050004_finance_operations`; wallet mutations are available only to `SUPER_ADMIN` through the finance routes.

## Error codes

| Code                                  | Meaning                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| `ADMIN_ACCESS_REQUIRED`               | Session is valid but user has no admin role.                |
| `ADMIN_SELF_ACTION_FORBIDDEN`         | Admin attempted a forbidden operation on their own account. |
| `LAST_SUPER_ADMIN_PROTECTED`          | Operation would remove the last active super admin.         |
| `PASSWORD_CHANGE_REQUIRED`            | User must change temporary password first.                  |
| `STALE_ADMIN_UPDATE`                  | `expectedUpdatedAt` no longer matches.                      |
| `ADMIN_CONTACT_VERIFICATION_REQUIRED` | New email/phone lacks explicit verified choice.             |
| `ADMIN_NO_CHANGES`                    | Profile request contains no changes.                        |
| `ADMIN_STATUS_TRANSITION_INVALID`     | Status is not editable by Phase 1 admin flow.               |
| `COIN_PACKAGE_CODE_EXISTS`             | Mã gói nạp đã tồn tại.                                      |
| `COIN_PACKAGE_IN_USE`                  | Gói nạp đã có payment history.                             |
| `COIN_PACKAGE_MUST_BE_INACTIVE`        | Phải ngừng bán trước khi xóa gói.                           |
| `FINANCE_STALE_UPDATE`                 | Payment/package đã thay đổi bởi request khác.               |
| `FINANCE_PAYMENT_TRANSITION_INVALID`   | Payment không thể chuyển sang trạng thái đích.             |
| `FINANCE_PROVIDER_TRANSACTION_EXISTS`  | Provider transaction ID thiếu hoặc đã được dùng.            |
| `FINANCE_INVALID_AMOUNT`               | Amount phải là số nguyên dương.                             |
| `CONTENT_NOT_FOUND`                    | Game/article/event/announcement không tồn tại.               |
| `CONTENT_SLUG_EXISTS`                  | Slug hoặc announcement code đã tồn tại.                     |
| `CONTENT_INVALID_URL`                  | Asset hoặc CTA URL không nằm trong allowlist.                |
| `CONTENT_INVALID_STATE`                | Status/date/Markdown state không hợp lệ.                    |

## Test evidence

| Layer       | Coverage                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit        | `apps/api/src/admin/admin.guard.spec.ts`, `apps/api/src/auth/auth.guard.spec.ts`, content Markdown/URL validation specs. |
| Integration | `apps/api/test/integration/admin.integration.spec.ts`, `support-admin.integration.spec.ts`, `content-admin.integration.spec.ts`, `finance-admin.integration.spec.ts`: access boundaries, queue/workflow, CMS draft/publish, payment transitions, refund, ledger idempotency và conflict. |
| Browser     | `apps/web/e2e/admin.spec.ts`, `support-admin.spec.ts`, `content-admin.spec.ts`, `finance-admin.spec.ts`: admin/support/CMS/finance flows trên Chromium. |
| Regression  | Existing auth/account/support/payment/game integration and browser suites.                                                                                                                                         |

## Known gaps before production

Các mục sau đã được phát hiện khi review implementation và chưa được coi là resolved:

1. **Concurrent last-admin race:** hai request suspend chéo có thể cùng pass count check nếu không dùng locking/Serializable transaction.
2. **Profile concurrency:** `expectedUpdatedAt` hiện dựa trên `User.updatedAt`, trong khi user basic profile update chủ yếu chạm `UserProfile.updatedAt`.
3. **Verification timestamp:** client hiện gửi cả hai verification flags trong mỗi lần save; backend có thể cập nhật lại `verifiedAt` dù trạng thái không đổi.
4. **Active-status bootstrap:** bootstrap/AdminGuard nên ràng buộc admin user ở status `ACTIVE`; hiện account boundary không loại `PENDING`.
5. **MFA/step-up:** CCCD reveal hiện không yêu cầu re-auth/MFA theo quyết định Phase 1; cần đánh giá lại trước production có dữ liệu thật.

## Out of scope

- CMS nâng cao: role editor/game-admin, media library, WYSIWYG, scheduled publish, revision/approval, theme/feature builder, genre/platform/roadmap editor và tạo/xóa game.
- Role management UI và permission matrix nhiều role.
- MFA/SSO riêng cho admin.
- Admin subdomain, DNS/TLS boundary riêng.
- User create/delete và chỉnh sửa sensitive profile.

Các phần trên sẽ được tách thành phase riêng để tránh mở rộng phạm vi CMS cơ bản.
