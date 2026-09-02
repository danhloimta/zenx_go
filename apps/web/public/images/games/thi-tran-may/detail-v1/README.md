# Thị Trấn Mây — ảnh cho trang chi tiết

Bộ ảnh phục vụ `design/thi-tran-may-detail-v1.png`. Không thay đổi ảnh cũ hoặc code UI.

## Gắn vào layout

| Vùng trong design | File | Kích thước |
|---|---|---|
| Hero desktop | `hero.webp` | 1600 × 900 |
| Hero mobile | `hero-mobile.webp` | 1080 × 1350 |
| Ảnh giới thiệu thị trấn | `town-square.webp` | 1200 × 675 |
| Hướng trải nghiệm 01 | `town-square-thumb.webp` | 640 × 360 |
| Hướng trải nghiệm 02 | `garden-thumb.webp` | 640 × 360 |
| Hướng trải nghiệm 03 | `floating-islands-thumb.webp` | 640 × 213 |
| Panorama “Trên những tầng mây” | `floating-islands.webp` | 1800 × 600 |
| Gallery Quảng trường | `town-square.webp` / `town-square-thumb.webp` | 1200 × 675 / 640 × 360 |
| Gallery Khu vườn | `garden.webp` / `garden-thumb.webp` | 1200 × 675 / 640 × 360 |
| Gallery Khinh khí cầu | `airships.webp` / `airships-thumb.webp` | 1200 × 675 / 640 × 360 |
| Banner CTA cuối trang | dùng lại `floating-islands.webp` | 1800 × 600 |

Base URL: `/images/games/thi-tran-may/detail-v1/`.
`manifest.json` có đường dẫn, kích thước thật, byte size, alt, provenance và object-position gợi ý. Kiểm tra focal point ở breakpoint thực tế.

## Ví dụ hero

```html
<picture>
  <source media="(max-width: 767px)"
    srcset="/images/games/thi-tran-may/detail-v1/hero-mobile.webp">
  <img src="/images/games/thi-tran-may/detail-v1/hero.webp"
    width="1600" height="900" fetchpriority="high"
    alt="Thị trấn nổi giữa bầu trời và những tầng mây">
</picture>
```

Hero cần gradient trắng/mây riêng phía trên ảnh để chữ bên trái đủ tương phản. Trên mobile nên đặt copy ở vùng nền riêng, tránh che cụm tháp đồng hồ. Không dùng `loading="lazy"` cho hero; ảnh dưới màn hình đầu dùng lazy loading. Gallery tải thumbnail trước, ảnh lớn khi người dùng chọn.

CTA dùng panorama làm background-image kết hợp gradient trắng/sky-blue; nếu ảnh chỉ trang trí thì để alt rỗng. Giữ tỷ lệ, không kéo giãn. Với Next Image, dùng kích thước từ manifest và khai báo `sizes` theo layout.

## Thành phần không phải ảnh

- Tên game, caption, số 01–03, timeline, button, border: dựng bằng text/HTML/CSS.
- Icon gợi ý trong `lucide-react`: `Home`, `Sprout`, `Send`, `Sun`, `Cloud`, `Moon`, `Smartphone`, `Globe`, `ChevronDown`, `ArrowRight`.
- Icon thư viện thay thế hình trang trí trong mockup, không phải trace chính xác.
- Màu gợi ý: nền `#f7fbff`, chữ `#123b63`, accent `#11999e`, sky `#dff4ff`; kiểm tra contrast ở UI thực tế.

## Nguồn và giới hạn

Hero tái sử dụng key art gốc. Bốn ảnh quảng trường/khu vườn/khinh khí cầu/đảo mây được tái tạo sạch bằng Image Generation từ mockup và key art: có thể khác chi tiết nhỏ, không phải tách layer nguyên bản. Không chứa chữ hay nút. Đây là minh họa concept, không phải screenshot gameplay.

Ảnh nguồn PNG và prompt đầy đủ nằm tại `design/resources/thi-tran-may-detail-v1/` trong repository.
Xuất lại WebP (cần Node và ImageMagick):

```sh
node design/resources/thi-tran-may-detail-v1/export.mjs
```

Script chỉ cập nhật mười WebP và manifest trong thư mục `detail-v1`, không đụng ảnh game khác và không upscale ảnh nguồn.
