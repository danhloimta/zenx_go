# Authentication & Account

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-15
>
> Verified commit: `7b087f4`

## Feature inventory

| ID                 | Chức năng                     | Actor      | Flow chính                                                                                                                 | Status        |
| ------------------ | ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `FEAT-AUTH-001`    | Đăng ký username/password     | Guest      | Nhập username/email/phone/password → nếu policy yêu cầu thì verify phone OTP → accept Terms/Privacy → tạo account, profile và wallet. | `IMPLEMENTED` |
| `FEAT-AUTH-002`    | Đăng nhập và session          | User       | Login bằng username/email + password → access/refresh cookie; refresh xoay session; logout revoke refresh và clear cookie. | `IMPLEMENTED` |
| `FEAT-AUTH-003`    | Quên/reset password           | User       | Nhập email → nếu policy yêu cầu thì email OTP → verification token → đặt password mới; revoke session cũ.                  | `IMPLEMENTED` |
| `FEAT-AUTH-004`    | Social login/link             | User       | OAuth state ký và hết hạn → provider code exchange → profile lookup → link hoặc login; không auto-link chỉ bằng email.     | `PARTIAL`     |
| `FEAT-OTP-001`     | OTP channel/purpose           | Guest/User | Gửi OTP qua SMS/Zalo/Email, verify code một lần, hết hạn và giới hạn thử.                                                  | `MOCK`        |
| `FEAT-ACCOUNT-001` | Account summary/contact       | User       | Đọc `account/me`, xem email/phone verification, đổi contact qua OTP.                                                       | `IMPLEMENTED` |
| `FEAT-ACCOUNT-002` | Profile onboarding/basic data | User       | Account mới được đưa tới complete profile; lưu full name, DOB, gender, city, address và avatar.                            | `IMPLEMENTED` |
| `FEAT-ACCOUNT-003` | Sensitive identity/security   | User       | Thiết lập CCCD + secret code + security question; challenge bằng một trong hai; reveal/update/delete sau token.            | `IMPLEMENTED` |
| `FEAT-ACCOUNT-004` | Password/social management    | User       | Đổi/tạo password, link/unlink Google/Facebook; không bỏ login method cuối cùng.                                            | `IMPLEMENTED` |

## Authentication rules

### Register/login/session

- Username và email normalize case-insensitive; phone normalize về format `+84...` trước unique check.
- Register bắt buộc `acceptTerms` và `acceptPrivacy`; canonical policy `otpRequired` (legacy alias: `phoneRegistrationOtpRequired`) quyết định các luồng OTP được yêu cầu.
- Khi policy bật, đăng ký/đổi mật khẩu/đổi SĐT/reset password phải có verification token đúng purpose và destination; khi policy tắt, các luồng này không cần OTP. Nếu không gửi token, đăng ký hoặc đổi SĐT khi tắt giữ `phoneVerifiedAt = null`; token hợp lệ tùy chọn vẫn được tiêu thụ và đánh dấu đã xác thực.
- OTP hợp lệ khi đổi mật khẩu xác nhận SĐT hiện tại và đánh dấu `phoneVerifiedAt` nếu trước đó chưa có; email change và sensitive-profile OTP luôn giữ policy bắt buộc riêng.
- Account tạo thành công có status `ACTIVE`, `UserProfile` và wallet `ZENX` balance `0`; `phoneVerifiedAt` phụ thuộc kết quả xác thực ở trên.
- Access token và refresh token được gửi bằng HttpOnly cookie; refresh session lưu hash và bị revoke khi xoay/logout/password change.
- Access JWT có `type: access`; sensitive profile JWT có type riêng và không được AuthGuard chấp nhận như session.
- Account `LOCKED`/`SUSPENDED` bị từ chối dù access JWT còn hạn.
- Access JWT mang `authVersion`; thay đổi định danh, status, reset password hoặc revoke session làm token cũ mất hiệu lực ngay.
- User có `mustChangePassword=true` chỉ được gọi account-me, change-password và logout; mọi API protected khác trả `PASSWORD_CHANGE_REQUIRED`.

## Admin account operations (Phase 1)

- Admin dùng chung login/session với portal; `AdminGuard` kiểm tra role `SUPER_ADMIN` trực tiếp từ database.
- `UserRole` là bảng mở rộng role; Phase 1 chưa có UI phân quyền, role đầu tiên được cấp bằng lệnh bootstrap idempotent.
- Admin có thể xem/chỉnh hồ sơ, chuyển `ACTIVE`/`SUSPENDED`, thu hồi session và đặt mật khẩu tạm. `LOCKED` chỉ do cơ chế bảo mật và read-only trong admin.
- Email/phone khi admin sửa có thể được đánh dấu verified hoặc chưa verified theo input; username/email/phone thay đổi sẽ revoke session.
- CCCD admin reveal qua endpoint riêng; không trả secret code, security answer hoặc dữ liệu mã hóa.
- Admin profile mutations dùng `expectedUpdatedAt`; conflict trả `STALE_ADMIN_UPDATE` thay vì ghi đè.

### OTP

