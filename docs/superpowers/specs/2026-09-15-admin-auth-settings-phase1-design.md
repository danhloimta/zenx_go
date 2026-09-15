# Thiết kế Phase 1 — Bật/tắt đăng nhập Google và Facebook

> Ngày: 2026-09-15
>
> Trạng thái: Thiết kế đã duyệt, chờ triển khai

## Hành vi người dùng

Đây là Phase 1 trong lộ trình sáu phase của AdminCP. Tài liệu chỉ mô tả việc quản trị viên bật/tắt đăng nhập và đăng ký bằng Google, Facebook.

Hai nhà cung cấp được điều khiển độc lập:

| Cấu hình | Khi bật | Khi tắt |
| --- | --- | --- |
| Google | Hiện nút Google; cho phép đăng nhập/đăng ký | Ẩn nút Google; máy chủ từ chối luồng Google |
| Facebook | Hiện nút Facebook; cho phép đăng nhập/đăng ký | Ẩn nút Facebook; máy chủ từ chối luồng Facebook |

Mặc định cả hai đều bật. Yêu cầu mới luôn đọc cơ sở dữ liệu nên thay đổi áp dụng ngay, không dùng bộ nhớ đệm.

Ẩn nút chỉ là trình bày. Máy chủ quyết định cuối cùng và chặn cả URL OAuth mở trực tiếp.

## Mục tiêu và phạm vi

- Bật/tắt riêng Google và Facebook tại `/admin/settings`.
- Mỗi công tắc áp dụng cho đăng nhập và đăng ký.
- Chặn khi bắt đầu OAuth và nhận callback.
- Chỉ công khai hai giá trị đúng/sai an toàn.
- Không đổi liên kết/hủy liên kết tài khoản.

Luồng hiện tại dùng `mode=login` để đăng nhập hoặc tạo tài khoản mới. Hai công tắc chỉ kiểm soát mode này.

Máy chủ kiểm tra cơ sở dữ liệu tại hai điểm:

1. **Bắt đầu OAuth:** trước khi tạo state, ghi cookie hoặc chuyển sang Google/Facebook.
2. **Callback OAuth:** sau khi xác thực state, trước khi đổi mã ủy quyền, lấy hồ sơ, đăng nhập hoặc tạo tài khoản.

Nếu nhà cung cấp bị tắt sau khi tạo state, callback vẫn bị từ chối.

`mode=link`, unlink và các màn hình liên quan không đổi.

## Dữ liệu tối thiểu

Thêm singleton định kiểu `AuthSettings`, bảng `auth_settings`, chỉ có dòng `id = 1`:

| Trường | Kiểu | Mặc định | Ý nghĩa |
| --- | --- | --- | --- |
| `googleLoginRegistrationEnabled` | boolean | `true` | Cho phép Google trong `mode=login` |
| `facebookLoginRegistrationEnabled` | boolean | `true` | Cho phép Facebook trong `mode=login` |
| `updatedAt` | datetime | hiện tại | Chống ghi đè thay đổi mới hơn |

Ràng buộc cơ sở dữ liệu chỉ cho phép `id = 1`. Không thêm key/value, JSON hay hạ tầng cấu hình tổng quát.

OAuth client ID, client secret, redirect URI và bí mật khác chỉ nằm trong biến môi trường; không lưu, trả qua API hoặc hiển thị.

## API và phân quyền

Phản hồi JSON tiếp tục dùng dạng `{ data, error }` dưới `/api/v1`.

### API công khai

`GET /auth/provider-availability` không yêu cầu đăng nhập và chỉ trả:

- `google: boolean`
- `facebook: boolean`

Hai giá trị chỉ phản ánh quyết định bật/tắt, không tiết lộ bí mật, thông tin xác thực, URL, người cập nhật hay `updatedAt`. Phản hồi dùng `Cache-Control: no-store`.

### API quản trị

`GET /admin/settings/auth-providers` trả hai trường bật/tắt và `updatedAt`.

`PATCH /admin/settings/auth-providers` nhận ít nhất một trường bật/tắt cùng `expectedUpdatedAt`, rồi trả đủ trạng thái mới.

Đọc và ghi yêu cầu `settings.auth.manage`, tương ứng CASL `manage AuthSettings`. `SUPER_ADMIN` có quyền; `SUPPORT` không có mặc định. Menu, trang và API đều kiểm tra.

