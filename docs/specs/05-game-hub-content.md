# Game Hub & Content

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `788f781`

## Feature inventory

| ID                 | Chức năng                  | Actor      | Hành vi/source                                                                                 | Status        |
| ------------------ | -------------------------- | ---------- | ---------------------------------------------------------------------------------------------- | ------------- |
| `FEAT-GAME-001`    | Public game catalog        | Guest/User | Lọc game public theo lifecycle status, genre và platform; hiển thị summary/detail.             | `IMPLEMENTED` |
| `FEAT-GAME-002`    | Game subdomain shell       | Guest/User | Hostname game được rewrite vào game context, load game config/theme/content từ API.            | `IMPLEMENTED` |
| `FEAT-GAME-003`    | Game introduction/features | Guest/User | Game home/giới thiệu dùng shared shell nhưng specialized composition theo game slug/subdomain. | `IMPLEMENTED` |
| `FEAT-GAME-004`    | Game articles/roadmap      | Guest/User | Danh sách/chi tiết bài viết và milestone roadmap theo game public.                             | `IMPLEMENTED` |
| `FEAT-GAME-005`    | Download/distribution      | Guest/User | Route download chưa có URL phân phối thật và chủ động bị ẩn.                                   | `HIDDEN`      |
| `FEAT-CONTENT-001` | Portal home                | Guest/User | Announcement active, hero games, latest articles và active events.                             | `IMPLEMENTED` |
| `FEAT-CONTENT-002` | News                       | Guest/User | Lọc game/category, paging và article summaries.                                                | `IMPLEMENTED` |
| `FEAT-CONTENT-003` | Events                     | Guest/User | Lọc game/status, paging, detail và thời gian active/upcoming/ended.                            | `IMPLEMENTED` |
| `FEAT-CONTENT-004` | Community/rewards          | Guest/User | Landing content và CTA social/VIP/perks; link external phụ thuộc env.                          | `PARTIAL`     |
| `FEAT-CMS-001`     | Game CMS                   | SUPER_ADMIN | Chỉnh sửa game hiện có, public/private, trạng thái và thông tin hiển thị cơ bản.               | `IMPLEMENTED` |
| `FEAT-CMS-002`     | Article CMS                | SUPER_ADMIN | Tạo/sửa draft, publish/unpublish bài viết Markdown theo game.                                   | `IMPLEMENTED` |
| `FEAT-CMS-003`     | Event/announcement CMS     | SUPER_ADMIN | Tạo/sửa draft, publish/unpublish event và announcement portal.                                  | `IMPLEMENTED` |

## Portal screens and behavior

### Homepage `/`

`SCR-PORTAL-HOME` ghép `TopAnnouncementRibbon`, navbar, hero showcase, quick utility strip, game catalog grid, news, ecosystem CTA, pre-footer CTA và footer. Server loader gọi `GET /portal/home`; section vẫn render shell/error state khi content API unavailable.

### Game catalog `/games`

`SCR-PORTAL-GAMES` dùng `GamesCatalogClient` để search/filter danh sách game. API chỉ trả `isPublic = true`, sort theo featured/sortOrder/name và filter genre/platform đã normalize.

### News `/news` và events `/events`

- `SCR-PORTAL-NEWS` lọc category/game, phân trang 9 item, chỉ hiển thị article published và game public.
- `SCR-PORTAL-EVENTS` lọc status/game, phân trang 9 item, phân loại active/upcoming/ended dựa trên publish/start/end time.
- `SCR-PORTAL-EVENT-DETAIL` render safe HTML từ markdown content và SEO metadata; slug không tồn tại trả not found.

### Community/rewards

`SCR-PORTAL-COMMUNITY` và `SCR-PORTAL-REWARDS` là landing pages nội dung trình bày/CTA. Các link Discord, Facebook, YouTube và TikTok lấy từ env; provider/community membership thật chưa có backend.

## Admin CMS — Phase 3

CMS dùng `AdminShell` và chỉ `SUPER_ADMIN` được truy cập. `SUPPORT` không được xem hoặc sửa content.

