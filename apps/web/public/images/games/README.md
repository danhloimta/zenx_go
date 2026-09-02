# Game image resources

Các artwork trong thư mục này được tạo cho hướng thiết kế homepage Game Hub số 3. Bộ MVP hiện có bốn game: Lục Địa Đam Mê, Vương Triều Hỏa Long, Thị Trấn Mây và Chiến Tuyến Orion.

## Cấu trúc mỗi game

| File | Kích thước | Mục đích |
|---|---:|---|
| `key-art.png` | 1672 × 941 | Artwork gốc, dùng để xuất thêm biến thể; không tải trực tiếp trên web |
| `hero-desktop.webp` | 1920 × 1080 | Hero desktop và featured game panel |
| `hero-mobile.webp` | 1080 × 1350 | Hero mobile/tablet dọc |
| `thumbnail.webp` | 960 × 540 | Game card, carousel và related game |
| `avatar.webp` | 640 × 640 | Ảnh đại diện vuông, menu hoặc game switcher |

Các đường dẫn public, alt text và focal point được khai báo trong `assets-manifest.json`.

## Quy tắc sử dụng

- Dùng `hero-desktop.webp` cho viewport ngang và `hero-mobile.webp` cho mobile bằng `<picture>` hoặc `next/image`.
- Không chèn tên game trực tiếp vào artwork; tên, trạng thái và CTA thuộc lớp UI để responsive và accessibility tốt hơn.
- Dùng `thumbnail.webp` cho card 16:9, không dùng `key-art.png` ở production.
- Dùng `avatar.webp` cho vùng vuông; không tiếp tục crop từ thumbnail trong CSS.
- Giữ nguyên aspect ratio và dùng focal point trong manifest khi cần `object-position`.
- Artwork chỉ cung cấp hình ảnh thế giới; trạng thái và thông tin game luôn lấy từ dữ liệu public trong UI.

## Nguồn tạo

Artwork được tạo bằng công cụ Image Generation tích hợp, dựa trên visual direction đã chọn và phong cách hiện có của ZENX GO/Lục Địa Đam Mê. Prompt không yêu cầu chữ, logo hoặc watermark trong ảnh.
