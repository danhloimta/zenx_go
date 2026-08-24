# ZENX GO — Technical Architecture & Technology Stack

## 1. Kiến trúc đề xuất

ZENX GO Phase 1 sử dụng TypeScript end-to-end.

```text
Browser
   │
   ▼
Next.js Web
   │
   │ REST / JSON
   ▼
NestJS API
   │
   ├── Auth
   ├── Account
   ├── OTP
   ├── Wallet
   └── Payment
   │
   ▼
Prisma
   │
   ▼
SQL Server
```

External:

```text
Google OAuth ───────┐
Facebook OAuth ─────┤→ Auth

SMS Provider ───────┐
Zalo Provider ──────┼→ OTP Adapter
Email Provider ─────┘

Payment Gateway ─────→ Payment Adapter
```

---

## 2. Technology Stack

### Frontend

- Next.js.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- React Hook Form.
- Zod.
- TanStack Query.
- lucide-react.
- date-fns.
- sonner.

### Backend

- NestJS.
- TypeScript.
- REST API.
- Swagger / OpenAPI.
- Prisma ORM.
- SQL Server.
- Passport.
- JWT.
- argon2.
- `@nestjs/throttler`.
- Nodemailer / SMTP adapter.
- Pino / nestjs-pino.

### Development

- pnpm.
- Turborepo.
- ESLint.
- Prettier.
- Docker.
- Playwright.
- Jest hoặc Vitest.

---

## 3. Repo Structure

Khuyến nghị monorepo:

