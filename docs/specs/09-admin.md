# Admin — Phase 1 & Phase 2

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `788f781`
>
> Phạm vi: Admin account operations (Phase 1) và Support operations (Phase 2)

## Mục đích

Tài liệu này là source of truth cho khu vực quản trị Phase 1/2 của ZENX GO. Nó mô tả hành vi đang có trong source, ranh giới bảo mật, contract API, màn hình, cách bootstrap và các known gaps cần xử lý trước production.

Phase 1 ưu tiên vận hành tài khoản; Phase 2 bổ sung vận hành support. CMS game/content, payment operations và điều chỉnh số dư Coin chưa nằm trong phạm vi.

## Trạng thái hiện tại

| Hạng mục                          | Trạng thái        | Ghi chú                                                                                    |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| Admin web tại `/admin`            | `IMPLEMENTED`     | Dùng chung root domain và session portal.                                                  |
| Role storage/RBAC                 | `IMPLEMENTED`     | Có bảng `user_roles`; Phase 1 `SUPER_ADMIN`, Phase 2 thêm `SUPPORT`.                       |
| Dashboard user KPI                | `IMPLEMENTED`     | Tổng user, status counts, user mới và admin activity.                                      |
| User list/detail                  | `IMPLEMENTED`     | Search/filter/pagination và dữ liệu vận hành an toàn.                                      |
| Profile/status/session operations | `IMPLEMENTED`     | Có reason, audit và token invalidation.                                                    |
| Temporary password                | `IMPLEMENTED`     | Bắt buộc user đổi sau lần login tiếp theo.                                                 |
| Admin CCCD reveal                 | `IMPLEMENTED`     | Reason bắt buộc; không yêu cầu re-auth theo quyết định Phase 1.                            |
| Audit log API                     | `IMPLEMENTED`     | Append-only ở application boundary.                                                        |
| Audit log đầy đủ trên UI          | `PARTIAL`         | UI hiện chưa expose hết filter actor/date và metadata.                                     |
| Multi-role permission UI          | `NOT IMPLEMENTED` | Chưa có màn hình cấp/gỡ role.                                                              |
| Support operations                | `IMPLEMENTED`     | Role `SUPPORT`, queue, conversation, unread và FAQ management; chi tiết ở `04-support.md`. |

## Access model

### Role

Phase 1/2 có các role được hỗ trợ:

| Role          | Ý nghĩa                                                                                 | Cách cấp                    |
| ------------- | --------------------------------------------------------------------------------------- | --------------------------- |
| `SUPER_ADMIN` | Toàn quyền trên các endpoint admin Phase 1/2.                                           | CLI idempotent, chưa có UI. |
| `SUPPORT`     | Chỉ support queue, conversation và FAQ; không user-management/CCCD/wallet/global audit. | CLI idempotent, chưa có UI. |

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
| `SCR-ADMIN-HOME`      | `/admin`                | KPI user, user mới, hoạt động admin.                                     | `GET /admin/me`, `GET /admin/dashboard`       |
| `SCR-ADMIN-USERS`     | `/admin/users`          | Search, filter status, pagination.                                       | `GET /admin/users`                            |
| `SCR-ADMIN-USER`      | `/admin/users/[userId]` | Hồ sơ, status, session, password, CCCD summary/reveal, wallet read-only. | `GET /admin/users/:userId`, các mutation user |
| `SCR-ADMIN-AUDIT-LOG` | `/admin/audit-logs`     | Xem activity log và link về user.                                        | `GET /admin/audit-logs`                       |

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
- audit logs liên quan tới user.

Danh sách và detail không trả `passwordHash`, OTP hash, refresh token hash, sensitive ciphertext/IV/auth tag hoặc security hashes.

### Update basic profile

`PATCH /admin/users/:userId/profile` hỗ trợ username, email, phone, full name, DOB, gender, city, address, email verified flag và phone verified flag.

Rules:

- Username/email/phone được normalize và kiểm tra unique.
- Phone có thể clear về `null`, nhưng không thể verified khi rỗng.
- Admin phải chọn verified state khi thay đổi email hoặc phone.
- Thay đổi username/email/phone tăng `authVersion` và revoke refresh sessions.
- Request phải có `expectedUpdatedAt` và reason tối thiểu 5 ký tự.
- Conflict trả `409 STALE_ADMIN_UPDATE`.

### Status

