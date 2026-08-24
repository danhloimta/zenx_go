# ZENX GO — Product Scope & Functional Specification

## 1. Tổng quan

ZENX GO Phase 1 là cổng tài khoản và ví dành cho người chơi.

Mục tiêu MVP:

- Đăng ký và đăng nhập tài khoản ZENX GO.
- Hỗ trợ đăng nhập bằng username/password.
- Hỗ trợ Google và Facebook.
- Quản lý thông tin tài khoản.
- Xác thực OTP qua các kênh SMS, Zalo hoặc Email.
- Quản lý ví ZENX Coin.
- Nạp Coin qua payment gateway.
- Cộng/trừ Coin thông qua wallet ledger.
- Xem lịch sử giao dịch.

ZENX GO Phase 1 **không phải Game Hub** và chưa bao gồm tích hợp nạp Coin vào game.

---

## 2. Phạm vi MVP

### 2.1 Authentication

Hỗ trợ:

- Đăng ký tài khoản bằng username/password.
- Đăng nhập bằng username/password.
- Đăng nhập bằng Google.
- Đăng nhập bằng Facebook.
- Đăng xuất.
- Quên mật khẩu.
- Reset mật khẩu qua Email.
- Tài khoản social-only có thể thiết lập mật khẩu ZENX GO sau khi xác thực.

### 2.2 Account Management

Người chơi có thể:

- Xem thông tin cá nhân.
- Cập nhật thông tin cá nhân.
- Đổi mật khẩu.
- Đổi email.
- Đổi số điện thoại.
- Liên kết Google.
- Liên kết Facebook.
- Hủy liên kết Google/Facebook.

### 2.3 Wallet

Người chơi có thể:

- Xem số dư ZENX Coin.
- Nạp ZENX Coin.
- Xem lịch sử giao dịch.
- Xem chi tiết giao dịch.

Backend hỗ trợ:

- CREDIT Coin.
- DEBIT Coin.
- REFUND Coin.
- TOPUP Coin.

### 2.4 Payment

Hỗ trợ:

- Danh sách gói Coin.
- Tạo payment.
- Redirect/QR/flow của payment provider.
- Nhận callback/webhook.
- Xác minh payment.
- Cộng Coin khi payment thành công.
- Lịch sử nạp Coin.

---

## 3. Thông tin tài khoản

### 3.1 Trường dữ liệu

Tài khoản ZENX GO gồm:

- Username.
- Password.
- Họ và tên.
- Email.
- Số điện thoại.
- Ngày sinh.
- Giới tính.
- Tỉnh/Thành phố.
- Avatar (optional).
- Trạng thái tài khoản.
- Thời gian tạo/cập nhật.

### 3.2 Quy tắc Unique

Các trường sau phải unique toàn hệ thống:

- `username`
- `phone`
- `email`

Quy tắc:

- Username kiểm tra unique theo kiểu case-insensitive.
- Email kiểm tra unique theo kiểu case-insensitive.
- Phone phải được normalize về một format thống nhất trước khi kiểm tra unique.

Ví dụ:

```text
ZenPlayer
zenplayer
ZENPLAYER
```

được coi là cùng một username.

---

## 4. Đăng ký tài khoản thông thường

Flow:

```text
Nhập thông tin
→ Kiểm tra username/email/phone
→ Gửi OTP
→ Verify OTP
→ Đồng ý Terms & Privacy
→ Tạo ZENX GO account
→ Đăng nhập thành công
```

Thông tin yêu cầu:

- Username.
- Password.
- Họ tên.
- Email.
- Số điện thoại.
- Ngày sinh.
- Giới tính.
- Tỉnh/Thành phố.
- Đồng ý Điều khoản sử dụng.
- Đồng ý Chính sách bảo mật.

---

## 5. Đăng nhập bằng Google/Facebook

Người chơi có thể:

- Tiếp tục bằng Google.
- Tiếp tục bằng Facebook.
- Đăng nhập lại bằng social đã liên kết.

Flow social lần đầu:

```text
Chọn Google/Facebook
→ Đồng ý chia sẻ thông tin
→ Hệ thống nhận social identity
→ Bổ sung thông tin còn thiếu
→ Xác thực số điện thoại bằng OTP
→ Tạo tài khoản ZENX GO
→ Đăng nhập thành công
```

