# Support

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `788f781`

## Feature inventory

| ID                 | Chức năng             | Actor        | Hành vi                                                                           | Status        |
| ------------------ | --------------------- | ------------ | --------------------------------------------------------------------------------- | ------------- |
| `FEAT-SUPPORT-001` | Public FAQ            | Guest/User   | Đọc FAQ active theo category/order; không cần login.                              | `IMPLEMENTED` |
| `FEAT-SUPPORT-002` | FAQ search/filter UI  | Guest/User   | Tìm kiếm câu hỏi, lọc category và mở/thu gọn câu trả lời trên support center.     | `IMPLEMENTED` |
| `FEAT-SUPPORT-003` | Create support ticket | User         | Chọn category, nhập subject/description, tạo ticket `NEW`; yêu cầu account auth.  | `IMPLEMENTED` |
| `FEAT-SUPPORT-004` | Ticket history/detail | User         | Xem danh sách phân trang và detail chỉ thuộc user hiện tại.                       | `IMPLEMENTED` |
| `FEAT-SUPPORT-005` | Support queue         | SUPPORT      | Queue, priority, claim/reassign và workflow status; `SUPER_ADMIN` cũng được phép. | `IMPLEMENTED` |
| `FEAT-SUPPORT-006` | Ticket conversation   | User/SUPPORT | Reply hai chiều, internal note, unread state và reopen trong 7 ngày.              | `IMPLEMENTED` |
| `FEAT-SUPPORT-007` | FAQ management        | SUPPORT      | CRUD category/FAQ, active toggle, sort order và limited Markdown.                 | `IMPLEMENTED` |

## User flows

### Tìm câu trả lời

```text
Vào /support
→ tải FAQ active
→ nhập keyword hoặc chọn category
→ đọc câu trả lời
→ nếu chưa giải quyết: mở /support/report-issue
```

### Gửi yêu cầu

```text
Chọn category
→ nhập subject + description
→ nếu chưa login: chuyển login/giữ return path
→ POST /support/tickets
→ chuyển tới account ticket detail
```

### Theo dõi ticket

```text
/account/support
→ GET /support/tickets (user-scoped, paging)
→ chọn ticketNo
→ GET /support/tickets/:ticketNo
```

## Rules and states

- FAQ chỉ trả category/FAQ active theo sort order; empty result phải được hiển thị rõ.
- Ticket yêu cầu category tồn tại/active, subject tối đa 160 ký tự và description tối đa 4,000 ký tự theo DTO.
- Ticket mới có status `NEW`; các status xử lý tiếp theo (`IN_PROGRESS`, `RESOLVED`, `CLOSED`) là domain state trong data model.
- Ticket detail/list luôn lọc theo `userId`; ticket của user khác trả not found.
- API error dùng error code domain, UI chuyển sang tiếng Việt qua error-message map.
- Ticket priority gồm `LOW`, `NORMAL`, `HIGH`, `URGENT`; ticket mới mặc định `NORMAL`.
- Status workflow gồm `NEW`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, `CLOSED`; `CLOSED` là trạng thái cuối.
- Agent phải claim ticket trước khi public reply; ticket đã gán cho agent khác phải reassign trước.
- Message bất biến; `PUBLIC` hiển thị cho user, `INTERNAL` chỉ hiển thị cho SUPPORT/SUPER_ADMIN.
- User reply mở lại ticket `RESOLVED` trong 7 ngày; sau thời hạn hoặc với `CLOSED` phải tạo ticket mới.
- FAQ được soft-hide bằng `ACTIVE/INACTIVE`, không hard-delete; answer dùng limited Markdown và không nhận raw HTML.

## Screens

