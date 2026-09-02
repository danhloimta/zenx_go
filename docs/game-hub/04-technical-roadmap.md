# Kiến trúc kỹ thuật và roadmap mở rộng

## 1. Nguyên tắc kiến trúc

- Tiếp tục dùng monorepo Next.js + NestJS + Prisma + SQL Server hiện tại.
- Không tách microservice trong MVP.
- Một Next.js deployment phục vụ portal và các game subdomain.
- Hostname quyết định game context; dữ liệu quyết định theme và section.
- Không tạo một frontend repository riêng cho mỗi game ở giai đoạn này.
- Chỉ tách app khi một game có yêu cầu kỹ thuật hoặc release cycle thực sự độc lập.

## 2. Kiến trúc MVP

```text
Browser
   │
   ├── zenxgo.io.vn
   ├── lucdia.zenxgo.io.vn
   ├── hoalong.zenxgo.io.vn
   ├── thitranmay.zenxgo.io.vn
   └── orion.zenxgo.io.vn
          │
          ▼
  Wildcard DNS + TLS + Reverse Proxy
          │
          ▼
       Next.js Web
   ├── Portal routes
   ├── Game routes
   └── Hostname resolver
          │
          ▼
       NestJS API
   ├── Existing Phase 1 modules
   ├── Game Catalog
   └── Game Content
          │
          ▼
     Prisma + SQL Server
```

## 3. Hostname routing

Luồng xử lý đề xuất:

```text
Request host
→ normalize host và bỏ port
→ so sánh với PUBLIC_BASE_DOMAIN
→ root host: render portal
→ game subdomain: lookup game theo subdomain
→ reserved/unknown host: 404 hoặc unavailable
```

Internal rewrite có thể theo cấu trúc:

```text
zenxgo.io.vn/                  → /_portal/
zenxgo.io.vn/games             → /_portal/games
lucdia.zenxgo.io.vn/           → /_games/luc-dia-dam-me/
lucdia.zenxgo.io.vn/tin-tuc    → /_games/luc-dia-dam-me/tin-tuc
```

Các route `_portal` và `_games` là implementation detail, không xuất hiện trong URL public.

### Local development

Cần hỗ trợ cả hai cách:

- Host-based bằng một local wildcard domain như `*.lvh.me` nếu môi trường cho phép.
- Preview route `/preview/games/[slug]` để designer/developer làm việc khi chưa cấu hình local DNS.

Preview route không được index trên production.

## 4. Cấu hình domain

Thay cấu hình đơn `WEB_ORIGIN` hiện tại bằng cấu hình có mục đích rõ ràng:

```text
PUBLIC_BASE_DOMAIN=zenxgo.io.vn
PUBLIC_WEB_ORIGIN=https://zenxgo.io.vn
ALLOWED_WEB_ORIGINS=https://zenxgo.io.vn
ALLOW_GAME_SUBDOMAINS=true
COOKIE_DOMAIN=.zenxgo.io.vn
```

Không dùng `origin: *` khi request có credentials.

Origin hợp lệ phải:

- Dùng `https` ở production.
- Có hostname bằng base domain hoặc là subdomain trực tiếp được resolve tới một game public.
- Không chỉ kiểm tra bằng `endsWith` thiếu dấu chấm, vì có thể chấp nhận domain giả như `evilzenxgo.io.vn`.
- Loại bỏ port trước khi so sánh hostname theo environment.

## 5. Auth/SSO MVP

MVP có thể chia sẻ cookie trên `.zenxgo.io.vn`:

```text
HttpOnly=true
Secure=true
SameSite=Lax
Domain=.zenxgo.io.vn
```

Các thay đổi bắt buộc:

- `OriginGuard` hỗ trợ allowlist root domain và game subdomain hợp lệ.
- CORS không còn nhận một origin duy nhất.
- OAuth state chứa `returnTo` đã ký hoặc một opaque return token.
- `returnTo` chỉ chấp nhận URL thuộc root/game hostname allowlist.
- Login/logout/refresh được kiểm thử từ root domain và subdomain.

Phương án MVP ưu tiên reverse proxy `/api/v1` trên mọi hostname tới cùng NestJS API, giúp frontend dùng relative API URL và giảm cấu hình theo domain. Nếu giữ API tại root domain, phải cấu hình credentialed CORS đầy đủ cho subdomain.

### Mở rộng sau MVP