- Game chỉ sửa các trường hiển thị cơ bản; code, slug, subdomain, theme/feature config, genre, platform và roadmap là read-only.
- Article/event/announcement dùng `DRAFT/PUBLISHED`; publish đặt `publishedAt=now`, unpublish xoá `publishedAt`. Không hard-delete, schedule, approval hoặc revision.
- Slug được normalize khi tạo và immutable sau đó. Asset/CTA chỉ nhận path nội bộ an toàn hoặc URL `http/https`.
- Content Markdown được escape, reject raw HTML/image/unsafe link ở API và preview bằng renderer hiện tại.
- Mọi create/update yêu cầu reason; PATCH yêu cầu `expectedUpdatedAt`, conditional update và audit metadata chỉ lưu field/status, không lưu content body.

| Screen ID | Route | Hành vi |
| --- | --- | --- |
| `SCR-ADMIN-CONTENT-HOME` | `/admin/content` | KPI game/article/event/announcement và link quản lý. |
| `SCR-ADMIN-CONTENT-GAMES` | `/admin/content/games` | Search/filter/pagination game và public state. |
| `SCR-ADMIN-CONTENT-GAME` | `/admin/content/games/[gameId]` | Sửa thông tin game cơ bản; định danh/config read-only. |
| `SCR-ADMIN-CONTENT-ARTICLES` | `/admin/content/articles` | Filter article theo game/category/status và mở editor. |
| `SCR-ADMIN-CONTENT-ARTICLE` | `/admin/content/articles/new`, `/admin/content/articles/[articleId]` | Markdown editor, safe preview, draft/publish. |
| `SCR-ADMIN-CONTENT-EVENTS` | `/admin/content/events` | Filter event và mở editor. |
| `SCR-ADMIN-CONTENT-EVENT` | `/admin/content/events/new`, `/admin/content/events/[eventId]` | Event scope game/portal, date range, Markdown và publish. |
| `SCR-ADMIN-CONTENT-ANNOUNCEMENTS` | `/admin/content/announcements` | Danh sách và modal tạo/sửa announcement, status/time window. |

## Game website behavior

Public game host được cấu hình mặc định gồm `lucdia`, `hoalong`, `thitranmay`, `orion`. Mỗi game dùng `GameShell` và `GameContext`; theme/section config được parse/validate ở API.

| Screen ID           | Public route                                             | Internal source route                        | Hành vi                                                                                                    | Status        |
| ------------------- | -------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `SCR-GAME-HOME`     | `https://{subdomain}.zenxgo.io.vn/`                      | `/game-site/[gameKey]`                       | Hero, introduction, feature grid, roadmap preview, article grid, community CTA hoặc specialized game home. | `IMPLEMENTED` |
| `SCR-GAME-ABOUT`    | `https://{subdomain}.zenxgo.io.vn/gioi-thieu`            | `/game-site/[gameKey]/gioi-thieu`            | Long description, theme-aware sections và game facts.                                                      | `IMPLEMENTED` |
| `SCR-GAME-NEWS`     | `https://{subdomain}.zenxgo.io.vn/tin-tuc`               | `/game-site/[gameKey]/tin-tuc`               | Game-scoped article list và category/filter.                                                               | `IMPLEMENTED` |
| `SCR-GAME-ARTICLE`  | `https://{subdomain}.zenxgo.io.vn/tin-tuc/[articleSlug]` | `/game-site/[gameKey]/tin-tuc/[articleSlug]` | Safe article detail, related items và back navigation.                                                     | `IMPLEMENTED` |
| `SCR-GAME-ROADMAP`  | `https://{subdomain}.zenxgo.io.vn/roadmap`               | `/game-site/[gameKey]/roadmap`               | Milestone list/checklist theo sort order/status.                                                           | `IMPLEMENTED` |
| `SCR-GAME-DOWNLOAD` | `https://{subdomain}.zenxgo.io.vn/tai-game`              | `/game-site/[gameKey]/tai-game`              | Chưa có distribution URL; middleware và page trả 404.                                                      | `HIDDEN`      |

`SCR-GAME-PREVIEW` tại `/preview/games/[slug]` dùng `getGameBySlug`, `GameShell` và cùng game home để xem trước trên root; robots `noindex`. Nếu game không tồn tại, page trả not found.