- Admin chỉ chuyển `ACTIVE ↔ SUSPENDED`.
- `LOCKED` là trạng thái do security flow; admin chỉ xem, không gỡ bằng endpoint Phase 1.
- Status change tăng `authVersion`, revoke refresh sessions và ghi audit.
- Không cho admin suspend chính mình.
- Không cho làm mất admin active cuối cùng theo rule hiện tại.

### Sessions and password

- `POST /admin/users/:userId/revoke-sessions` tăng `authVersion`, revoke refresh sessions và ghi audit.
- `POST /admin/users/:userId/reset-password` nhận temporary password + confirmation, không ghi password vào audit/log và bắt buộc user đổi sau login.
- Password phải có tối thiểu 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.

### Sensitive identity

`POST /admin/users/:userId/sensitive-profile/reveal`:

- bắt buộc reason;
- đọc và giải mã CCCD trong service;
- ghi audit thành công trước khi trả response;
- trả citizen ID, ngày cấp và nơi cấp;
- không yêu cầu admin nhập lại mật khẩu theo quyết định Phase 1;
- không trả secret code, security answer, hashes hoặc encryption metadata.

CCCD được lưu AES-256-GCM ở `SensitiveProfile`; admin detail chỉ nhận summary masked trước khi reveal.

## API contract

Base path: `/api/v1`.

| API ID                       | Method/path                                          | Auth                   | Input chính                                                     | Output chính                               |
| ---------------------------- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `API-ADMIN-ME`               | `GET /admin/me`                                      | Access + `SUPER_ADMIN`/`SUPPORT` | —                                                               | Admin summary/role/profile.                |
| `API-ADMIN-DASHBOARD`        | `GET /admin/dashboard`                               | Access + `SUPER_ADMIN` | —                                                               | User totals/status counts/recent activity. |
| `API-ADMIN-USERS`            | `GET /admin/users`                                   | Access + `SUPER_ADMIN` | `page`, `pageSize`, `search`, `status`                          | Paginated user summaries.                  |
| `API-ADMIN-USER`             | `GET /admin/users/:userId`                           | Access + `SUPER_ADMIN` | UUID                                                            | User detail + wallet/audit summary.        |
| `API-ADMIN-USER-PROFILE`     | `PATCH /admin/users/:userId/profile`                 | Access + `SUPER_ADMIN` | Profile fields, verified flags, `expectedUpdatedAt`, `reason`   | Updated user detail.                       |
| `API-ADMIN-USER-STATUS`      | `PATCH /admin/users/:userId/status`                  | Access + `SUPER_ADMIN` | `status`, `expectedUpdatedAt`, `reason`                         | Updated user detail.                       |
| `API-ADMIN-REVOKE-SESSIONS`  | `POST /admin/users/:userId/revoke-sessions`          | Access + `SUPER_ADMIN` | `reason`                                                        | `{ revoked: true }`.                       |
| `API-ADMIN-RESET-PASSWORD`   | `POST /admin/users/:userId/reset-password`           | Access + `SUPER_ADMIN` | Temporary password, confirmation, `expectedUpdatedAt`, `reason` | `{ reset: true }`.                         |
| `API-ADMIN-SENSITIVE-REVEAL` | `POST /admin/users/:userId/sensitive-profile/reveal` | Access + `SUPER_ADMIN` | `reason`                                                        | Identity plaintext or `null`.              |
| `API-ADMIN-AUDIT-LOGS`       | `GET /admin/audit-logs`                              | Access + `SUPER_ADMIN` | `page`, `pageSize`, actor/action/target/date filters            | Paginated safe audit records.              |

All JSON responses follow `{ data, error }`. Browser mutations remain protected by `OriginGuard`.

## Support operations — Phase 2

`SUPPORT` và `SUPER_ADMIN` dùng chung các route dưới đây. `SUPPORT` chỉ nhận limited user summary trong ticket; không truy cập user-management, CCCD, wallet, password hoặc global audit.

| Nhóm | Route | Hành vi |
| --- | --- | --- |
| Queue | `GET /admin/support/dashboard`, `/agents`, `/tickets`, `/tickets/:ticketNo` | KPI, agent active, search/filter/pagination và detail ticket. |
| Workflow | `POST /admin/support/tickets/:ticketNo/claim`, `PATCH /admin/support/tickets/:ticketNo` | Claim/reassign, priority, status; mutation yêu cầu reason + `expectedUpdatedAt` và audit. |
| Conversation | `GET/POST /admin/support/tickets/:ticketNo/messages`, `POST .../read` | Public reply (phải là assignee), internal note, read cursor riêng từng agent. |
| FAQ | `GET /admin/support/faqs`, `POST/PATCH /admin/support/categories`, `POST/PATCH /admin/support/faqs` | Category/FAQ active toggle, sort order, không hard-delete; audit mọi mutation. |

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