Google/Facebook chỉ hỗ trợ nhận diện và đăng nhập nhanh.

Người chơi vẫn phải xác thực số điện thoại trước khi tài khoản ZENX GO được kích hoạt.

### 5.1 Dữ liệu social

Có thể nhận:

- Họ tên.
- Email.
- Avatar.
- Provider user ID.

Người chơi vẫn phải bổ sung các dữ liệu còn thiếu.

Không lấy password Google/Facebook.

Không dùng email social làm khóa định danh chính.

Định danh social dựa trên:

```text
provider + provider_user_id
```

---

## 6. Liên kết tài khoản social

Sau khi đăng nhập ZENX GO, người chơi có thể:

- Liên kết Google.
- Liên kết Facebook.
- Xem social đang liên kết.
- Hủy liên kết.
- Liên kết đồng thời cả Google và Facebook.

Ví dụ:

| Nền tảng | Trạng thái | Thao tác |
|---|---|---|
| Google | Đã liên kết | Hủy liên kết |
| Facebook | Chưa liên kết | Liên kết |

### 6.1 Quy tắc

- Một Google account chỉ được liên kết với một ZENX GO account.
- Một Facebook account chỉ được liên kết với một ZENX GO account.
- Một ZENX GO account có thể liên kết cả Google và Facebook.
- Không tự động link chỉ vì email social trùng email ZENX GO.
- Social identity đã thuộc account khác phải bị từ chối.

### 6.2 Email social trùng account hiện có

Flow:

```text
Email social đã tồn tại
→ Không tạo account mới
→ Yêu cầu đăng nhập account ZENX GO hiện tại
→ Xác thực
→ Thực hiện link social
```

Không tự động merge hai tài khoản.

### 6.3 Hủy liên kết

Chỉ cho phép hủy social khi tài khoản vẫn còn ít nhất một phương thức đăng nhập khác:

- Có password ZENX GO; hoặc
- Còn social provider khác.

Nếu account social-only chưa có password, user phải tạo password trước khi unlink social cuối cùng.

---

## 7. OTP

OTP được thiết kế theo kiểu provider abstraction.

Kênh hỗ trợ:

- SMS.
- Zalo.
- Email.

Phase 1 chưa chốt vendor cụ thể.

Business logic chỉ gọi OTP Service, không phụ thuộc vendor.

### 7.1 Purpose

OTP có thể dùng cho:

- `REGISTER`
- `VERIFY_PHONE`
- `RESET_PASSWORD`
- `CHANGE_PHONE`
- `LINK_SOCIAL`

### 7.2 Rule MVP

- OTP gồm 6 chữ số.
- OTP hết hạn sau khoảng 5 phút.
- OTP chỉ dùng một lần.
- Resend sau khoảng 60 giây.
- OTP mới làm OTP cũ hết hiệu lực.
- Có basic rate limit cho gửi và verify OTP.

---

## 8. Password

### 8.1 Đổi mật khẩu khi đang đăng nhập

```text
Current Password
→ New Password
→ Confirm Password
→ Thành công
```

### 8.2 Quên mật khẩu

Ưu tiên Email:

```text
Nhập email
→ Gửi mã/link reset
→ Xác thực
→ Nhập mật khẩu mới
→ Thành công
```

Nếu cần có thể fallback qua Phone OTP.

---

## 9. Account Status

MVP dùng các trạng thái:

- `PENDING`
- `ACTIVE`
- `LOCKED`
- `SUSPENDED`

---

## 10. Wallet

Mỗi user có một ZENX Coin wallet.

UI hiển thị:

```text
Ví ZENX

Số dư
12,500 ZENX Coin

[Nạp Coin]

Lịch sử giao dịch
+1,000  Nạp Coin
-200    Trừ Coin
+50     Cộng Coin
```

### 10.1 Transaction Types

MVP:

- `TOPUP`
- `CREDIT`
- `DEBIT`
- `REFUND`

### 10.2 Quy tắc bắt buộc

