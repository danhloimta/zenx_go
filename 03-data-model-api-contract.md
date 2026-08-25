# ZENX GO — Data Model & API Contract (Draft)

## 1. Mục tiêu

Tài liệu này mô tả data model và REST API sơ bộ cho ZENX GO Phase 1.

Đây là draft dùng để backend/frontend thống nhất contract trước khi triển khai.

---

# 2. Data Model

## 2.1 User

```text
User
--------------------------
id
username
email
phone
password_hash
status

created_at
updated_at
```

Constraints:

```text
username UNIQUE
email UNIQUE
phone UNIQUE
```

Khuyến nghị normalize:

- Username → lowercase canonical value hoặc computed normalized field.
- Email → lowercase.
- Phone → E.164 hoặc format chuẩn thống nhất.

---

## 2.2 UserProfile

```text
UserProfile
--------------------------
id
user_id

full_name
avatar_url
date_of_birth
gender
city

terms_version
privacy_version
accepted_at

created_at
updated_at
```

`user_id` unique.

---

## 2.3 SocialIdentity

```text
SocialIdentity
--------------------------
id
user_id

provider
provider_user_id

email_at_link_time

linked_at
last_login_at
```

Provider:

```text
GOOGLE
FACEBOOK
```

Constraint:

```text
(provider, provider_user_id) UNIQUE
```

---

## 2.4 OtpRequest

```text
OtpRequest
--------------------------
id

channel
purpose

destination
code_hash

status
expires_at
used_at

created_at
```

Channel:

```text
SMS
ZALO
EMAIL
```

Purpose:

```text
REGISTER
VERIFY_PHONE
RESET_PASSWORD
CHANGE_PHONE
LINK_SOCIAL
```

Status:

```text
PENDING
USED
EXPIRED
```

Không lưu OTP plaintext nếu không cần cho debug environment.

---

## 2.5 Wallet

```text
Wallet
--------------------------
id
user_id

currency
balance

created_at
updated_at
```

Constraint:

```text
user_id UNIQUE
```

Currency MVP:

```text
ZENX
```

Balance:

```text
BIGINT
```

---

## 2.6 WalletTransaction

```text
WalletTransaction
--------------------------
id
transaction_no

wallet_id
user_id

type
amount

balance_before
balance_after

status

reference_type
reference_id

description

created_at
completed_at
```

Type:

```text
TOPUP
CREDIT
DEBIT
REFUND
```

Status:

```text
PENDING
SUCCESS
FAILED
REVERSED
```

Rule:

```text
amount > 0
```

Hướng tăng/giảm balance xác định bằng `type`.

---

## 2.7 CoinPackage

```text
CoinPackage
--------------------------
id
code
name

price_vnd
coin_amount

status
sort_order

created_at
updated_at
```

Status:

```text
ACTIVE
INACTIVE
```

---

## 2.8 Payment

```text
Payment
--------------------------
id
payment_no

user_id
coin_package_id

amount_vnd
coin_amount

provider
payment_method
idempotency_key

provider_transaction_id

status

created_at
paid_at
expired_at
updated_at
```

Status:

```text
CREATED
PENDING
SUCCESS
FAILED
EXPIRED
CANCELLED
REFUNDED
```

Constraint nên có:

```text
provider_transaction_id UNIQUE
user_id + idempotency_key UNIQUE (khi idempotency_key có giá trị)
```

nếu provider đảm bảo ID ổn định.

---

# 3. Entity Relationships

```text
User
 ├── 1 UserProfile
 ├── N SocialIdentity
 ├── 1 Wallet
 ├── N Payment
 └── N WalletTransaction

Wallet
 └── N WalletTransaction

CoinPackage
 └── N Payment

Payment
 └── 0..1 WalletTransaction (TOPUP)
```

---

# 4. Wallet Rules

## 4.1 CREDIT

```text
Begin Transaction
→ Lock/read Wallet
→ Create WalletTransaction
→ Increment Wallet.balance
→ Save balance_after
→ Commit
```

## 4.2 DEBIT

```text
Begin Transaction
→ Lock/read Wallet
→ Check balance >= amount
→ Create WalletTransaction
→ Decrement Wallet.balance
→ Save balance_after
→ Commit
```

Nếu không đủ Coin:

```text
INSUFFICIENT_BALANCE
```

Không cho balance âm.

## 4.3 TOPUP