### `AdminAuditLog`

`admin_audit_logs` stores:

- `actorUserId`, `action`, `targetType`, `targetId`;
- mandatory `reason`;
- JSON `metadata` sanitized by key-based redaction;
- `ipAddress`, `userAgent`, `createdAt`.

Supported actions:

`PROFILE_UPDATED`, `STATUS_CHANGED`, `SESSIONS_REVOKED`, `PASSWORD_RESET`, `SENSITIVE_PROFILE_REVEALED`, `SUPPORT_TICKET_ASSIGNED`, `SUPPORT_TICKET_STATUS_CHANGED`, `SUPPORT_TICKET_PRIORITY_CHANGED`, `SUPPORT_MESSAGE_SENT`, `SUPPORT_INTERNAL_NOTE_ADDED`, `SUPPORT_FAQ_CREATED`, `SUPPORT_FAQ_UPDATED`, `SUPPORT_CATEGORY_CREATED`, `SUPPORT_CATEGORY_UPDATED`.

The application exposes no update/delete endpoint for audit records. No retention/archive policy is configured yet.

Migration: `202609030003_admin_phase1`, `202609030004_support_operations`, `202609030005_support_opening_messages`.

### Support data model

- `SupportTicket` thêm priority, assignee và các activity/resolved/closed timestamps.
- `SupportTicketMessage` lưu text bất biến với `CUSTOMER/STAFF` và `PUBLIC/INTERNAL`.
- `SupportTicketReadState` lưu `lastReadAt` theo cặp ticket/user, để unread của customer và từng agent độc lập.
- Migration `202609030005_support_opening_messages` backfill description hiện tại thành opening public message; ticket mới cũng tạo opening message trong cùng transaction.

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
5. Verify audit records after one non-destructive operation.
6. Keep wallet actions read-only until finance controls are implemented.
7. Never paste temporary passwords, CCCD or secrets into audit reasons.

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

## Test evidence

| Layer       | Coverage                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit        | `apps/api/src/admin/admin.guard.spec.ts`, `admin.audit.service.spec.ts`, `apps/api/src/auth/auth.guard.spec.ts`, `apps/api/src/support/limited-markdown.spec.ts`.                                                                 |
| Integration | `apps/api/test/integration/admin.integration.spec.ts` và `support-admin.integration.spec.ts`: access boundaries, queue/workflow, claim race, conversation/unread, FAQ Markdown và audit metadata. |
| Browser     | `apps/web/e2e/admin.spec.ts` và `support-admin.spec.ts`: admin/support login, queue, claim, reply/internal note, FAQ, user/admin screens trên desktop/mobile. |
| Regression  | Existing auth/account/support/payment/game integration and browser suites.                                                                                                                                         |

## Known gaps before production

Các mục sau đã được phát hiện khi review implementation và chưa được coi là resolved:

1. **Concurrent last-admin race:** hai request suspend chéo có thể cùng pass count check nếu không dùng locking/Serializable transaction.
2. **Profile concurrency:** `expectedUpdatedAt` hiện dựa trên `User.updatedAt`, trong khi user basic profile update chủ yếu chạm `UserProfile.updatedAt`.
3. **Verification timestamp:** client hiện gửi cả hai verification flags trong mỗi lần save; backend có thể cập nhật lại `verifiedAt` dù trạng thái không đổi.
4. **Active-status bootstrap:** bootstrap/AdminGuard nên ràng buộc admin user ở status `ACTIVE`; hiện account boundary không loại `PENDING`.
5. **Audit UI parity:** UI chưa có đủ actor/date filters và chưa hiển thị metadata an toàn.
6. **Audit governance:** chưa có retention, export, tamper-evidence hoặc alerting cho hành vi reveal CCCD.
7. **MFA/step-up:** CCCD reveal hiện không yêu cầu re-auth/MFA theo quyết định Phase 1; cần đánh giá lại trước production có dữ liệu thật.

## Out of scope

- CMS game/genre/article/event/theme/feature flags.
- Payment reconciliation, refund hoặc cộng/trừ Coin.
- Role management UI và permission matrix nhiều role.
- MFA/SSO riêng cho admin.
- Admin subdomain, DNS/TLS boundary riêng.
- User create/delete và chỉnh sửa sensitive profile.

Các phần trên sẽ được tách thành phase riêng để tránh mở rộng phạm vi Phase 1.
