# ZENX GO Game Hub — Mục lục kế hoạch

## Trạng thái tài liệu

- Trạng thái: đề xuất để triển khai MVP.
- Domain production hiện tại: `https://zenxgo.io.vn`.
- Domain có thể thay đổi trong tương lai; không coi `zenxgo.io.vn` là hằng số trong code hoặc dữ liệu.
- Trọng tâm sản phẩm: UI/UX phía người chơi.
- Game chính dùng để xây template đầu tiên: **Lục Địa Đam Mê**.

## Bộ tài liệu

1. [Kế hoạch sản phẩm và chiến lược domain](./01-product-domain-plan.md)
2. [Scope MVP UI/UX](./02-mvp-ui-ux-scope.md)
3. [Dữ liệu seed và chiến lược nội dung](./03-seed-content-plan.md)
4. [Kiến trúc kỹ thuật và roadmap mở rộng](./04-technical-roadmap.md)

## Quyết định chính

MVP không cố gắng xây một nền tảng game hoàn chỉnh. MVP cần chứng minh được ba điều:

1. `zenxgo.io.vn` có thể chuyển từ cổng tài khoản/ví thành Game Hub mà không làm hỏng các flow hiện có.
2. Một game có thể có website riêng trên subdomain, có theme và nội dung riêng nhưng vẫn dùng chung tài khoản ZENX GO.
3. Bộ component UI có thể tái sử dụng cho nhiều thể loại game mà không làm mọi game trông giống nhau.

Phạm vi đề xuất:

```text
zenxgo.io.vn
├── Homepage Game Hub
├── Danh sách/lọc game
├── Đăng nhập, tài khoản, ví, thanh toán, hỗ trợ hiện có
│
├── lucdia.zenxgo.io.vn
│   ├── Trang chủ hoàn chỉnh
│   ├── Giới thiệu
│   ├── Tin tức + chi tiết bài
│   ├── Roadmap
│   └── Tải game/Coming Soon
│
├── hoalong.zenxgo.io.vn
│   └── Homepage demo theo template chiến thuật
│
├── thitranmay.zenxgo.io.vn
│   └── Homepage demo theo template casual
│
└── orion.zenxgo.io.vn
    └── Homepage demo theo template tactical shooter
```

## Ngoài phạm vi MVP

- CMS/admin hoàn chỉnh.
- Kết nối game server.
- Đồng bộ nhân vật.
- Bảng xếp hạng thật.
- Giftcode thật.
- Nạp Coin vào game.
- Forum/chat/bình luận.
- Đa ngôn ngữ.
- Tự động cấp DNS/subdomain từ giao diện admin.

Các hạng mục này chỉ bắt đầu sau khi UI/UX và cấu trúc nội dung của MVP được duyệt.
