# Dữ liệu seed và chiến lược nội dung

## 1. Mục tiêu seed

Seed data phục vụ ba mục tiêu:

1. Cung cấp nội dung thật đủ sâu cho bốn game đang hoạt động.
2. Kiểm tra Game Hub với nhiều thể loại và nền tảng.
3. Kiểm tra khả năng đổi theme/section mà chưa cần CMS.

Không seed quá nhiều game trong MVP. Bốn game là đủ để kiểm chứng UX.

Nội dung Lục Địa Đam Mê trong kế hoạch này được tổng hợp từ website chính thức hiện tại `https://dammeinteractive.vn/lucdiadamme/`, khảo sát ngày 01/09/2026. Trước khi public trên domain mới, nội dung và asset cần được chủ sản phẩm duyệt lại.

## 2. Game seed

### 2.1 Lục Địa Đam Mê

```yaml
code: LDDM
name: Lục Địa Đam Mê
slug: luc-dia-dam-me
subdomain: lucdia
recordType: REAL
tagline: Lục địa huyền thoại đã trở lại.
genres:
  - MMORPG
  - FANTASY
  - ADVENTURE
tags:
  - MU Classic
  - Season 6
  - Đa nền tảng
  - Cộng đồng
platforms:
  - PC
  - MOBILE
  - WEB
isPublic: true
lifecycleStatus: LIVE
operationalStatus: AVAILABLE
releaseYear: 2026
featured: true
primaryGame: true
sortOrder: 1
themePreset: EDITORIAL_FANTASY
```

Mô tả ngắn đề xuất:

> Thế giới MU cổ điển được làm mới, nơi những hoài niệm tuổi thơ được chắp cánh thành niềm đam mê thực sự.

Feature flags MVP:

```yaml
home: true
about: true
news: true
roadmap: true
developmentProgress: false
downloads: false
servers: false
leaderboard: false
giftcode: false
gameTopup: false
```

### 2.2 Vương Triều Hỏa Long

Game chiến thuật đang hoạt động với nội dung mùa và chiến trường liên minh.

```yaml
code: VTHL
name: Vương Triều Hỏa Long
slug: vuong-trieu-hoa-long
subdomain: hoalong
recordType: REAL
tagline: Dựng vương triều. Hiệu triệu Long Thần.
genres:
  - STRATEGY
  - SLG
platforms:
  - MOBILE
  - WEB
isPublic: true
lifecycleStatus: LIVE
operationalStatus: AVAILABLE
releaseYear: 2026
featured: true
primaryGame: false
sortOrder: 2
themePreset: DARK_STRATEGY
```

Feature flags:

```yaml
home: true
about: true
news: true
roadmap: true
downloads: false
servers: false
leaderboard: false
giftcode: false
gameTopup: false
```

### 2.3 Thị Trấn Mây

Game mô phỏng thư giãn đang hoạt động với mùa vụ và hoạt động cộng đồng.

```yaml
code: TTM
name: Thị Trấn Mây
slug: thi-tran-may
subdomain: thitranmay
recordType: REAL
tagline: Sống chậm giữa những tầng mây.
genres:
  - CASUAL
  - SIMULATION
platforms:
  - MOBILE
  - WEB
isPublic: true
lifecycleStatus: LIVE
operationalStatus: AVAILABLE
releaseYear: 2026
featured: true
primaryGame: false
sortOrder: 3
themePreset: PLAYFUL_CASUAL
```

Feature flags giống các game còn lại và bật đầy đủ các route nội dung.

### 2.4 Chiến Tuyến Orion

Game bắn súng chiến thuật đang hoạt động với mùa xếp hạng và chiến trường liên tục.

```yaml
code: CTO
name: Chiến Tuyến Orion
slug: chien-tuyen-orion
subdomain: orion
recordType: REAL
tagline: Tập hợp biệt đội. Giữ vững chiến tuyến.
genres:
  - SHOOTER
platforms:
  - PC
  - MOBILE
isPublic: true
lifecycleStatus: LIVE
operationalStatus: AVAILABLE
releaseYear: 2026
featured: true
primaryGame: false
sortOrder: 4
themePreset: SCI_FI_SHOOTER
```

Feature flags MVP:

```yaml
home: true
about: true
news: true
roadmap: true
downloads: false
servers: false
leaderboard: false
giftcode: false
gameTopup: false
```

## 3. Genre seed

MVP seed nhiều genre hơn số game hiện tại để schema và filter không phải thay đổi ngay khi thêm game:

| Code | Tên hiển thị | Slug |
|---|---|---|
| `MMORPG` | MMORPG | `mmorpg` |
| `RPG` | Nhập vai | `nhap-vai` |
| `FANTASY` | Kỳ ảo | `ky-ao` |
| `ADVENTURE` | Phiêu lưu | `phieu-luu` |
| `STRATEGY` | Chiến thuật | `chien-thuat` |
| `SLG` | Chiến thuật mô phỏng | `slg` |
| `TURN_BASED` | Đánh theo lượt | `danh-theo-luot` |
| `CASUAL` | Giải trí | `casual` |
| `SIMULATION` | Mô phỏng | `mo-phong` |
| `SHOOTER` | Bắn súng | `ban-sung` |

MVP chỉ hiển thị genre có ít nhất một game public.