```text
Payment SUCCESS
→ Check payment chưa được credit
→ Wallet TOPUP
→ Link transaction với payment
```

## 4.4 REFUND

Refund tạo transaction mới.

Không sửa/xóa ledger transaction cũ.

---

# 5. API Convention

Base:

```text
/api/v1
```

Response format đề xuất:

```json
{
  "data": {},
  "error": null
}
```

Error:

```json
{
  "data": null,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email already exists"
  }
}
```

---

# 6. Authentication API

## POST /auth/register

Request:

```json
{
  "username": "player01",
  "email": "player@example.com",
  "phone": "+84901234567",
  "password": "********",
  "fullName": "Player One",
  "otpCode": "123456",
  "dateOfBirth": "2000-01-01",
  "gender": "MALE",
  "city": "Ho Chi Minh City",
  "acceptTerms": true,
  "acceptPrivacy": true
}
```

Possible errors:

```text
USERNAME_ALREADY_EXISTS
EMAIL_ALREADY_EXISTS
PHONE_ALREADY_EXISTS
INVALID_OTP
OTP_EXPIRED
```

---

## POST /auth/login

Request:

```json
{
  "username": "player01",
  "password": "********"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "user_id",
      "username": "player01"
    }
  },
  "error": null
}
```

Session được set bằng HTTP-only cookie.

---

## POST /auth/logout

Logout session hiện tại.

---

## POST /auth/forgot-password

Request:

```json
{
  "email": "player@example.com"
}
```

---

## POST /auth/reset-password

Request:

```json
{
  "email": "player@example.com",
  "code": "123456",
  "newPassword": "********"
}
```

---

## GET /auth/google

Redirect đến Google OAuth.

---

## GET /auth/google/callback

OAuth callback.

---

## GET /auth/facebook

Redirect đến Facebook OAuth.

---

## GET /auth/facebook/callback

OAuth callback.

---

# 7. OTP API

## POST /otp/send

Request:

```json
{
  "channel": "SMS",
  "purpose": "REGISTER",
  "destination": "+84901234567"
}
```

Response:

```json
{
  "data": {
    "expiresIn": 300,
    "resendAfter": 60
  },
  "error": null
}
```

---

## POST /otp/verify

Request:

```json
{
  "channel": "SMS",
  "purpose": "REGISTER",
  "destination": "+84901234567",
  "code": "123456"
}
```

---

# 8. Account API

## GET /account/me

Response:

```json
{
  "data": {
    "id": "user_id",
    "username": "player01",
    "email": "player@example.com",
    "phone": "+84901234567",
    "emailVerifiedAt": "2026-01-01T00:00:00.000Z",
    "phoneVerifiedAt": "2026-01-01T00:00:00.000Z",
    "hasPassword": true,
    "profile": {
      "fullName": "Player One",
      "dateOfBirth": "2000-01-01",
      "gender": "MALE",
      "city": "Ho Chi Minh City"
    },
    "social": {
      "google": true,
      "facebook": false
    }
  },
  "error": null
}
```

---

## PATCH /account/me

Update profile fields được phép thay đổi.

---

## POST /account/change-password

Request:

```json
{
  "currentPassword": "********",
  "newPassword": "********"
}
```

---

## POST /account/change-email

Flow nên yêu cầu verify email mới.

---

## POST /account/change-phone

Flow nên yêu cầu OTP phone mới.

---

# 9. Social Link API

## POST /account/social/google/link

Khởi tạo Google linking flow.

## DELETE /account/social/google

Unlink Google.

## POST /account/social/facebook/link

Khởi tạo Facebook linking flow.

## DELETE /account/social/facebook

Unlink Facebook.

Business rule:

- Không unlink login method cuối cùng.
- Social identity không được thuộc user khác.

---

# 10. Wallet API

## GET /wallet

Response:

```json
{
  "data": {
    "currency": "ZENX",
    "balance": 12500
  },
  "error": null
}
```

---

## GET /wallet/transactions

Query:

```text
?page=1
&pageSize=20
&type=TOPUP
&status=SUCCESS
&from=2026-08-01
&to=2026-08-31
```

Response:

```json
{
  "data": {
    "items": [
      {
        "transactionNo": "ZTX-001",
        "type": "TOPUP",
        "amount": 1000,
        "status": "SUCCESS",
        "createdAt": "2026-08-24T10:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "error": null
}
```

---

## GET /wallet/transactions/:transactionNo

