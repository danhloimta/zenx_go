# Authentication & Account

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

## Feature inventory

| ID                 | Chức năng                     | Actor      | Flow chính                                                                                                                 | Status        |
| ------------------ | ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `FEAT-AUTH-001`    | Đăng ký username/password     | Guest      | Nhập username/email/phone/password → verify phone OTP → accept Terms/Privacy → tạo account, profile và wallet.             | `IMPLEMENTED` |
| `FEAT-AUTH-002`    | Đăng nhập và session          | User       | Login bằng username/email + password → access/refresh cookie; refresh xoay session; logout revoke refresh và clear cookie. | `IMPLEMENTED` |
| `FEAT-AUTH-003`    | Quên/reset password           | User       | Nhập email → email OTP → verification token → đặt password mới; revoke session cũ.                                         | `IMPLEMENTED` |
| `FEAT-AUTH-004`    | Social login/link             | User       | OAuth state ký và hết hạn → provider code exchange → profile lookup → link hoặc login; không auto-link chỉ bằng email.     | `PARTIAL`     |
| `FEAT-OTP-001`     | OTP channel/purpose           | Guest/User | Gửi OTP qua SMS/Zalo/Email, verify code một lần, hết hạn và giới hạn thử.                                                  | `MOCK`        |
| `FEAT-ACCOUNT-001` | Account summary/contact       | User       | Đọc `account/me`, xem email/phone verification, đổi contact qua OTP.                                                       | `IMPLEMENTED` |
| `FEAT-ACCOUNT-002` | Profile onboarding/basic data | User       | Account mới được đưa tới complete profile; lưu full name, DOB, gender, city, address và avatar.                            | `IMPLEMENTED` |
| `FEAT-ACCOUNT-003` | Sensitive identity/security   | User       | Thiết lập CCCD + secret code + security question; challenge bằng một trong hai; reveal/update/delete sau token.            | `IMPLEMENTED` |
| `FEAT-ACCOUNT-004` | Password/social management    | User       | Đổi/tạo password, link/unlink Google/Facebook; không bỏ login method cuối cùng.                                            | `IMPLEMENTED` |

## Authentication rules

### Register/login/session

- Username và email normalize case-insensitive; phone normalize về format `+84...` trước unique check.
- Register bắt buộc `acceptTerms` và `acceptPrivacy`; phone phải có verification token đúng destination.
- Account tạo thành công có status `ACTIVE`, `phoneVerifiedAt`, `UserProfile` và wallet `ZENX` balance `0`.
- Access token và refresh token được gửi bằng HttpOnly cookie; refresh session lưu hash và bị revoke khi xoay/logout/password change.
- Access JWT có `type: access`; sensitive profile JWT có type riêng và không được AuthGuard chấp nhận như session.
- Account `LOCKED`/`SUSPENDED` bị từ chối dù access JWT còn hạn.

### OTP

- Public OTP dùng cho register, phone/email change và password reset.
- OTP lưu hash Argon2, có TTL, resend delay, attempt limit; code cũ pending bị expire khi tạo code mới.
- Sensitive-profile OTP chỉ được gọi qua authenticated account endpoint và gắn với `userId`; public `/otp/*` từ chối purpose `MANAGE_SENSITIVE_PROFILE`.
- Sensitive recovery ưu tiên phone đã xác thực, fallback email đã xác thực; không có kênh hợp lệ thì trả lỗi rõ ràng.
- Provider hiện tại là mock; log development không được coi là delivery production.

### Social OAuth

- Google/Facebook provider identity được lưu riêng, unique theo `(provider, providerUserId)`.
- OAuth state ký bằng secret, có mode `login`/`link`, return URL được domain policy validate.
- Identity đã thuộc account khác bị từ chối; email trùng không tự động link.
- Unlink không được làm mất login method cuối nếu account chưa có password và không còn social identity khác.
- Provider credentials thiếu thì UI/API trả `not_configured`; đây là `PARTIAL` theo môi trường, không phải lỗi màn hình.

## Basic account/profile

### Screens