Chỉ ghi khi `updatedAt` khớp `expectedUpdatedAt`. Nếu dữ liệu đã đổi, trả `409 STALE_AUTH_SETTINGS_UPDATE`; giao diện tải lại, không tự ghi đè.

## Giao diện

### AdminCP

Thêm mục “Cài đặt” trong nhóm “Hệ thống” và trang `/admin/settings`. Trang có một khối “Đăng nhập & đăng ký mạng xã hội”, hai công tắc Google/Facebook và nút lưu.

Nội dung nói rõ công tắc không ảnh hưởng liên kết/hủy liên kết. Trang thể hiện tải, lỗi/thử lại, đang lưu, thành công và xung đột.

Trang không hiển thị thông tin xác thực, lịch sử hay cấu hình ngoài Phase 1.

### Trang công khai

`/auth/login` và `/auth/register` đọc API công khai:

- Chỉ hiện nút khi giá trị của nhà cung cấp là `true`.
- Nếu cả hai tắt, ẩn phần phân cách đăng nhập mạng xã hội.
- Trong lúc tải hoặc khi đọc lỗi, không hiện nút mạng xã hội.
- Biểu mẫu dùng mật khẩu vẫn hoạt động bình thường.

## Khi nhà cung cấp tắt hoặc cấu hình lỗi

Điểm bắt đầu hoặc callback `mode=login` đã tắt chuyển hướng với `social_error=provider_disabled`. Máy chủ không gọi nhà cung cấp, đổi mã, đăng nhập hay tạo tài khoản.

Callback có state sai vẫn trả lỗi state hiện có. Xác thực state trước để tham số giả không thể nhận là `mode=link`.

Nếu dòng `AuthSettings` bị thiếu hoặc không đọc được:

- API công khai và quản trị trả `503 SETTINGS_UNAVAILABLE`.
- Điểm bắt đầu/callback `mode=login` đóng an toàn với `social_error=settings_unavailable`.
- Trang công khai ẩn nút mạng xã hội.
- Đăng nhập/đăng ký bằng mật khẩu vẫn dùng được.
- `mode=link` và unlink giữ hành vi hiện tại.

Nhà cung cấp bật nhưng thiếu thông tin xác thực vẫn dùng lỗi `not_configured`; công tắc không thể hiện tình trạng kỹ thuật.

## Migration và mặc định

Migration SQL Server tạo bảng singleton, ràng buộc `id = 1`, hai cột mặc định bật, `updatedAt`, quyền `settings.auth.manage` và một dòng mặc định. Migration không sửa user, social identity, session hoặc credential hiện có.

Seed phát triển tạo dòng mặc định nếu thiếu nhưng không cập nhật dòng đã có, tránh ghi đè lựa chọn của quản trị viên. Ứng dụng khi chạy không tự tạo lại dòng bị thiếu.

## Kiểm thử chấp nhận

- Migration tạo một dòng với Google và Facebook đều bật; chạy lại seed không đổi giá trị đã lưu.
- Người thiếu `settings.auth.manage` không thấy trang và bị API từ chối; người có quyền đọc, lưu được hai công tắc.
- Hai người lưu cùng `expectedUpdatedAt`: chỉ lần đầu thành công, lần sau nhận `STALE_AUTH_SETTINGS_UPDATE`.
- Trang đăng nhập và đăng ký hiển thị đúng bốn tổ hợp bật/tắt, không hiện nút trong lúc tải.
- Nhà cung cấp tắt bị chặn ở cả điểm bắt đầu và callback `mode=login`, kể cả state tạo trước khi tắt; không gọi nhà cung cấp hoặc đổi người dùng.
- `mode=link` và unlink vẫn hoạt động khi đăng nhập/đăng ký của cùng nhà cung cấp bị tắt.
- Lỗi cơ sở dữ liệu đóng đăng nhập/đăng ký mạng xã hội nhưng không chặn luồng mật khẩu.
- API công khai chỉ trả hai boolean, không dùng bộ nhớ đệm; không phản hồi nào chứa bí mật OAuth.

## Ngoài phạm vi

- Các phase 2–6 của lộ trình cấu hình AdminCP.
- Cấu hình key/value, cache, pub/sub hoặc đồng bộ nhiều replica.
- Tách riêng công tắc đăng nhập và đăng ký cho cùng nhà cung cấp.
- Sửa thông tin xác thực, kiểm tra sức khỏe nhà cung cấp hoặc ghi đè theo môi trường.
- Thay đổi link/unlink, OTP thực tế, nhật ký hoạt động, DOB, CCCD, wallet hay vòng đời khác.