| Screen ID                    | Route                         | Hành vi chính                                                                | API/source/test                                                                                                      |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `SCR-SUPPORT-CENTER`         | `/support`                    | FAQ search/category/filter, contact channels, CTA tạo ticket.                | `GET /support/faqs`; `apps/web/app/support/page.tsx`, `components/portal/support-page-client.tsx`; smoke/support E2E |
| `SCR-SUPPORT-REPORT`         | `/support/report-issue`       | Form subject/category/description, validation, submit và success navigation. | `GET /support/faqs`, `POST /support/tickets`; `apps/web/app/support/report-issue/page.tsx`; support E2E              |
| `SCR-ACCOUNT-SUPPORT-LIST`   | `/account/support`            | Danh sách ticket, empty state và paging.                                     | `GET /support/tickets`; `apps/web/app/account/support/page.tsx`; support integration/E2E                             |
| `SCR-ACCOUNT-SUPPORT-DETAIL` | `/account/support/[ticketNo]` | Ticket detail/status, link FAQ và tạo yêu cầu mới.                           | `GET /support/tickets/:ticketNo`; `apps/web/app/account/support/[ticketNo]/page.tsx`; support integration/E2E        |

## API/data mapping

| API ID                       | Method/path                                | Auth/status            | Purpose                                         |
| ---------------------------- | ------------------------------------------ | ---------------------- | ----------------------------------------------- |
| `API-SUPPORT-FAQS`           | `GET /support/faqs`                        | Public / `IMPLEMENTED` | FAQ active, category và câu trả lời.            |
| `API-SUPPORT-TICKET-CREATE`  | `POST /support/tickets`                    | Auth / `IMPLEMENTED`   | Tạo ticket mới.                                 |
| `API-SUPPORT-TICKETS`        | `GET /support/tickets`                     | Auth / `IMPLEMENTED`   | User-scoped list/filter/paging.                 |
| `API-SUPPORT-TICKET-DETAIL`  | `GET /support/tickets/:ticketNo`           | Auth / `IMPLEMENTED`   | User-scoped ticket detail.                      |
| `API-SUPPORT-MESSAGES`       | `GET /support/tickets/:ticketNo/messages`  | Auth / `IMPLEMENTED`   | Public message thread, paginated newest-first.  |
| `API-SUPPORT-MESSAGE-CREATE` | `POST /support/tickets/:ticketNo/messages` | Auth / `IMPLEMENTED`   | User public reply, enforce closed/reopen rules. |
| `API-SUPPORT-TICKET-READ`    | `POST /support/tickets/:ticketNo/read`     | Auth / `IMPLEMENTED`   | Upsert user read cursor.                        |
| `API-SUPPORT-UNREAD-COUNT`   | `GET /support/unread-count`                | Auth / `IMPLEMENTED`   | Staff-reply unread count for current user.      |

## Admin Support Operations — Phase 2

### Roles and boundaries

- `SUPPORT` và `SUPER_ADMIN` được truy cập support API.
- `SUPPORT` chỉ nhìn limited user summary (username, email, phone, profile name), không nhìn CCCD, wallet hoặc password.
- `SUPER_ADMIN` giữ toàn quyền Phase 1 và có thêm support operations.
- Role được kiểm tra live từ `user_roles`; chưa có role-management UI.

### Ticket operation flow

```text
NEW/unassigned
→ agent claim
→ IN_PROGRESS
→ public reply
→ WAITING_USER
→ user reply
→ IN_PROGRESS
→ RESOLVED
→ CLOSED
```

- Claim dùng conditional update để hai agent không cùng nhận một ticket.
- Reassign chỉ tới user `ACTIVE` có role `SUPPORT` hoặc `SUPER_ADMIN`.
- Status/priority/assignment mutation yêu cầu `expectedUpdatedAt`.
- Public staff reply yêu cầu assignee hiện tại; internal note không yêu cầu assignee.
- `lastCustomerMessageAt`, `lastStaffReplyAt`, `lastActivityAt` phục vụ queue sort và unread badge.
- `SupportTicketReadState` lưu cursor riêng cho từng viewer; customer và mỗi staff agent có trạng thái độc lập.
- Ticket hiện hữu được backfill `description` thành opening public message; ticket mới tạo opening message cùng transaction với ticket.

### Admin Support screens

