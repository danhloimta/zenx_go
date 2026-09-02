# Kế hoạch sản phẩm và chiến lược domain

## 1. Bối cảnh hiện tại

`https://zenxgo.io.vn` hiện là cổng tài khoản và ví ZENX Coin, cung cấp:

- Đăng ký và đăng nhập.
- Quản lý hồ sơ và mật khẩu.
- Liên kết tài khoản social.
- Ví ZENX Coin.
- Nạp Coin qua VietQR.
- Lịch sử giao dịch.
- Hỗ trợ người dùng.

Game Hub là Phase 2, bổ sung lớp khám phá game và website riêng của từng game. Các chức năng tài khoản/ví hiện có tiếp tục được giữ, không viết lại trong MVP.

## 2. Mục tiêu sản phẩm

### Mục tiêu MVP

- Biến homepage hiện tại thành Game Hub có hình ảnh và cá tính game rõ ràng.
- Cho phép người dùng khám phá bốn game đang hoạt động theo thể loại, nền tảng và lịch nội dung.
- Cung cấp website riêng cho cả bốn game trên subdomain.
- Dùng chung trạng thái đăng nhập và tài khoản ZENX GO.
- Chứng minh một bộ section UI có thể phục vụ nhiều loại game.
- Giữ kiến trúc sẵn sàng cho việc thay domain trong tương lai.

### Mục tiêu sau MVP

- CMS quản trị game và nội dung.
- Server status, bảng xếp hạng và giftcode.
- Liên kết tài khoản/nhân vật game.
- Dùng Coin để mua hoặc nạp vào game.
- Cá nhân hóa Game Hub dựa trên game người dùng đã chơi.

## 3. Định vị các bề mặt sản phẩm

### Domain chính

Domain chính là **hệ sinh thái**, không phải website của riêng một game.

Nhiệm vụ chính:

- Giới thiệu thương hiệu ZENX GO.
- Giúp người dùng khám phá game.
- Là điểm vào cho tài khoản, ví, thanh toán và hỗ trợ.
- Hiển thị game nổi bật, game mới và lịch hoạt động mới nhất.
- Điều hướng người dùng sang website chính thức của game.

### Subdomain game

Mỗi subdomain là **website chính thức của một game**.

Nhiệm vụ chính:

- Truyền tải thế giới, hình ảnh và định vị của game.
- Tin tức, hướng dẫn, roadmap hoặc sự kiện.
- CTA phù hợp với trạng thái game: vào trang game, xem tin tức hoặc tham gia cộng đồng.
- Sau MVP có thể mở rộng server, BXH, giftcode và nạp game.

## 4. Quy ước domain không phụ thuộc thương hiệu

Code không được hard-code `zenxgo.io.vn`. Sử dụng cấu hình theo khái niệm:

```text
PUBLIC_BASE_DOMAIN=zenxgo.io.vn
PUBLIC_WEB_ORIGIN=https://zenxgo.io.vn
COOKIE_DOMAIN=.zenxgo.io.vn
```

URL hiện tại:

```text
https://zenxgo.io.vn
https://lucdia.zenxgo.io.vn
https://hoalong.zenxgo.io.vn
https://thitranmay.zenxgo.io.vn
https://orion.zenxgo.io.vn
```

Ví dụ sau này chuyển sang `dammegame.vn`:

```text
PUBLIC_BASE_DOMAIN=dammegame.vn
PUBLIC_WEB_ORIGIN=https://dammegame.vn
COOKIE_DOMAIN=.dammegame.vn
```

Các URL trở thành:

```text
https://dammegame.vn
https://lucdia.dammegame.vn
https://hoalong.dammegame.vn
https://thitranmay.dammegame.vn
https://orion.dammegame.vn
```

Slug game và đường dẫn nội bộ không đổi.

## 5. Quy ước hostname và slug

Mỗi game có hai định danh riêng:

```text
slug: luc-dia-dam-me
subdomain: lucdia
```

- `slug` dùng trong database, API, preview và SEO nội bộ.
- `subdomain` dùng để resolve hostname.
- Không suy diễn subdomain trực tiếp từ tên hiển thị.
- Cả hai phải unique và không đổi tùy tiện sau khi public.

Các subdomain được giữ cho hệ thống:

```text
www
api
admin
id
auth
account
support
cdn
static
assets
status
```

## 6. Điều hướng và canonical URL

- Card game ở Game Hub liên kết thẳng sang subdomain.
- MVP không tạo một bản sao đầy đủ của trang giới thiệu game tại `/games/[slug]` trên domain chính.
- Nếu cần route `/games/[slug]`, route này chỉ redirect sang subdomain hoặc hiển thị preview ngắn.
- Nội dung đầy đủ của game có canonical URL thuộc subdomain để tránh trùng nội dung SEO.
- Sau khi đổi domain, domain cũ redirect `301` sang domain mới và giữ nguyên subdomain/path tương ứng.

## 7. Nguyên tắc trải nghiệm xuyên domain

- Người dùng nhận ra mình vẫn ở trong hệ sinh thái ZENX GO.
- Mỗi game có cá tính riêng, không bị ép dùng màu xanh của portal.
- Header game có lối quay lại Game Hub.
- Trạng thái đăng nhập và Coin hiển thị nhất quán.
- Sau login/OAuth, người dùng quay lại đúng game và đúng trang ban đầu.
- Không dùng URL do client gửi để redirect nếu URL đó không thuộc allowlist domain.

## 8. Chỉ số đánh giá MVP

### Sản phẩm

- Người dùng hiểu ZENX GO có nhiều game ngay trong màn hình đầu tiên.
- Người dùng đi từ Game Hub sang Lục Địa Đam Mê trong tối đa hai thao tác.
- Người dùng nhận biết rõ bốn game đang hoạt động và lịch cập nhật tương ứng.
- CTA chính trên mỗi trang không gây nhầm lẫn.

### Kỹ thuật

- Root domain và game subdomain được resolve đúng từ cùng một deployment.
- Subdomain không tồn tại trả về 404/game unavailable rõ ràng.
- Không hard-code root domain trong component hoặc business logic.
- Đăng nhập hoạt động xuyên các subdomain được cho phép.
- Thay base domain chỉ cần đổi DNS, reverse proxy/OAuth configuration và environment variables.
