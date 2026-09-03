# ZENX GO — Product & Engineering Specs

> Loại tài liệu: canonical source reference
>
> Last verified: 2026-09-03
>
> Verified commit: `788f781`
>
> Đối tượng sử dụng: Product, Engineering và QA

## Mục đích

Folder này mô tả **source hiện tại** của ZENX GO: chức năng người dùng, màn hình web, API, dữ liệu, trạng thái triển khai và bằng chứng kiểm thử. Đây là tài liệu để tracking implementation; không dùng roadmap hoặc ý tưởng tương lai để mô tả như tính năng đã có.

## Mục lục canonical

1. [System overview](./01-system-overview.md) — ranh giới sản phẩm, host, module và cross-cutting rules.
2. [Authentication & Account](./02-auth-account.md) — auth, OTP, social, hồ sơ, bảo mật và CCCD.
3. [Wallet & Payment](./03-wallet-payment.md) — balance, ledger, transaction và payment providers.
4. [Support](./04-support.md) — FAQ, search và support tickets.
5. [Game Hub & Content](./05-game-hub-content.md) — portal, catalog, news, events và game sites.
6. [Screen catalog](./06-screen-catalog.md) — inventory toàn bộ route `page.tsx`.
7. [API & data catalog](./07-api-data-catalog.md) — inventory controller endpoint và data boundary.
8. [Traceability matrix](./08-traceability-matrix.md) — mapping feature → screen → API → source → test.
9. [Admin](./09-admin.md) — quyền truy cập, user operations, audit, dữ liệu nhạy cảm, vận hành và known gaps.

## Quy ước trạng thái

| Status        | Ý nghĩa                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| `IMPLEMENTED` | Có flow chạy được trong source hiện tại và không bị cố ý ẩn.                                |
| `PARTIAL`     | Có một phần flow hoặc content, nhưng chưa đầy đủ theo mục tiêu domain.                      |
| `MOCK`        | Chạy bằng provider/demo fixture giả lập, chưa phải tích hợp production thật.                |
| `HIDDEN`      | Route hoặc hành động chủ động trả 404/không cho người dùng truy cập.                        |
| `INTERNAL`    | Route hoặc page phục vụ routing/error/preview kỹ thuật, không phải màn hình sản phẩm chính. |

Một mục có thể ghi chú thêm dependency, nhưng chỉ dùng một status chính trong catalog.

## Quy ước ID và tracking

- Feature: `FEAT-<DOMAIN>-<NNN>`.
- Screen: `SCR-<DOMAIN>-<NAME>`.
- API: `API-<DOMAIN>-<NAME>`.
- Non-controller HTTP surface: `SURFACE-<NAME>`.
- Source và test phải dùng absolute repository path hoặc path tương đối rõ ràng.
- Header mỗi tài liệu ghi ngày và commit cuối cùng đã rà soát.
- Khi route/API/behavior thay đổi, cập nhật domain document, screen/API catalog và matrix trong cùng change set.
- Nếu chưa có test tự động, ghi `Test gap` thay vì suy đoán là đã được kiểm thử.

## Tài liệu lịch sử được gom vào folder này

Các file `legacy-*` là baseline/spec/roadmap cũ; `audit-*` là kết quả audit tại thời điểm tương ứng. Chúng được giữ để truy vết lịch sử, không override trạng thái trong các tài liệu canonical ở trên.

## Ranh giới

- Root `README.md` vẫn là entrypoint setup của repository.
- README ảnh và `PROMPTS.md` nằm cạnh asset để phục vụ asset workflow, không phải product specification.
- Không ghi roadmap chưa triển khai vào canonical catalog.