| Screen ID                   | Route                               | Hành vi                                                                     |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `SCR-ADMIN-SUPPORT-HOME`    | `/admin/support`                    | KPI unassigned, assigned-to-me, unread, status/priority counts.             |
| `SCR-ADMIN-SUPPORT-TICKETS` | `/admin/support/tickets`            | Search/filter queue, priority/status/assignee và unread-only.               |
| `SCR-ADMIN-SUPPORT-TICKET`  | `/admin/support/tickets/[ticketNo]` | Limited user summary, claim/reassign, workflow, public reply/internal note. |
| `SCR-ADMIN-SUPPORT-FAQS`    | `/admin/support/faqs`               | Category/FAQ CRUD, status, sort order và Markdown preview.                  |

### Admin Support API

| API ID                             | Method/path                                      | Auth                    | Purpose                                 |
| ---------------------------------- | ------------------------------------------------ | ----------------------- | --------------------------------------- |
| `API-ADMIN-SUPPORT-DASHBOARD`      | `GET /admin/support/dashboard`                   | `SUPPORT`/`SUPER_ADMIN` | Queue KPIs và unread count.             |
| `API-ADMIN-SUPPORT-AGENTS`         | `GET /admin/support/agents`                      | `SUPPORT`/`SUPER_ADMIN` | Danh sách agent active để assign.       |
| `API-ADMIN-SUPPORT-TICKETS`        | `GET /admin/support/tickets`                     | `SUPPORT`/`SUPER_ADMIN` | Queue search/filter/pagination.         |
| `API-ADMIN-SUPPORT-TICKET`         | `GET /admin/support/tickets/:ticketNo`           | `SUPPORT`/`SUPER_ADMIN` | Ticket detail + thread preview.         |
| `API-ADMIN-SUPPORT-MESSAGES`       | `GET /admin/support/tickets/:ticketNo/messages`  | `SUPPORT`/`SUPER_ADMIN` | Public/internal messages paginated.     |
| `API-ADMIN-SUPPORT-CLAIM`          | `POST /admin/support/tickets/:ticketNo/claim`    | `SUPPORT`/`SUPER_ADMIN` | Claim unassigned ticket.                |
| `API-ADMIN-SUPPORT-UPDATE`         | `PATCH /admin/support/tickets/:ticketNo`         | `SUPPORT`/`SUPER_ADMIN` | Assignment, priority/status transition. |
| `API-ADMIN-SUPPORT-MESSAGE-CREATE` | `POST /admin/support/tickets/:ticketNo/messages` | `SUPPORT`/`SUPER_ADMIN` | Public reply hoặc internal note.        |
| `API-ADMIN-SUPPORT-READ`           | `POST /admin/support/tickets/:ticketNo/read`     | `SUPPORT`/`SUPER_ADMIN` | Upsert staff read cursor.               |
| `API-ADMIN-SUPPORT-FAQS`           | `GET /admin/support/faqs`                        | `SUPPORT`/`SUPER_ADMIN` | Đọc category/FAQ kể cả inactive.        |
| `API-ADMIN-SUPPORT-CATEGORIES`     | `POST/PATCH /admin/support/categories`           | `SUPPORT`/`SUPER_ADMIN` | Tạo/sửa category, không hard-delete.    |
| `API-ADMIN-SUPPORT-FAQ-MUTATION`   | `POST/PATCH /admin/support/faqs`                 | `SUPPORT`/`SUPER_ADMIN` | Tạo/sửa FAQ và validate Markdown.       |

### FAQ Markdown

Answer được lưu ở field `answer` hiện tại, tối đa 4.000 ký tự. Chỉ hỗ trợ paragraph, line break, bold, italic, list, inline code và link `http/https`. Raw HTML, heading, table và image bị từ chối ở API; client render bằng component không cho phép raw HTML.

## Test evidence

- Unit: `apps/api/src/support/support.service.spec.ts`, `apps/api/src/support/limited-markdown.spec.ts`.
- Integration: `apps/api/test/integration/support.integration.spec.ts`, `apps/api/test/integration/support-admin.integration.spec.ts`.
- Browser: `apps/web/e2e/support.spec.ts`, `apps/web/e2e/support-admin.spec.ts`, `apps/web/e2e/smoke.spec.ts`.
- Test gap: unread multi-agent race và notification polling thực tế cần bổ sung khi có workload production; email/attachment/SLA chưa nằm trong phase này.