| Screen ID              | Route                       | Hành vi chính                                                                                        | API/source/test                                                                                                   |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SCR-ACCOUNT-HOME`     | `/account`                  | Account dashboard, greeting/avatar, wallet shortcut, links tới profile/security/payment/support.     | `/account/me`, `/wallet`; `apps/web/app/account/page.tsx`; account/vertical E2E                                   |
| `SCR-ACCOUNT-COMPLETE` | `/account/complete-profile` | Required onboarding form; save xong cập nhật query cache và chuyển profile.                          | `POST /account/complete-profile`; `apps/web/app/account/complete-profile/page.tsx`; account E2E                   |
| `SCR-ACCOUNT-PROFILE`  | `/account/profile`          | Contact cards, basic profile form, avatar upload, social/password summary và sensitive-profile card. | `/account/me`, `/account/*`, `/account/sensitive-profile/*`; `apps/web/app/account/profile/page.tsx`; account E2E |
| `SCR-ACCOUNT-SECURITY` | `/account/security`         | Email/phone/password security status và shortcut actions.                                            | `/account/me`; `apps/web/app/account/security/page.tsx`; account E2E                                              |
| `SCR-ACCOUNT-PASSWORD` | `/account/change-password`  | Strength checklist, current/new password, social-only first password.                                | `POST /account/change-password`; `apps/web/app/account/change-password/page.tsx`; account E2E                     |
| `SCR-ACCOUNT-SOCIAL`   | `/account/social`           | Link/unlink Google/Facebook, provider status và lỗi OAuth.                                           | `/auth/google                                                                                                     | facebook`, `/account/social/*`; `apps/web/app/account/social/page.tsx`; social/account E2E |

### Basic profile data

`UserProfile` có `fullName`, `avatarUrl`, `dateOfBirth`, `gender`, `city`, `address`, `profileCompletedAt`, terms/privacy versions và timestamps. `PATCH /account/me` chỉ nhận các field profile cơ bản; sensitive fields không được whitelist vào DTO này.

Avatar upload giới hạn 2 MB, chỉ JPEG/PNG/WebP và kiểm tra file signature trước khi lưu. Profile form không dùng sample data khi API trả null.

## Sensitive identity and security

### Data model and setup

- `SensitiveProfile` là bảng 1-1 với User, tách khỏi `user_profiles`.
- CCCD nhận đúng 12 chữ số; ngày cấp không ở tương lai; nơi cấp bắt buộc khi khai báo.
- CCCD payload (số, ngày cấp, nơi cấp) mã hóa AES-256-GCM; lookup HMAC có filtered unique index; UI summary chỉ giữ 4 số cuối.
- Secret code đúng 6 chữ số; security answer normalize Unicode/case/whitespace rồi hash Argon2.
- Question code phải tồn tại và active trong bảng `security_questions`; danh mục hiện tại có 5 bản ghi seed.
- Setup lần đầu/reset dùng OTP; chỉnh sửa/xem/xóa dùng `SECRET_CODE` hoặc `SECURITY_ANSWER` để nhận access token nhạy cảm 5 phút.
- Access token gắn `userId` và `securityVersion`; mọi update làm token cũ mất hiệu lực.
- Năm lần challenge sai khóa 15 phút; thành công reset bộ đếm.
- Không thể xóa security trong khi vẫn giữ CCCD; xóa toàn bộ thực hiện atomically bằng update/delete flow.

### Sensitive screens/flows

`SCR-ACCOUNT-PROFILE` chứa card “Định danh & bảo mật”. Card có summary masked, setup form, challenge step, OTP recovery, reveal view, edit và confirmation trước delete. Không thêm các field này vào onboarding bắt buộc.

### Sensitive API mapping

| API ID                             | Method/path                                  | Mục đích                                     |
| ---------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `API-ACCOUNT-SENSITIVE-QUESTIONS`  | `GET /account/sensitive-profile/questions`   | Danh mục câu hỏi active từ DB.               |
| `API-ACCOUNT-SENSITIVE-SUMMARY`    | `GET /account/sensitive-profile`             | Summary masked, không secret/hash/plaintext. |
| `API-ACCOUNT-SENSITIVE-OTP-SEND`   | `POST /account/sensitive-profile/otp`        | Gửi OTP tới verified phone/email.            |
| `API-ACCOUNT-SENSITIVE-OTP-VERIFY` | `POST /account/sensitive-profile/otp/verify` | Verify OTP và cấp sensitive access token.    |
| `API-ACCOUNT-SENSITIVE-CHALLENGE`  | `POST /account/sensitive-profile/challenge`  | Verify code/answer, lockout và cấp token.    |
| `API-ACCOUNT-SENSITIVE-REVEAL`     | `POST /account/sensitive-profile/reveal`     | Trả identity rõ sau token hợp lệ.            |
| `API-ACCOUNT-SENSITIVE-UPDATE`     | `PATCH /account/sensitive-profile`           | Cập nhật hoặc xóa identity/security.         |

## Test evidence

- Unit: `apps/api/src/account/sensitive-profile.service.spec.ts`, config/OTP specs.
- Integration: `apps/api/test/integration/vertical-slice.integration.spec.ts`, `sensitive-profile.integration.spec.ts`.
- Browser: `apps/web/e2e/account-screens.spec.ts`, `auth-subdomain.spec.ts`.
- Test gap: provider OAuth thật chưa có credentials trong local/test; email/SMS delivery thật chưa được kiểm thử ngoài mock seam.
