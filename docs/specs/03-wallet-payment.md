# Wallet & Payment

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

## Feature inventory

| ID                 | Chức năng                         | Actor      | Hành vi/source of truth                                                                     | Status        |
| ------------------ | --------------------------------- | ---------- | ------------------------------------------------------------------------------------------- | ------------- |
| `FEAT-WALLET-001`  | Wallet summary                    | User       | Đọc currency, balance và updated timestamp từ wallet của user.                              | `IMPLEMENTED` |
| `FEAT-WALLET-002`  | Wallet ledger credit/debit/refund | System     | Mọi thay đổi balance tạo `wallet_transactions`, ghi before/after, reference và idempotency. | `IMPLEMENTED` |
| `FEAT-WALLET-003`  | Transaction history/filter/export | User       | Phân trang deterministic, lọc type/status/date/search, export CSV tối đa 10,000 dòng.       | `IMPLEMENTED` |
| `FEAT-PAYMENT-001` | Coin package/config               | Guest/User | Public package list và payment provider/method config.                                      | `IMPLEMENTED` |
| `FEAT-PAYMENT-002` | Create/payment status/history     | User       | Chọn package/method → tạo payment idempotent → provider payload → theo dõi status.          | `PARTIAL`     |
| `FEAT-PAYMENT-003` | Mock payment completion           | User       | Hoàn tất callback giả lập trong development/test; không cho production.                     | `MOCK`        |
| `FEAT-PAYMENT-004` | SePay VietQR/webhook              | Provider   | Nhận signed webhook, kiểm tra payment/account/amount/type, credit TOPUP một lần.            | `PARTIAL`     |

## Wallet rules

- Wallet được tạo cùng account, currency mặc định `ZENX`, balance bắt đầu `0`.
- `CREDIT`, `DEBIT`, `REFUND` chạy trong transaction Serializable và có retry cho serialization conflict.
- Không cho debit nếu amount không dương, wallet không tồn tại hoặc balance không đủ.
- Debit dùng điều kiện `balance >= amount` tại update để không làm balance âm khi concurrent.
- Idempotency key theo user trả lại transaction/payment cũ thay vì tạo bản ghi thứ hai.
- Ledger public response không lộ storage identifiers (`id`, `walletId`, `userId`, `paymentId`, `idempotencyKey`).
- Provider transaction ID trong transaction detail được mask; CSV chỉ xuất các field giao dịch đã được định nghĩa.
- Transaction list sort theo `createdAt desc`, sau đó `id desc` để paging ổn định.
- Date-only filter là calendar date UTC+07; range ngược bị từ chối.

## Payment lifecycle

```text
Chọn coin package + payment method
→ POST /payments (CREATED)
→ provider create payment
→ lưu provider payload, chuyển PENDING
→ callback/webhook verified
→ SUCCESS/FAILED/EXPIRED
→ nếu SUCCESS: credit TOPUP với idempotency payment:<payment-id>
```

- Coin package chỉ chọn được khi status `ACTIVE`.
- Payment number và provider transaction ID có unique rule; concurrent create/callback được xử lý qua transaction/retry.
- Payment response chỉ trả public fields: payment no, status, provider, amount, coin amount, method và timestamps.
- Payload QR hoặc bank transfer chỉ trả khi payment đang chờ xử lý và provider cho phép.
- Payment đã terminal không được cộng Coin lần hai.
- Mock provider hỗ trợ deterministic callback ở non-production; `mock-complete` bị chặn ở production.
- SePay chỉ chấp nhận VietQR, signed webhook, giao dịch `in`, đúng account/amount/payment provider và transaction ID không xung đột.
- SePay webhook response là `{ success: true }` ngoài response envelope; invalid signature/payload được filter riêng.

## Screens

