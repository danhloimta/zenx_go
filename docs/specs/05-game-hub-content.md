# Game Hub & Content

> Loại tài liệu: canonical domain specification
>
> Last verified: 2026-09-03
>
> Verified commit: `201525a`

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

## Seed/content source

- `apps/api/prisma/seed.ts` seeds four public games, genres/platforms, articles, milestones, announcements and events.
- Public records are filtered by `isPublic`, `PUBLISHED`, `publishedAt` and time windows before API response.
- Content markdown is escaped and converted to a restricted safe HTML subset by `markdownToSafeHtml`.
- Asset READMEs/PROMPTS remain next to their images; they are not product source-of-truth documents.

## Test evidence

- Integration: `apps/api/test/integration/game.integration.spec.ts`, `portal.integration.spec.ts`.
- Browser: `apps/web/e2e/portal-content.spec.ts`, `vertical-slice.spec.ts`, `auth-subdomain.spec.ts`.
- Test gap: CMS/admin editing, social/community membership, real game server, downloads and in-game topup are not implemented.
