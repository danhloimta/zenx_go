# Support

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

## Feature inventory

| ID                 | Chức năng             | Actor      | Hành vi                                                                          | Status        |
| ------------------ | --------------------- | ---------- | -------------------------------------------------------------------------------- | ------------- |
| `FEAT-SUPPORT-001` | Public FAQ            | Guest/User | Đọc FAQ active theo category/order; không cần login.                             | `IMPLEMENTED` |
| `FEAT-SUPPORT-002` | FAQ search/filter UI  | Guest/User | Tìm kiếm câu hỏi, lọc category và mở/thu gọn câu trả lời trên support center.    | `IMPLEMENTED` |
| `FEAT-SUPPORT-003` | Create support ticket | User       | Chọn category, nhập subject/description, tạo ticket `NEW`; yêu cầu account auth. | `IMPLEMENTED` |
| `FEAT-SUPPORT-004` | Ticket history/detail | User       | Xem danh sách phân trang và detail chỉ thuộc user hiện tại.                      | `IMPLEMENTED` |

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

## Screens

| Screen ID                    | Route                         | Hành vi chính                                                                | API/source/test                                                                                                      |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `SCR-SUPPORT-CENTER`         | `/support`                    | FAQ search/category/filter, contact channels, CTA tạo ticket.                | `GET /support/faqs`; `apps/web/app/support/page.tsx`, `components/portal/support-page-client.tsx`; smoke/support E2E |
| `SCR-SUPPORT-REPORT`         | `/support/report-issue`       | Form subject/category/description, validation, submit và success navigation. | `GET /support/faqs`, `POST /support/tickets`; `apps/web/app/support/report-issue/page.tsx`; support E2E              |
| `SCR-ACCOUNT-SUPPORT-LIST`   | `/account/support`            | Danh sách ticket, empty state và paging.                                     | `GET /support/tickets`; `apps/web/app/account/support/page.tsx`; support integration/E2E                             |
| `SCR-ACCOUNT-SUPPORT-DETAIL` | `/account/support/[ticketNo]` | Ticket detail/status, link FAQ và tạo yêu cầu mới.                           | `GET /support/tickets/:ticketNo`; `apps/web/app/account/support/[ticketNo]/page.tsx`; support integration/E2E        |

## API/data mapping

| API ID                      | Method/path                      | Auth/status            | Purpose                              |
| --------------------------- | -------------------------------- | ---------------------- | ------------------------------------ |
| `API-SUPPORT-FAQS`          | `GET /support/faqs`              | Public / `IMPLEMENTED` | FAQ active, category và câu trả lời. |
| `API-SUPPORT-TICKET-CREATE` | `POST /support/tickets`          | Auth / `IMPLEMENTED`   | Tạo ticket mới.                      |
| `API-SUPPORT-TICKETS`       | `GET /support/tickets`           | Auth / `IMPLEMENTED`   | User-scoped list/filter/paging.      |
| `API-SUPPORT-TICKET-DETAIL` | `GET /support/tickets/:ticketNo` | Auth / `IMPLEMENTED`   | User-scoped ticket detail.           |

## Test evidence

- Unit: `apps/api/src/support/support.service.spec.ts`.
- Integration: `apps/api/test/integration/support.integration.spec.ts`.
- Browser: `apps/web/e2e/support.spec.ts`, `apps/web/e2e/smoke.spec.ts`.
- Test gap: staff/admin ticket operation UI chưa có trong source hiện tại; đây là phạm vi phase Support sau Admin account operations.