```text
zenx-go/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── eslint-config/
│   ├── tsconfig/
│   └── api-client/
│
├── docker/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Frontend và backend vẫn deploy độc lập.

---

## 4. Frontend Structure

```text
apps/web/
│
├── app/
│   ├── auth/
│   ├── account/
│   ├── wallet/
│   └── payment/
│
├── components/
│   ├── ui/
│   ├── auth/
│   ├── account/
│   └── wallet/
│
├── hooks/
├── lib/
├── schemas/
└── types/
```

### State Management

Không dùng Redux/Zustand ở MVP nếu chưa cần.

Phân chia:

```text
Server state → TanStack Query
Form state   → React Hook Form
Validation   → Zod
Local UI     → React useState/useReducer
Auth         → HTTP-only cookie/session
```

---

## 5. API Client

Ưu tiên native `fetch()` với wrapper chung.

```text
lib/api-client.ts
```

Ví dụ logical API:

```text
api.get()
api.post()
api.patch()
api.delete()
```

Phase sau có thể generate client từ OpenAPI.

---

## 6. Backend Structure

NestJS chạy dạng modular monolith.

```text
apps/api/src/
│
├── auth/
├── account/
├── social/
├── otp/
├── wallet/
├── payment/
├── database/
├── common/
├── config/
└── main.ts
```

Không cần microservice ở MVP.

---

## 7. Auth

Backend ownership nằm ở NestJS.

Sử dụng:

- `@nestjs/passport`
- `@nestjs/jwt`
- `passport`
- `passport-jwt`
- `passport-google-oauth20`
- `passport-facebook`
- `argon2`

### Session

Khuyến nghị:

```text
NestJS
→ JWT/session
→ HTTP-only Secure Cookie
→ Browser
```

Không lưu access token trong localStorage.

MVP không cần màn quản lý device/session.

---

## 8. Password

Password được hash bằng `argon2`.

Database chỉ lưu:

```text
password_hash
```

Không lưu plaintext password.

---

## 9. Social Identity

Social account mapping:

```text
provider
provider_user_id
user_id
```

Unique constraint:

```text
(provider, provider_user_id)
```

Không dùng social email làm khóa identity.

---

## 10. OTP Adapter

Business logic không phụ thuộc vendor.

Interface:

```typescript
interface OtpProvider {
  send(input: {
    destination: string
    code: string
  }): Promise<void>
}
```

Implementations:

```text
MockOtpProvider
SmsOtpProvider
ZaloOtpProvider
EmailOtpProvider
```

Config ví dụ:

```env
OTP_SMS_PROVIDER=mock
OTP_ZALO_PROVIDER=mock
OTP_EMAIL_PROVIDER=smtp
```

OTP Service lựa chọn provider dựa trên `channel`.

---

## 11. Mail Adapter

Dùng abstraction:

```typescript
interface MailProvider {
  sendOtp(...): Promise<void>
  sendPasswordReset(...): Promise<void>
}
```

MVP có thể dùng Nodemailer + SMTP.

Sau này có thể thay bằng:

- SES.
- SendGrid.
- Mailgun.
- SMTP riêng.

---

## 12. Payment Adapter

Không bind business logic vào payment vendor.

Interface:

```typescript
interface PaymentProvider {
  createPayment(...): Promise<unknown>
  verifyCallback(...): Promise<unknown>
  queryPayment(...): Promise<unknown>
}
```

Implementations:

```text
MockPaymentProvider
ProviderA
ProviderB
```

Config:

```env
PAYMENT_PROVIDER=mock
```

---

## 13. Wallet Implementation

Wallet phải được xử lý transaction-safe.

### CREDIT / DEBIT

Flow:

```text
Begin DB Transaction
→ Load wallet
→ Validate
→ Create ledger transaction
→ Update balance
→ Commit
```

### Isolation

Đối với CREDIT/DEBIT quan trọng, dùng transaction isolation phù hợp, ưu tiên `Serializable` nếu implementation và tải hệ thống cho phép.

Cần xử lý retry khi gặp transaction conflict/deadlock.

### Coin type

Coin là số nguyên.

Dùng:

```text
BIGINT
```

Không dùng:

```text
float
real
```

Nếu ZENX Coin không hỗ trợ phần thập phân.

---

## 14. Payment Idempotency

Payment callback phải idempotent.

Một provider transaction chỉ được tạo một wallet TOPUP.

Có thể dùng:

```text
provider_transaction_id UNIQUE
```

và transaction reference unique:

```text
(reference_type, reference_id, type)
```

tùy thiết kế cuối cùng.

---

## 15. Rate Limiting

MVP dùng basic rate limit bằng:

```text
@nestjs/throttler
```

Áp dụng cho:

- Login.
- Register.
- OTP send.
- OTP verify.
- Forgot password.

MVP single API instance chưa cần Redis.

Khi scale multi-instance mới thêm distributed rate limit.

---

## 16. Logging

Dùng:

- `pino`
- `nestjs-pino`

Log request nên có:

- `request_id`
- `user_id`
- endpoint
- status
- duration

Wallet/payment log thêm:

- `transaction_no`
- `payment_no`

Không log:

- Password.
- OTP plaintext.
- Provider access token.
- Secret key.

---

## 17. Validation

Frontend:

```text
React Hook Form + Zod
```

Backend:

- NestJS DTO.
- ValidationPipe.
- class-validator hoặc schema validation thống nhất.

Backend luôn là source of truth.

Không tin validation từ frontend.

---

## 18. Testing

### Backend

Critical cases:

- Duplicate username/email/phone.
- Login.
- Social link duplicate.
- OTP expire/reuse.
- CREDIT.
- DEBIT.
- Insufficient balance.
- Concurrent debit.
- Duplicate payment callback.

### Frontend / E2E

Dùng Playwright cho:

- Register.
- Login.
- Forgot password.
- View profile.
- View wallet.
- Create top-up.
- View transaction history.

---

## 19. Không dùng trong MVP

Không cần:

- Redux.
- Zustand nếu chưa có nhu cầu.
- Redis.
- Kafka.
- RabbitMQ.
- BullMQ.
- GraphQL.
- tRPC.
- Elasticsearch.
- Microservices.
- Kubernetes.
- CQRS.
- Event sourcing.

---

## 20. Deployment Logical View

```text
              ┌─────────────────────┐
              │     Next.js Web     │
              │                     │
              │ Tailwind/shadcn     │
              │ RHF/Zod             │
              │ TanStack Query      │
              └──────────┬──────────┘
                         │
                       REST
                         │
              ┌──────────▼──────────┐
              │      NestJS API     │
              │                     │
              │ Auth                │
              │ Account             │
              │ OTP                 │
              │ Wallet              │
              │ Payment             │
              └──────────┬──────────┘
                         │
                      Prisma
                         │
              ┌──────────▼──────────┐
              │     SQL Server      │
              └─────────────────────┘
```

---

## 21. Technical Principles

1. Modular monolith trước, microservice sau.
2. Provider integrations dùng adapter.
3. Wallet là transaction-safe domain.
4. Frontend không giữ business rules quan trọng.
5. SQL Server là source of truth.
6. Wallet balance không được sửa trực tiếp.
7. Payment callback phải idempotent.
8. API version từ đầu (`/api/v1`).
