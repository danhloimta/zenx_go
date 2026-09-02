# Hỏa Long — ảnh cho trang chi tiết

Bộ ảnh phục vụ `design/vuong-trieu-hoa-long-detail-v1.png`. Không thay đổi ảnh cũ hoặc code UI.

## Gắn vào layout

| Vùng trong design | File | Kích thước |
|---|---|---|
| Hero desktop | `hero.webp` | 1600 × 900 |
| Hero mobile | `hero-mobile.webp` | 1080 × 1350 |
| Ảnh bên cạnh giới thiệu | `fortress.webp` | 1200 × 675 |
| Panorama “Dưới bóng Hỏa Long” | dùng lại `hero.webp` | 1600 × 900 |
| Gallery Hỏa long | `dragon.webp` / `dragon-thumb.webp` | 1200 × 675 / 640 × 360 |
| Gallery Thành trì | `fortress.webp` / `fortress-thumb.webp` | 1200 × 675 / 640 × 360 |
| Gallery Chiến địa | `battlefield.webp` / `battlefield-thumb.webp` | 1200 × 675 / 640 × 360 |
| Nền CTA cuối trang | `cta-embers.webp` | 1600 × 533 |

Base URL: `/images/games/vuong-trieu-hoa-long/detail-v1/`.
`manifest.json` có đường dẫn, kích thước thật, byte size, alt và object-position gợi ý; kiểm tra focal point lại trong breakpoint thực tế.

## Ví dụ HTML

```html
<picture>
  <source media="(max-width: 767px)"
    srcset="/images/games/vuong-trieu-hoa-long/detail-v1/hero-mobile.webp">
  <img src="/images/games/vuong-trieu-hoa-long/detail-v1/hero.webp"
    width="1600" height="900" fetchpriority="high"
    alt="Hỏa long bao trùm vương quốc núi lửa">
</picture>
```

Hero cần lớp gradient đen riêng phía trên ảnh để chữ bên trái đủ tương phản. Trên mobile nên đặt phần copy vào vùng nền riêng, tránh che mặt rồng. Không dùng `loading="lazy"` cho hero; ảnh dưới màn hình đầu dùng lazy loading. Dùng thumbnail cho hàng gallery nhỏ, tải ảnh lớn khi người dùng chọn.

CTA dùng background-image cùng `linear-gradient` đen; đây là nền trang trí nên alt rỗng. Giữ tỷ lệ ảnh, không kéo giãn. Khi dùng Next Image, lấy `width`/`height` từ manifest và cung cấp `sizes` theo layout.

## Thành phần không phải ảnh

- Tên game, caption, số I/II/III, button, separator, viền đồng: dựng bằng text/HTML/CSS.
- Icon gợi ý trong `lucide-react`: `Castle`, `Swords`, `Handshake`, `Smartphone`, `Monitor`, `ChevronDown`, `ArrowRight`.
- Icon thư viện thay thế hình trang trí trong mockup, không phải bản trace chính xác.
- Nền các section dùng màu `#0b0b0a`, chữ `#ead8b5`, accent `#a53b13`; kiểm tra contrast ở UI thực tế.

## Nguồn và giới hạn

Hero tái sử dụng key art gốc. Bốn ảnh fortress/dragon/battlefield/cta được tái tạo sạch bằng Image Generation từ mockup và key art: có thể khác chi tiết nhỏ, không phải tách layer nguyên bản. Không chứa chữ hay nút. Các ảnh là minh họa thế giới, không phải screenshot gameplay.

Ảnh nguồn PNG và prompt đầy đủ nằm tại `design/resources/hoa-long-detail-v1/` trong repository.
Xuất lại WebP (cần Node và ImageMagick):

```sh
node design/resources/hoa-long-detail-v1/export.mjs
```

Script chỉ cập nhật chín WebP và manifest trong thư mục `detail-v1`, không đụng ảnh game khác. Không upscale ảnh nguồn mới.