## 4. Lifecycle và operational status

Không gộp hai khái niệm này.

### Lifecycle

```text
CONCEPT
IN_DEVELOPMENT
INTERNAL_TEST
CLOSED_BETA
OPEN_BETA
LIVE
COMING_SOON
SUNSET
```

Lifecycle quyết định nội dung/CTA cho các game tương lai; bốn game seed hiện tại đều ở `LIVE`:

- `IN_DEVELOPMENT` → Roadmap và nhật ký vận hành nội bộ.
- `INTERNAL_TEST`/`CLOSED_BETA` → Chỉ hiển thị cho nhóm được cấp quyền.
- `OPEN_BETA`/`LIVE` → Nội dung hoạt động và cập nhật cộng đồng.
- `COMING_SOON` → Theo dõi thông báo trước khi mở dịch vụ.
- `SUNSET` → Thông báo đóng dịch vụ và hỗ trợ.

### Operational

```text
AVAILABLE
MAINTENANCE
DEGRADED
UNAVAILABLE
```

Operational status chỉ phản ánh tình trạng truy cập/vận hành hiện tại.

## 5. Roadmap seed

| Thứ tự | Tên | Thời gian | Trạng thái |
|---:|---|---|---|
| 1 | Season hiện tại mở cửa | 07–09/2026 | `COMPLETED` |
| 2 | Bản đồ và hoạt động liên vùng | 08/2026 | `COMPLETED` |
| 3 | Cân bằng và vận hành mùa | 09/2026 | `IN_PROGRESS` |
| 4 | Sự kiện cộng đồng tiếp theo | 10/2026 | `UPCOMING` |
| 5 | Mùa kế tiếp | 11/2026 | `PLANNED` |
| 6 | Nội dung mở rộng | 12/2026 | `PLANNED` |

Mỗi milestone hỗ trợ danh sách checklist ngắn. Checklist chỉ phục vụ hiển thị trong MVP, chưa cần workflow quản lý tiến độ.

## 6. Article seed

Seed 16 bài viết đã xuất bản, phân bổ theo game và đủ bốn category:

1. Lục Địa Đam Mê: 7 bài về Season 6, công thành chiến, cân bằng, bản đồ, cánh/thần thú, bảo trì và thị trường.
2. Vương Triều Hỏa Long: 3 bài về Mùa Liên Minh, Long Thần hệ Hỏa và Phòng thủ Hoàng Thành.
3. Thị Trấn Mây: 3 bài về Quảng trường, mùa vụ và tuyến khinh khí cầu.
4. Chiến Tuyến Orion: 3 bài về Ranked Season 1, ba vai trò và kho trang bị năng lượng.

Mỗi article cần:

```text
gameId
title
slug
excerpt
coverImageUrl
content
category
status
publishedAt
seoTitle
seoDescription
```

Nội dung seed phải được biên tập lại và lưu trong repo/storage của dự án; không hotlink asset từ website cũ.

## 7. Theme seed

### `EDITORIAL_FANTASY`

```text
primary       #54796f
secondary     #778fa0
surface       #edf2f3
text          #203236
heading       serif
body          sans-serif
radius        medium
motion        subtle
```

### `DARK_STRATEGY`

```text
primary       đỏ đồng
surface       charcoal
text          ivory
heading       display serif
radius        small
motion        cinematic
```

### `PLAYFUL_CASUAL`

```text
primary       sky blue
secondary     warm yellow
surface       soft white
text          dark blue
heading       rounded sans-serif
radius        large
motion        playful but reduced-motion safe
```

Giá trị màu cuối cùng cần được chốt trong quá trình thiết kế visual; seed chỉ định hướng preset.

## 8. Section seed

Các section được cấu hình theo game và thứ tự:

```text
HERO
GAME_INTRODUCTION
FEATURE_GRID
PLATFORM_CARDS
ROADMAP_PREVIEW
ARTICLE_GRID
DEVELOPMENT_PROGRESS
MEDIA_GALLERY
COMMUNITY_CTA
```

Các game dùng section theo theme; bốn seed game đều bật:

```text
HERO
GAME_INTRODUCTION
FEATURE_GRID
ROADMAP_PREVIEW
ARTICLE_GRID
COMMUNITY_CTA
```

## 9. Asset checklist

### Lục Địa Đam Mê

- Logo ngang và logo vuông.
- Hero desktop và mobile crop.
- Open Graph image.
- Ba platform thumbnails.
- Ba article covers.
- Tối thiểu bốn gallery images.
- Favicon/app icon.

### Mỗi game

- Một logo chính thức.
- Một hero image desktop/mobile-safe.
- Một cover card.
- Ba feature illustrations hoặc một bộ icon nhất quán.

Tất cả asset cần có quyền sử dụng rõ ràng và được tối ưu WebP/AVIF khi build hoặc upload.

## 10. Seed safety

- Seed production phải idempotent theo `code`, `slug` hoặc khóa tự nhiên ổn định.
- Không xóa game/content hiện có khi chạy lại seed.
- Bốn game seed hiện tại `isPublic=true` trên mọi môi trường.
- Game mới có thể dùng `isPublic=false` cho tới khi nội dung được duyệt.
- Không seed credential, API key, link download giả hoặc dữ liệu người dùng.
