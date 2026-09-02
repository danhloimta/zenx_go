# Scope MVP UI/UX

## 1. Nguyên tắc ưu tiên

MVP phân bổ effort dự kiến:

```text
70%  Frontend UI/UX và responsive
20%  Public game data API, seed data và hostname routing
10%  Test, accessibility, performance và SEO cơ bản
```

Ưu tiên thiết kế:

1. Game-first: hình ảnh, thế giới và CTA của game là nội dung chính.
2. Mobile-first: không thiết kế desktop xong rồi thu nhỏ.
3. One primary action: mỗi viewport/section có một hành động chính rõ ràng.
4. Shared shell, distinct identity: dùng chung hệ thống component nhưng mỗi game phải có cá tính riêng.
5. Progressive disclosure: chỉ hiển thị chức năng phù hợp với trạng thái phát triển của game.

## 2. User journeys bắt buộc

### Journey A — Khám phá game

```text
Vào zenxgo.io.vn
→ Nhìn thấy Lục Địa Đam Mê là game nổi bật
→ Xem các game khác
→ Lọc theo thể loại/nền tảng
→ Chọn Lục Địa Đam Mê
→ Sang lucdia.zenxgo.io.vn
```

### Journey B — Khám phá Lục Địa Đam Mê

```text
Vào subdomain
→ Hiểu game là gì và đang ở giai đoạn nào
→ Xem điểm nổi bật/nền tảng
→ Xem roadmap
→ Đọc Development Update
→ Theo dõi cộng đồng hoặc đăng ký tài khoản
```

### Journey C — Đăng nhập từ game

```text
Vào một trang trên lucdia.zenxgo.io.vn
→ Chọn Đăng nhập
→ Hoàn thành đăng nhập/OAuth
→ Quay lại đúng subdomain và route ban đầu
→ Header hiển thị tài khoản và số dư Coin
```

### Journey D — Kiểm chứng đa theme

```text
Chọn game chiến thuật hoặc casual trên Game Hub
→ Sang subdomain demo
→ Nhìn thấy cùng cấu trúc sử dụng nhưng visual identity khác biệt
```

## 3. Scope domain chính

### 3.1 Homepage `/`

#### Header

- Logo ZENX GO.
- Link Game hoặc Khám phá game.
- Đăng nhập/Tạo tài khoản khi chưa đăng nhập.
- Avatar, tên tài khoản và Coin khi đã đăng nhập.
- Navigation mobile.

#### Hero

- Thông điệp ZENX GO là một hệ sinh thái game và tài khoản chung.
- Hình ảnh game nổi bật thay cho minh họa tài khoản chung hiện tại.
- CTA chính: `Khám phá game`.
- CTA phụ: đăng ký hoặc vào tài khoản tùy trạng thái auth.

#### Game nổi bật

- Lục Địa Đam Mê là primary featured game.
- Cover/hero lớn.
- Tag thể loại, nền tảng và trạng thái.
- CTA mở subdomain.

#### Danh sách game

- Card responsive.
- Trạng thái rõ: đang phát triển, sắp ra mắt, open beta, đang hoạt động, bảo trì.
- Filter thể loại và nền tảng.
- MVP dùng bốn game seed.

#### Nội dung bổ trợ

- Game sắp ra mắt.
- Tin tức mới từ các game nếu còn đủ thời gian.
- Footer với tài khoản, hỗ trợ, điều khoản và privacy.

### 3.2 Trang `/games`

- Grid tất cả game.
- Filter theo `genre`, `platform`, `status`.
- Trạng thái filter được phản ánh trong query string.
- Empty state có nút xóa filter.
- Không cần search text trong MVP nếu chỉ có bốn game.
- Không cần pagination trong MVP.

### 3.3 Các trang hiện có

Giữ nguyên nghiệp vụ của:

```text
/auth/*
/account/*
/wallet/*
/payment/*
/support/*
/terms
/privacy
```

Chỉ thực hiện thay đổi tối thiểu:

- Thống nhất header/footer mới.
- Đảm bảo điều hướng quay về Game Hub.
- Responsive và focus states không bị regress.
- Không redesign toàn bộ account/wallet trong cùng MVP.

## 4. Scope subdomain Lục Địa Đam Mê

### 4.1 Game shell dùng chung

- Logo game.
- Navigation desktop/mobile.
- Trạng thái đăng nhập.
- Số dư Coin khi đã đăng nhập.
- Nút quay về ZENX GO.
- Footer game và liên kết pháp lý của hệ sinh thái.
- Theme lấy từ game config, không hard-code trong component.

### 4.2 Homepage `/`

Thứ tự section đề xuất:

1. Hero và tagline `Một thế giới đang được xây dựng lại`.
2. CTA `Khám phá dự án` và `Xem roadmap`.
3. Giới thiệu ngắn về game.
4. Platform cards: PC, Mobile, Web.
5. Điểm nổi bật: đa nền tảng, tái lập lục địa, phong cách hiện đại, cộng đồng.
6. Roadmap preview.
7. Development Updates.
8. Development progress.
9. Gallery hoặc media strip.
10. Community CTA.

### 4.3 Giới thiệu `/gioi-thieu`

- Nguồn gốc DAMMEMU/DAMMe Interactive.
- Triết lý xây dựng.
- Season 6.
- Định hướng lối chơi.
- Đối tượng người chơi.
- Hình ảnh thế giới game.

### 4.4 Tin tức `/tin-tuc`

- Featured article.
- Article grid.
- Danh mục MVP: `Development Update`, `Thông báo`, `Sự kiện`.
- Loading skeleton, empty state và error state.
- Không cần tìm kiếm/pagination khi dữ liệu ít.