- Public OTP dùng cho register, đổi SĐT/email và password reset khi policy yêu cầu; OTP đổi mật khẩu được gửi/verify qua account endpoint authenticated.
- Purpose `CHANGE_PASSWORD` luôn yêu cầu `userId` và bị từ chối trên public `/otp/*` (`OTP_PURPOSE_RESTRICTED`).
- OTP lưu hash Argon2, có TTL, resend delay, attempt limit; code cũ pending bị expire khi tạo code mới.
- Sensitive-profile OTP chỉ được gọi qua authenticated account endpoint và gắn với `userId`; public `/otp/*` từ chối purpose `MANAGE_SENSITIVE_PROFILE`.
- Sensitive recovery ưu tiên phone đã xác thực, fallback email đã xác thực; không có kênh hợp lệ thì trả lỗi rõ ràng.
- Provider hiện tại là mock; log development không được coi là delivery production.

### Social OAuth

- Google/Facebook provider identity được lưu riêng, unique theo `(provider, providerUserId)`.
- OAuth state ký bằng secret, có mode `login`/`link`, return URL được domain policy validate.
- Với mode `login`, cả endpoint start và callback đọc mới singleton `AuthSettings` từ database và từ chối provider đang tắt. Không cache quyết định nên thay đổi có hiệu lực ở request kế tiếp, kể cả callback của flow đã bắt đầu.
- `GET /auth/provider-availability` trả projection public `{ google, facebook, otpRequired, phoneRegistrationOtpRequired }` với `Cache-Control: no-store`; login/register ẩn social entry points khi provider tắt và fail closed khi settings không đọc được.
- Cùng response public trả `otpRequired` (kèm alias legacy) để register, account password/phone và reset pages ẩn/hiện OTP. Backend đọc policy mới nhất trên mỗi request; khi settings không đọc được, policy mặc định an toàn là vẫn yêu cầu OTP.
- Với JSON settings APIs, thiếu row singleton hoặc lỗi database trả HTTP `503` + `SETTINGS_UNAVAILABLE`; admin stale update trả HTTP `409` + `STALE_AUTH_SETTINGS_UPDATE`. Với OAuth navigation start/callback, các internal domain code `SETTINGS_UNAVAILABLE` / `SOCIAL_PROVIDER_DISABLED` được chuyển thành HTTP `302` redirect với query lần lượt `social_error=settings_unavailable` / `social_error=provider_disabled`; không code uppercase nào được dùng làm query value.
- Identity đã thuộc account khác bị từ chối; email trùng không tự động link.
- Unlink không được làm mất login method cuối nếu account chưa có password và không còn social identity khác.
- Social provider enforcement chỉ áp dụng mode `login`; `mode=link` và unlink giữ nguyên hành vi. Password/auth recovery flows tuân theo `otpRequired` như các rule ở trên.
- Provider credentials thiếu thì UI/API trả `not_configured`; `FEAT-AUTH-004` vẫn `PARTIAL` vì Phase 1 không lưu credentials, cấu hình hay health-check provider và không chứng minh production readiness.

## Basic account/profile

### Screens

| Screen ID              | Route                       | Hành vi chính                                                                                        | API/source/test                                                                                                   |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SCR-ACCOUNT-HOME`     | `/account`                  | Account dashboard, greeting/avatar, wallet shortcut, links tới profile/security/payment/support.     | `/account/me`, `/wallet`; `apps/web/app/account/page.tsx`; account/vertical E2E                                   |
| `SCR-ACCOUNT-COMPLETE` | `/account/complete-profile` | Required onboarding form; save xong cập nhật query cache và chuyển profile.                          | `POST /account/complete-profile`; `apps/web/app/account/complete-profile/page.tsx`; account E2E                   |
| `SCR-ACCOUNT-PROFILE`  | `/account/profile`          | Contact cards, basic profile form, avatar upload, social/password summary và sensitive-profile card. | `/account/me`, `/account/*`, `/account/sensitive-profile/*`; `apps/web/app/account/profile/page.tsx`; account E2E |
| `SCR-ACCOUNT-SECURITY` | `/account/security`         | Email/phone/password security status và shortcut actions.                                            | `/account/me`; `apps/web/app/account/security/page.tsx`; account E2E                                              |
| `SCR-ACCOUNT-PASSWORD` | `/account/change-password`  | Strength checklist, current/new password, social-only first password và policy-gated SMS OTP.          | `POST /account/change-password`, `/account/change-password/otp*`; `apps/web/app/account/change-password/page.tsx`; account E2E |
| `SCR-ACCOUNT-SOCIAL`   | `/account/social`           | Link/unlink Google/Facebook, provider status và lỗi OAuth.                                           | `/auth/google                                                                                                     | facebook`, `/account/social/*`; `apps/web/app/account/social/page.tsx`; link initiation E2E, unlink API integration |

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

- Unit: `apps/api/src/account/sensitive-profile.service.spec.ts`, `apps/api/src/otp/otp.service.spec.ts`, `apps/api/src/social/social.service.spec.ts`, `apps/api/src/auth-settings/auth-settings.service.spec.ts`, `apps/api/src/auth/auth.controller.spec.ts`, `apps/api/src/config/config.module.spec.ts`.
- Integration: `apps/api/test/integration/vertical-slice.integration.spec.ts`, `sensitive-profile.integration.spec.ts`, `auth-settings.integration.spec.ts`.
- Browser: `apps/web/e2e/account-screens.spec.ts`, `auth-subdomain.spec.ts`, `auth-provider-availability.spec.ts`.
- Test gap: provider OAuth thật chưa có credentials trong local/test; email/SMS delivery thật chưa được kiểm thử ngoài mock seam.
