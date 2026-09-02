# Dữ liệu seed và chiến lược nội dung

## 1. Mục tiêu seed

Seed data phục vụ ba mục tiêu:

1. Cung cấp nội dung thật đủ sâu cho Lục Địa Đam Mê.
2. Kiểm tra Game Hub với nhiều thể loại, nền tảng và trạng thái.
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
tagline: Một thế giới đang được xây dựng lại.
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
lifecycleStatus: IN_DEVELOPMENT
operationalStatus: AVAILABLE
releaseYear: 2027
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
developmentProgress: true
downloads: coming_soon
servers: false
leaderboard: false
giftcode: false
gameTopup: false
```

### 2.2 Vương Triều Hỏa Long

Game concept dùng để kiểm tra template chiến thuật; không công bố như sản phẩm thật.

```yaml
code: VTHL
name: Vương Triều Hỏa Long
slug: vuong-trieu-hoa-long
subdomain: hoalong
recordType: DEMO
tagline: Xây dựng vương triều, thống lĩnh chiến trường.
genres:
  - STRATEGY
  - SLG
platforms:
  - MOBILE
  - WEB
lifecycleStatus: COMING_SOON
operationalStatus: AVAILABLE
featured: false
primaryGame: false
sortOrder: 2
themePreset: DARK_STRATEGY
```

Feature flags MVP:

```yaml
home: true
about: false
news: false
roadmap: false
downloads: false
servers: false
leaderboard: false
giftcode: false
gameTopup: false
```

### 2.3 Thị Trấn Mây

Game concept dùng để kiểm tra template casual/mobile; không công bố như sản phẩm thật.

```yaml
code: TTM
name: Thị Trấn Mây
slug: thi-tran-may
subdomain: thitranmay
recordType: DEMO
tagline: Xây một góc nhỏ trên những tầng mây.
genres:
  - CASUAL
  - SIMULATION
platforms:
  - MOBILE
  - WEB
lifecycleStatus: CONCEPT
operationalStatus: AVAILABLE
featured: false
primaryGame: false
sortOrder: 3
themePreset: PLAYFUL_CASUAL
```

Feature flags giống game demo chiến thuật và chỉ bật homepage.

### 2.4 Chiến Tuyến Orion

Game concept dùng để kiểm tra template tactical shooter; không công bố như sản phẩm thật.

```yaml
code: CTO
name: Chiến Tuyến Orion
slug: chien-tuyen-orion
subdomain: orion
recordType: DEMO
tagline: Biệt đội tinh nhuệ bảo vệ thuộc địa không gian.
genres:
  - SHOOTER
platforms:
  - PC
  - MOBILE
lifecycleStatus: CONCEPT
operationalStatus: AVAILABLE
featured: false
primaryGame: false
sortOrder: 4
themePreset: SCI_FI_SHOOTER
```

Feature flags MVP:

```yaml
home: true
about: false
news: false
roadmap: false
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

Lifecycle quyết định nội dung/CTA:

- `IN_DEVELOPMENT` → Roadmap, Development Updates, Theo dõi dự án.
- `INTERNAL_TEST`/`CLOSED_BETA` → Đăng ký test.
- `OPEN_BETA`/`LIVE` → Chơi ngay hoặc Tải game.
- `COMING_SOON` → Theo dõi thông báo.
- `SUNSET` → Thông báo đóng dịch vụ và hỗ trợ.

### Operational

```text
AVAILABLE
MAINTENANCE
DEGRADED
UNAVAILABLE
```

Operational status chỉ phản ánh tình trạng truy cập/vận hành hiện tại.

## 5. Roadmap seed Lục Địa Đam Mê

| Thứ tự | Tên | Thời gian | Trạng thái |
|---:|---|---|---|
| 1 | Foundation / Lên ý tưởng | Q2/2026 | `COMPLETED` |
| 2 | Dựng lại Lục địa / World Remake | 08/2026 | `IN_PROGRESS` |
| 3 | UI/UX 2.0 | 09/2026 | `IN_PROGRESS` |
| 4 | Test nội bộ | 10/2026 | `UPCOMING` |
| 5 | Test cộng đồng | 11/2026 | `PLANNED` |
| 6 | Chuẩn bị ra mắt | 12/2026 | `PLANNED` |
| 7 | Chính thức ra mắt | 2027 | `PLANNED` |

Mỗi milestone hỗ trợ danh sách checklist ngắn. Checklist chỉ phục vụ hiển thị trong MVP, chưa cần workflow quản lý tiến độ.

## 6. Article seed Lục Địa Đam Mê

Seed tối thiểu ba Development Updates từ nội dung đang có:

1. `Không gian gameplay là ưu tiên` — category `DEVELOPMENT_UPDATE`.
2. `World Remake` — category `DEVELOPMENT_UPDATE`.
3. `Character Update` — category `DEVELOPMENT_UPDATE`.

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

Lục Địa Đam Mê bật đầy đủ các section trên. Ba game demo chỉ bật:

```text
HERO
GAME_INTRODUCTION
FEATURE_GRID
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

### Mỗi game demo

- Một logo placeholder.
- Một hero image desktop/mobile-safe.
- Một cover card.
- Ba feature illustrations hoặc một bộ icon nhất quán.

Tất cả asset cần có quyền sử dụng rõ ràng và được tối ưu WebP/AVIF khi build hoặc upload.

## 10. Seed safety

- Seed production phải idempotent theo `code`, `slug` hoặc khóa tự nhiên ổn định.
- Không xóa game/content hiện có khi chạy lại seed.
- Game demo mặc định `isPublic=false` trên production cho đến khi chủ động bật.
- Environment test/dev có thể public game demo để chạy E2E.
- Không seed credential, API key, link download giả hoặc dữ liệu người dùng.