| Screen ID              | Route                                  | Hành vi chính                                                                          | API/source/test                                                                                                              |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SCR-WALLET-HOME`      | `/wallet`                              | Hiện balance, 5 giao dịch gần đây, link nạp và xem tất cả.                             | `/account/me`, `/wallet`, `/wallet/transactions`; `apps/web/app/wallet/page.tsx`; vertical/portal E2E                        |
| `SCR-WALLET-TX-LIST`   | `/wallet/transactions`                 | Filter type/status/date/search, paging và mở detail.                                   | `/wallet/transactions`; `apps/web/app/wallet/transactions/page.tsx`; vertical integration/E2E                                |
| `SCR-WALLET-TX-DETAIL` | `/wallet/transactions/[transactionNo]` | Chi tiết ledger/payment metadata và link hỗ trợ.                                       | `/wallet/transactions/:transactionNo`; `apps/web/app/wallet/transactions/[transactionNo]/page.tsx`; vertical integration/E2E |
| `SCR-PAYMENT-CREATE`   | `/payment`                             | Load packages/config, chọn package/method, tạo payment, xử lý empty/error/demo states. | `/coin-packages`, `/payment-config`, `POST /payments`; `apps/web/app/payment/page.tsx`; vertical/sepay E2E                   |
| `SCR-PAYMENT-DETAIL`   | `/payment/[paymentNo]`                 | Hiện QR/instructions/status, refresh payment và mock completion.                       | `/payments/:paymentNo`, `/payments/:paymentNo/mock-complete`; `apps/web/app/payment/[paymentNo]/page.tsx`; sepay E2E         |

## API/data mapping

| API ID                      | Method/path                               | Auth/status                 | Purpose                                                     |
| --------------------------- | ----------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| `API-PAYMENT-PACKAGES`      | `GET /coin-packages`                      | Public / `IMPLEMENTED`      | Danh sách package active.                                   |
| `API-PAYMENT-CONFIG`        | `GET /payment-config`                     | Public / `IMPLEMENTED`      | Provider, methods, demo flags.                              |
| `API-PAYMENT-CREATE`        | `POST /payments`                          | Auth / `PARTIAL`            | Tạo payment từ package + method + optional idempotency key. |
| `API-PAYMENT-GET`           | `GET /payments/:paymentNo`                | Auth / `PARTIAL`            | Đọc và expire payment quá hạn.                              |
| `API-PAYMENT-LIST`          | `GET /payments`                           | Auth / `PARTIAL`            | Payment history tối đa 100 item.                            |
| `API-PAYMENT-MOCK-COMPLETE` | `POST /payments/:paymentNo/mock-complete` | Auth, non-prod / `MOCK`     | Gọi signed mock callback nội bộ.                            |
| `API-PAYMENT-CALLBACK`      | `POST /payments/:provider/callback`       | Signed callback / `MOCK`    | Verify mock signature và process callback.                  |
| `API-PAYMENT-SEPAY-WEBHOOK` | `POST /webhooks/sepay`                    | SePay signature / `PARTIAL` | Validate và process incoming bank transfer.                 |
| `API-WALLET-SUMMARY`        | `GET /wallet`                             | Auth / `IMPLEMENTED`        | Wallet public summary.                                      |
| `API-WALLET-TRANSACTIONS`   | `GET /wallet/transactions`                | Auth / `IMPLEMENTED`        | History/filter/paging.                                      |
| `API-WALLET-EXPORT`         | `GET /wallet/transactions/export`         | Auth / `IMPLEMENTED`        | CSV export có limit.                                        |
| `API-WALLET-DETAIL`         | `GET /wallet/transactions/:transactionNo` | Auth / `IMPLEMENTED`        | Transaction detail theo user ownership.                     |

## Test evidence

- `apps/api/test/integration/vertical-slice.integration.spec.ts`: create payment, signed callback, duplicate callback, wallet credit/debit/idempotency/paging/export.
- `apps/api/test/integration/sepay.integration.spec.ts`: signature, account/amount/type validation, duplicate/conflict webhook và terminal states.
- `apps/web/e2e/vertical-slice.spec.ts`: wallet/payment flow và transaction detail.
- `apps/web/e2e/sepay-ui.spec.ts`: payment UI/provider states.
- Test gap: payment provider thật ngoài mock/SePay seam và payout/withdrawal chưa có trong source.