Khi hệ sinh thái lớn hoặc có subdomain do bên khác vận hành, chuyển sang SSO tập trung tại `id.<base-domain>` với authorization code/token exchange và cookie host-only. Không chia sẻ parent-domain cookie cho subdomain không hoàn toàn tin cậy.

## 6. Data model MVP

### `Game`

Trường tối thiểu:

```text
id
code
name
slug
subdomain
recordType
tagline
shortDescription
longDescription
lifecycleStatus
operationalStatus
releaseDate/releaseYear
themePreset
themeConfig
featureConfig
logoUrl
iconUrl
coverUrl
heroDesktopUrl
heroMobileUrl
featured
primaryGame
isPublic
sortOrder
createdAt
updatedAt
```

### `Genre` và `GameGenre`

- Genre có `code`, `name`, `slug`, `sortOrder`.
- Một game có nhiều genre.
- Unique theo `code` và `slug`.

### `GameArticle`

- Thuộc một game.
- `title`, `slug`, `excerpt`, `content`, `coverImageUrl`.
- `category`, `status`, `publishedAt`.
- Unique `(gameId, slug)`.

### `GameMilestone`

- Thuộc một game.
- Tên, mô tả, thời gian hiển thị, trạng thái, checklist/config và sort order.

### Theme/feature config

Nếu Prisma/SQL Server stack hiện tại không hỗ trợ JSON column theo cách phù hợp, lưu serialized JSON trong `NVarChar` nhưng phải parse bằng schema validation ở service boundary. Không truyền JSON chưa validate thẳng xuống component.

## 7. Public API MVP

```text
GET /api/v1/games
GET /api/v1/games/:slug
GET /api/v1/games/:slug/articles
GET /api/v1/games/:slug/articles/:articleSlug
GET /api/v1/games/:slug/roadmap
```

Yêu cầu:

- Public endpoint chỉ trả game/content đang public.
- Không expose internal theme/admin fields không cần thiết.
- Filter danh sách game theo genre, platform và lifecycle status.
- Pagination API có thể thiết kế sẵn nhưng UI MVP chưa cần pagination.
- Response dùng contract/type chung trong `packages/api-client`.

## 8. Frontend organization đề xuất

```text
apps/web/
├── app/
│   ├── _portal/                 # internal rewrite target
│   ├── _games/[gameSlug]/       # internal rewrite target
│   ├── auth/
│   ├── account/
│   ├── wallet/
│   └── payment/
├── components/
│   ├── portal/
│   ├── game/
│   ├── content/
│   └── ui/
├── lib/
│   ├── domain.ts
│   ├── game-context.ts
│   └── theme.ts
└── hooks/
```

Tên route group/folder thực tế có thể điều chỉnh theo giới hạn của Next.js App Router; nguyên tắc là portal, game shell và existing account flow phải tách ranh giới rõ.

## 9. Kế hoạch triển khai MVP

### Milestone 0 — Visual foundation

- Audit component hiện có.
- Xây moodboard và UI direction cho portal/Lục Địa Đam Mê.
- Chốt typography, spacing, color tokens, grid và responsive behavior.
- Wireframe mobile/desktop cho các user journey chính.
- Chốt asset checklist.

Đầu ra: thiết kế đủ rõ để code không phải tự đoán layout.

### Milestone 1 — Game catalog foundation

- Prisma migration cho Game, Genre, GameGenre, GameArticle, GameMilestone.
- Seed bốn game và nội dung Lục Địa Đam Mê.
- Public API + API client types.
- Unit/integration tests cho filter, visibility và unique hostname.

Đầu ra: frontend lấy được dữ liệu ổn định, không dùng fixture rải rác.

### Milestone 2 — Portal UI

- Portal header/mobile navigation.
- Homepage Game Hub.
- Featured game section.
- Game grid/filter.
- `/games` và các UI states.
- Cập nhật metadata/SEO.

Đầu ra: domain chính hoàn chỉnh ở desktop/mobile và flow Phase 1 không regress.

### Milestone 3 — Subdomain engine

- Wildcard DNS/TLS ở environment phù hợp.
- Hostname parser và internal rewrite.
- Game context/theme provider.
- Unknown/reserved/disabled hostname states.
- Local preview route.

Đầu ra: bốn subdomain resolve đúng dữ liệu và theme.

### Milestone 4 — Lục Địa Đam Mê UI