## Content/API mapping

| API ID                  | Method/path                              | Purpose                                          | Status        |
| ----------------------- | ---------------------------------------- | ------------------------------------------------ | ------------- |
| `API-GAME-LIST`         | `GET /games`                             | Catalog public + status/genre/platform filters.  | `IMPLEMENTED` |
| `API-GAME-BY-SUBDOMAIN` | `GET /games/by-subdomain/:subdomain`     | Load game context for middleware/game shell.     | `IMPLEMENTED` |
| `API-GAME-DETAIL`       | `GET /games/:slug`                       | Game detail/config/articles/milestones.          | `IMPLEMENTED` |
| `API-GAME-ARTICLES`     | `GET /games/:slug/articles`              | Published article list for one game.             | `IMPLEMENTED` |
| `API-GAME-ARTICLE`      | `GET /games/:slug/articles/:articleSlug` | Article detail + related.                        | `IMPLEMENTED` |
| `API-GAME-ROADMAP`      | `GET /games/:slug/roadmap`               | Milestones/checklist.                            | `IMPLEMENTED` |
| `API-PORTAL-HOME`       | `GET /portal/home`                       | Announcement, games, latest news, active events. | `IMPLEMENTED` |
| `API-PORTAL-NEWS`       | `GET /portal/news`                       | Published portal news paging/filter.             | `IMPLEMENTED` |
| `API-PORTAL-EVENTS`     | `GET /portal/events`                     | Published event paging/filter/status.            | `IMPLEMENTED` |
| `API-PORTAL-EVENT`      | `GET /portal/events/:slug`               | Event detail and safe content HTML.              | `IMPLEMENTED` |

### Admin CMS API

| API ID | Method/path | Auth | Purpose |
| --- | --- | --- | --- |
| `API-ADMIN-CONTENT-DASHBOARD` | `GET /admin/content/dashboard` | SUPER_ADMIN | Content KPI. |
| `API-ADMIN-CONTENT-GAMES` | `GET /admin/content/games` | SUPER_ADMIN | Search/filter/paginated game list. |
| `API-ADMIN-CONTENT-GAME` | `GET/PATCH /admin/content/games/:id` | SUPER_ADMIN | Game detail và basic fields update. |
| `API-ADMIN-CONTENT-ARTICLES` | `GET /admin/content/articles`, `GET /admin/content/articles/:id` | SUPER_ADMIN | Article list/detail kể cả draft. |
| `API-ADMIN-CONTENT-ARTICLE-MUTATION` | `POST/PATCH /admin/content/articles` | SUPER_ADMIN | Create/update draft hoặc published article. |
| `API-ADMIN-CONTENT-EVENTS` | `GET /admin/content/events`, `GET /admin/content/events/:id` | SUPER_ADMIN | Event list/detail. |
| `API-ADMIN-CONTENT-EVENT-MUTATION` | `POST/PATCH /admin/content/events` | SUPER_ADMIN | Create/update event và publish state. |
| `API-ADMIN-CONTENT-ANNOUNCEMENTS` | `GET/POST/PATCH /admin/content/announcements` | SUPER_ADMIN | Announcement list và mutation. |

## Seed/content source

- `apps/api/prisma/seed.ts` seeds four public games, genres/platforms, articles, milestones, announcements and events.
- Public records are filtered by `isPublic`, `PUBLISHED`, `publishedAt` and time windows before API response.
- Content markdown is escaped and converted to a restricted safe HTML subset by `markdownToSafeHtml`.
- Asset READMEs/PROMPTS remain next to their images; they are not product source-of-truth documents.

## Test evidence

- Integration: `apps/api/test/integration/game.integration.spec.ts`, `portal.integration.spec.ts`.
- Browser: `apps/web/e2e/portal-content.spec.ts`, `vertical-slice.spec.ts`, `auth-subdomain.spec.ts`.
- Test gap: social/community membership, real game server, downloads and in-game topup are not implemented. Theme builder, media library, approval/revision và scheduled publish chưa nằm trong Phase 3.