1. Wallet không được có balance âm.
2. Mọi thay đổi balance đều phải có ledger transaction.
3. Không được cập nhật balance trực tiếp bên ngoài Wallet Service.
4. Một payment thành công chỉ được cộng Coin đúng một lần.
5. CREDIT/DEBIT phải được thực hiện bằng database transaction.
6. Concurrent debit không được làm balance sai.

### 10.3 CREDIT / DEBIT

User không có nút tự trừ Coin.

`CREDIT` và `DEBIT` là backend capability.

Ví dụ:

```text
Authorized System
→ Wallet Service
→ Debit
→ Ledger
→ Update Balance
```

---

## 11. Nạp Coin

Flow:

```text
User chọn gói Coin
→ Chọn payment method
→ Tạo Payment
→ Payment Provider xử lý
→ Backend nhận callback
→ Verify Payment
→ Payment SUCCESS
→ Wallet TOPUP
→ Cộng Coin
→ Hiển thị thành công
```

Không cộng Coin dựa trên kết quả do frontend tự báo.

---

## 12. Coin Package

Ví dụ:

| Package | Giá | Coin |
|---|---:|---:|
| ZENX 20 | 20.000 VND | 200 |
| ZENX 50 | 50.000 VND | 500 |
| ZENX 100 | 100.000 VND | 1.000 |
| ZENX 200 | 200.000 VND | 2.000 |
| ZENX 500 | 500.000 VND | 5.000 |

MVP chưa cần:

- Bonus package.
- Promotion.
- Campaign.

---

## 13. Payment Status

MVP:

- `CREATED`
- `PENDING`
- `SUCCESS`
- `FAILED`
- `EXPIRED`
- `CANCELLED`
- `REFUNDED`

Một callback có thể được provider gửi nhiều lần.

Hệ thống phải đảm bảo idempotency.

Ví dụ:

```text
Payment #123 SUCCESS
Payment #123 SUCCESS
Payment #123 SUCCESS
```

Wallet chỉ được nhận:

```text
+1,000 Coin
```

một lần.

---

## 14. Lịch sử giao dịch

User có thể xem:

- Tất cả.
- Nạp.
- Cộng.
- Trừ.
- Hoàn.

Thông tin transaction:

- Transaction No.
- Ngày giờ.
- Loại.
- Số Coin.
- Trạng thái.
- Mô tả.

Backend lưu thêm:

- Balance before.
- Balance after.
- Reference type.
- Reference ID.

---

## 15. Acceptance Criteria

### Account

- Không tạo được hai account cùng username.
- Không tạo được hai account cùng email.
- Không tạo được hai account cùng phone.
- Login username/password thành công.
- Forgot password qua email thành công.
- Social login lần đầu vẫn yêu cầu phone verification.
- Google/Facebook đã link có thể login lại.
- Không link một social identity vào hai account.
- Không auto-link dựa trên email.

### OTP

- OTP hết hạn không dùng được.
- OTP dùng rồi không dùng lại.
- OTP mới vô hiệu OTP cũ.
- Có thể thay provider SMS/Zalo/Email mà không đổi business logic.

### Wallet

- CREDIT cập nhật balance đúng.
- DEBIT cập nhật balance đúng.
- Không cho debit nếu không đủ balance.
- Concurrent debit không làm balance âm.
- Mỗi thay đổi balance có ledger.
- Balance sau transaction khớp ledger.

### Payment

- Payment thành công cộng đúng Coin.
- Payment thất bại không cộng Coin.
- Duplicate callback không cộng Coin hai lần.
- Transaction TOPUP liên kết đúng Payment.

---

## 16. Out of Scope

Phase 1 chưa bao gồm:

- Game Hub.
- Game catalog.
- Game detail.
- Game server.
- Character.
- Top-up Coin vào game.
- Game integration.
- Game SSO.
- Admin Portal.
- CMS.
- VIP.
- Giftcode.
- Support Ticket.
- News.
- Event.
- Promotion.
- Campaign.
- Server Schedule.
- Apple Login.
- TikTok Login.
- Zalo Login.
- Steam Login.
- Chuyển Coin giữa user.
- Rút Coin ra tiền.
- Marketplace.
- Trading.