- Game shell.
- Homepage.
- Giới thiệu.
- Tin tức và chi tiết bài.
- Roadmap.
- Tải game/Coming Soon.
- Ba homepage demo.

Đầu ra: user journey Lục Địa Đam Mê hoàn chỉnh.

### Milestone 5 — Auth, QA và release

- Cookie/CORS/OriginGuard cho subdomain.
- Signed return URL cho login/OAuth.
- Responsive, accessibility, performance pass.
- Playwright host-routing và critical journey tests.
- Production deployment, smoke test và rollback notes.

Đầu ra: MVP có thể public an toàn.

## 10. Roadmap sau MVP

### Phase 2A — CMS và vận hành nội dung

- Admin game/genre.
- Article editor và media library.
- Quản lý section/theme/feature flags.
- Draft, preview, schedule publish.
- Role `SUPER_ADMIN`, `GAME_ADMIN`, `EDITOR`.
- Audit log.

### Phase 2B — Community và live operations

- Server list/status.
- Event calendar.
- Giftcode campaign.
- Maintenance banner.
- Push/email notification opt-in.
- Role `SUPPORT`, `LIVE_OPS`.

### Phase 2C — Game account integration

- Adapter contract cho từng game backend.
- Link tài khoản/nhân vật.
- Character/server selector.
- Bảng xếp hạng snapshot hoặc real-time có cache.
- Circuit breaker, timeout và degraded state khi game server lỗi.

### Phase 2D — Coin-to-game transaction

- Tỷ lệ/gói quy đổi theo game.
- Chọn server và nhân vật.
- Idempotency end-to-end.
- Atomic debit hoặc compensating refund.
- Retry queue và manual reconciliation.
- Finance dashboard và audit trail.

Phần này phải được thiết kế như nghiệp vụ tài chính, không gọi game API trực tiếp từ frontend.

### Phase 2E — Personalization

- Game đã chơi/gần đây.
- Tin tức theo game quan tâm.
- Campaign/promotion có target.
- Wishlist/follow game.
- Notification center.

## 11. Rủi ro và cách kiểm soát

| Rủi ro | Kiểm soát |
|---|---|
| UI biến thành một template giống nhau cho mọi game | Theme preset + section composition + review bằng ba game demo đối lập |
| Scope phình sang CMS/integration | Giữ seed-only và feature flags trong MVP |
| Cookie/CORS sai khi thêm subdomain | Allowlist theo game public, test root/subdomain và không dùng wildcard origin |
| Đổi domain gây sửa code hàng loạt | Central domain config, relative links và hostname utilities |
| Nội dung trùng SEO | Canonical thuộc subdomain, portal chỉ catalog/preview |
| Asset nặng làm giảm trải nghiệm | Responsive image, kích thước cố định, WebP/AVIF và performance budget |
| Game server lỗi làm hỏng website | Mọi integration sau MVP đi qua adapter/cache và có degraded state |
| Demo game bị hiểu nhầm là sản phẩm thật | `recordType=DEMO`, không public production mặc định |

## 12. Kế hoạch đổi domain sau này

Checklist chuyển domain:

1. Cấu hình wildcard DNS và TLS cho domain mới.
2. Cập nhật reverse proxy.
3. Cập nhật `PUBLIC_BASE_DOMAIN`, web origin, cookie domain và allowlist.
4. Cập nhật OAuth callback URL ở Google/Facebook và environment.
5. Kiểm tra login, refresh, logout và return URL trên root/subdomain.
6. Tạo redirect `301` từ root và mọi game subdomain cũ sang hostname mới tương ứng.
7. Cập nhật canonical, sitemap, robots và Search Console.
8. Giữ redirect domain cũ đủ lâu để bảo toàn link và phiên truy cập.
9. Không cố gắng chia sẻ cookie giữa hai registrable domain khác nhau; người dùng có thể phải đăng nhập lại sau migration.

## 13. Gate trước khi bắt đầu phase tiếp theo

Chỉ bắt đầu CMS/game integration khi:

- Portal và Lục Địa Đam Mê đã được duyệt UI trên mobile/desktop.
- Section/component API đã ổn định qua ít nhất ba theme seed.
- Analytics cho các journey chính đã được định nghĩa.
- Hostname routing và auth xuyên subdomain có automated tests.
- Chủ sản phẩm xác nhận nội dung/asset chính thức và các game demo cần giữ hoặc bỏ.