### 4.5 Chi tiết tin `/tin-tuc/[articleSlug]`

- Breadcrumb.
- Tiêu đề, category, ngày xuất bản, cover.
- Nội dung rich text đã sanitize.
- Bài liên quan cùng game.
- Share metadata; không cần nút chia sẻ mạng xã hội trong MVP.

### 4.6 Roadmap `/roadmap`

- Timeline responsive.
- Trạng thái `COMPLETED`, `IN_PROGRESS`, `UPCOMING`, `PLANNED`.
- Mốc thời gian và checklist.
- Development progress tổng quát.

### 4.7 Tải game `/tai-game`

- PC, Mobile, Web.
- Trạng thái `COMING_SOON`.
- Không cung cấp file giả.
- CTA theo dõi dự án/cộng đồng.
- Chuẩn bị UI cho version, dung lượng và system requirements nhưng chưa cần backend download trong MVP.

## 5. Scope ba game demo

`hoalong`, `thitranmay` và `orion` chỉ cần:

- Resolve được hostname.
- Hero, giới thiệu ngắn, feature cards và CTA.
- Theme khác Lục Địa Đam Mê.
- Badge `Demo` hoặc `Concept`.
- Không cần tin tức, roadmap, download và account-specific content.

Mục tiêu của chúng là kiểm chứng component system, không phải tạo ba website game đầy đủ.

## 6. Component inventory

### Shared portal

- `PortalHeader`
- `PortalMobileNav`
- `FeaturedGameHero`
- `GameCard`
- `GameGrid`
- `GameFilters`
- `GameStatusBadge`
- `PlatformBadge`
- `GenreChip`
- `AccountMenu`
- `CoinBadge`
- `GlobalFooter`

### Shared game site

- `GameHeader`
- `GameMobileNav`
- `GameHero`
- `SectionHeading`
- `GameIntroduction`
- `FeatureGrid`
- `PlatformCards`
- `ArticleCard`
- `ArticleGrid`
- `RoadmapTimeline`
- `ProgressBars`
- `MediaGallery`
- `DownloadCard`
- `CommunityCTA`
- `GameFooter`

### Required states

Mỗi bề mặt dữ liệu phải có:

- Loading/skeleton.
- Empty state.
- Error state có retry khi phù hợp.
- Disabled/Coming Soon state.
- 404 game/subdomain.
- Game unavailable/maintenance state.

## 7. Responsive breakpoints và UX constraints

- Thiết kế kiểm tra ít nhất ở 375px, 768px, 1280px và 1440px.
- Không phụ thuộc hover để truy cập thông tin hoặc hành động.
- Navigation mobile không che CTA chính.
- Hero mobile không để text đè lên vùng hình ảnh có độ tương phản thấp.
- Card có chiều cao ổn định trong cùng một grid.
- Filter thao tác được bằng bàn phím.
- Focus ring rõ ràng.
- Mục tiêu tương tác tối thiểu khoảng 44px trên mobile.
- Tôn trọng `prefers-reduced-motion`.
- Ảnh có kích thước/aspect ratio cố định để tránh layout shift.

## 8. Visual direction

### ZENX GO portal

- Sạch, hiện đại, trung tính để chứa được nhiều thế giới game.
- Màu thương hiệu ZENX dùng ở navigation, account và CTA hệ sinh thái.
- Game artwork là nguồn màu chính trong khu vực khám phá game.

### Lục Địa Đam Mê

- Giữ hướng editorial fantasy sáng của website hiện tại.
- Typography serif cho heading lớn, sans-serif cho UI và nội dung dài.
- Nền sáng lạnh, xanh xám, khoảng trắng rộng.
- Chuyển động tinh tế; tránh hiệu ứng game portal dày đặc.

### Game chiến thuật demo

- Tông tối/đỏ đồng.
- Layout có cảm giác bản đồ, phe phái và mùa giải.

### Game casual demo

- Màu sáng, hình khối bo tròn, typography thân thiện.
- Section ngắn, CTA rõ và ưu tiên mobile.

## 9. Acceptance criteria MVP

### Functional

- Domain chính hiển thị đúng bốn game seed.
- Filter game hoạt động và có URL chia sẻ được.
- `lucdia`, `hoalong`, `thitranmay`, `orion` resolve đúng game.
- Subdomain không hợp lệ trả về 404 rõ ràng.
- Lục Địa Đam Mê có đủ năm nhóm trang đã định nghĩa.
- Đăng nhập từ subdomain quay lại đúng URL ban đầu.
- Account và wallet flow hiện có không regress.

### UI/UX

- Hoàn chỉnh desktop và mobile, không có horizontal overflow.
- Visual identity của bốn game phân biệt được ngay.
- CTA thay đổi đúng theo lifecycle status.
- Navigation và filter dùng được bằng bàn phím.
- Có loading, empty, error và unavailable states.
- Không hard-code `lucdia` trong component dùng chung.

### Quality

- Có Playwright smoke test cho root host và bốn subdomain.
- Metadata/title/description/favicon thay đổi theo game.
- Không có broken image hoặc layout shift lớn trên hero/card.
- Public pages không yêu cầu đăng nhập.

## 10. Definition of done không bao gồm

MVP chưa được yêu cầu phải có:

- Công cụ admin tạo/sửa game.
- WYSIWYG editor.
- Dữ liệu real-time từ game.
- Download launcher thật.
- BXH, giftcode, server list thật.
- Trừ Coin hoặc giao vật phẩm vào game.