Chi tiết transaction.

---

# 11. Internal Wallet API

Không expose cho frontend public.

Ví dụ logical endpoints:

```text
POST /internal/wallets/:userId/credit
POST /internal/wallets/:userId/debit
POST /internal/wallets/:userId/refund
```

Hoặc chỉ expose dưới dạng internal service method trong NestJS nếu chưa có system khác gọi.

### Credit Request

```json
{
  "amount": 500,
  "referenceType": "SYSTEM",
  "referenceId": "ref_123",
  "description": "System credit"
}
```

### Debit Request

```json
{
  "amount": 200,
  "referenceType": "SYSTEM",
  "referenceId": "ref_456",
  "description": "System debit"
}
```

---

# 12. Coin Package API

## GET /coin-packages

Response:

```json
{
  "data": [
    {
      "id": "pkg_100",
      "name": "ZENX 100",
      "priceVnd": 100000,
      "coinAmount": 1000
    }
  ],
  "error": null
}
```

---

# 13. Payment API

## POST /payments

Request:

```json
{
  "coinPackageId": "pkg_100",
  "paymentMethod": "QR",
  "idempotencyKey": "client-generated-request-key"
}
```

Response:

```json
{
  "data": {
    "paymentNo": "ZPAY-001",
    "status": "PENDING",
    "amountVnd": 100000,
    "coinAmount": 1000,
    "paymentUrl": "provider-url"
  },
  "error": null
}
```

---

## GET /payments/:paymentNo

Response:

```json
{
  "data": {
    "paymentNo": "ZPAY-001",
    "status": "SUCCESS",
    "amountVnd": 100000,
    "coinAmount": 1000
  },
  "error": null
}
```

---

## GET /payments

Lịch sử payment của user.

---

## POST /payments/:provider/callback

Endpoint dành cho payment provider.

Header bắt buộc:

```text
x-payment-signature: <signature>
```

Chữ ký không nằm trong JSON body; body chỉ chứa `providerTransactionId`, `paymentNo` và `status`.

Rule:

1. Verify signature.
2. Resolve provider transaction.
3. Check trạng thái hiện tại.
4. Update Payment.
5. Nếu SUCCESS và chưa TOPUP:
   - tạo WalletTransaction `TOPUP`;
   - cộng Coin;
   - commit atomically.
6. Duplicate callback không được cộng Coin lần hai.

Ở môi trường demo dùng `PAYMENT_PROVIDER=mock`, response không chứa checkout URL bên ngoài; payment chỉ được hoàn tất qua mock callback.

---

# 14. Error Codes Draft

Account:

```text
USERNAME_ALREADY_EXISTS
EMAIL_ALREADY_EXISTS
PHONE_ALREADY_EXISTS
ACCOUNT_NOT_FOUND
ACCOUNT_LOCKED
ACCOUNT_SUSPENDED
INVALID_CREDENTIALS
```

OTP:

```text
OTP_INVALID
OTP_EXPIRED
OTP_ALREADY_USED
OTP_RATE_LIMITED
```

Social:

```text
SOCIAL_ALREADY_LINKED
SOCIAL_LINKED_TO_ANOTHER_ACCOUNT
CANNOT_UNLINK_LAST_LOGIN_METHOD
```

Wallet:

```text
WALLET_NOT_FOUND
INSUFFICIENT_BALANCE
DUPLICATE_WALLET_TRANSACTION
```

Payment:

```text
PAYMENT_NOT_FOUND
PAYMENT_FAILED
PAYMENT_EXPIRED
INVALID_PAYMENT_CALLBACK
PAYMENT_ALREADY_PROCESSED
```

---

# 15. Suggested Indexes

```text
User(username)
User(email)
User(phone)

SocialIdentity(provider, provider_user_id)

OtpRequest(destination, purpose, created_at)

Wallet(user_id)

WalletTransaction(wallet_id, created_at)
WalletTransaction(user_id, created_at)
WalletTransaction(transaction_no)

Payment(user_id, created_at)
Payment(payment_no)
Payment(provider_transaction_id)
Payment(status, created_at)
```

---

# 16. Important Constraints

- User unique: username/email/phone.
- Wallet one-to-one User.
- Wallet balance >= 0.
- Coin integer only.
- Ledger immutable về business meaning.
- Duplicate payment callback không duplicate TOPUP.
- Social provider identity chỉ thuộc một user.
- Không auto-link social bằng email.
