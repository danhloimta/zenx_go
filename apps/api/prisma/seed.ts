import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CoinPackageStatus, SupportStatus } from '../src/common/domain';

const prisma = new PrismaClient();

async function main() {
  await seedGames();
  await seedPortalContent();

  const packages = [
    ['ZENX_1000', 'ZENX 1,000', 20000n, 1000n, 1],
    ['ZENX_2500', 'ZENX 2,500', 50000n, 2500n, 2],
    ['ZENX_5000', 'ZENX 5,000', 100000n, 5000n, 3],
    ['ZENX_12500', 'ZENX 12,500', 200000n, 12500n, 4],
    ['ZENX_25000', 'ZENX 25,000', 500000n, 25000n, 5],
    ['ZENX_50000', 'ZENX 50,000', 1000000n, 50000n, 6],
    ['ZENX_100000', 'ZENX 100,000', 2000000n, 100000n, 7],
  ] as const;

  await prisma.coinPackage.updateMany({ where: { code: { notIn: packages.map(([code]) => code) } }, data: { status: CoinPackageStatus.INACTIVE } });

  for (const [code, name, priceVnd, coinAmount, sortOrder] of packages) {
    await prisma.coinPackage.upsert({
      where: { code },
      update: { name, priceVnd, coinAmount, sortOrder, status: CoinPackageStatus.ACTIVE },
      create: { code, name, priceVnd, coinAmount, sortOrder },
    });
  }

  const categories = [
    {
      code: 'ACCOUNT',
      name: 'Tài khoản',
      sortOrder: 1,
      faqs: [
        ['Làm thế nào để đổi mật khẩu?', 'Vào Tài khoản → Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới, sau đó xác nhận thay đổi.'],
        ['Tôi quên mật khẩu thì phải làm sao?', 'Chọn “Quên mật khẩu?” tại màn hình đăng nhập. Nhập email đã đăng ký và làm theo hướng dẫn để đặt lại mật khẩu.'],
        ['Làm thế nào để cập nhật thông tin cá nhân?', 'Vào Tài khoản → Thông tin cá nhân để cập nhật họ tên, ngày sinh, giới tính, thành phố và địa chỉ.'],
        ['Tôi có thể liên kết Google hoặc Facebook không?', 'Có. Vào Tài khoản → Liên kết tài khoản, chọn nền tảng muốn liên kết và hoàn tất xác thực.'],
      ],
    },
    {
      code: 'TOPUP',
      name: 'Nạp tiền',
      sortOrder: 2,
      faqs: [
        ['Nạp ZENX Coin bằng cách nào?', 'Vào Nạp Coin, chọn gói ZENX Coin và phương thức thanh toán phù hợp, sau đó hoàn tất hướng dẫn của cổng thanh toán.'],
        ['Thanh toán thành công nhưng chưa nhận được Coin?', 'Kiểm tra Lịch sử giao dịch trước. Nếu giao dịch vẫn chưa được cập nhật, hãy tạo yêu cầu hỗ trợ và cung cấp mã payment.'],
        ['Tôi có thể xem lại các lần nạp tiền ở đâu?', 'Vào Ví ZENX → Lịch sử giao dịch để xem số tiền, trạng thái, mã giao dịch và thông tin thanh toán.'],
      ],
    },
    {
      code: 'WALLET',
      name: 'Ví ZENX',
      sortOrder: 3,
      faqs: [
        ['Số dư ZENX Coin được cập nhật khi nào?', 'Số dư được cập nhật sau khi giao dịch được hệ thống xác nhận thành công. Bạn có thể tải lại trang Ví để kiểm tra.'],
        ['Làm sao xem chi tiết một giao dịch?', 'Vào Ví ZENX → Lịch sử giao dịch và chọn giao dịch muốn xem để mở bảng chi tiết.'],
        ['Nếu phát hiện giao dịch bất thường thì phải làm gì?', 'Không chia sẻ mật khẩu hoặc mã xác thực. Hãy tạo yêu cầu hỗ trợ ngay và ghi rõ mã giao dịch bất thường.'],
      ],
    },
    {
      code: 'OTHER',
      name: 'Khác',
      sortOrder: 4,
      faqs: [
        ['Làm thế nào để gửi yêu cầu hỗ trợ?', 'Chọn “Tạo yêu cầu hỗ trợ” trên trang Hỗ trợ, đăng nhập nếu được yêu cầu, chọn danh mục và mô tả vấn đề của bạn.'],
        ['Tôi có thể theo dõi yêu cầu hỗ trợ ở đâu?', 'Vào Tài khoản → Hỗ trợ để xem danh sách ticket, trạng thái và nội dung từng yêu cầu.'],
      ],
    },
  ] as const;

  for (const categoryData of categories) {
    const category = await prisma.supportCategory.upsert({
      where: { code: categoryData.code },
      update: { name: categoryData.name, sortOrder: categoryData.sortOrder, status: SupportStatus.ACTIVE },
      create: { code: categoryData.code, name: categoryData.name, sortOrder: categoryData.sortOrder, status: SupportStatus.ACTIVE },
    });

    for (const [sortOrder, [question, answer]] of categoryData.faqs.entries()) {
      await prisma.supportFaq.upsert({
        where: { categoryId_question: { categoryId: category.id, question } },
        update: { answer, sortOrder, status: SupportStatus.ACTIVE },
        create: { categoryId: category.id, question, answer, sortOrder, status: SupportStatus.ACTIVE },
      });
    }
  }
}

async function seedGames() {
  const genres = [
    ['MMORPG', 'MMORPG', 'mmorpg', 1],
    ['RPG', 'Nhập vai', 'nhap-vai', 2],
    ['FANTASY', 'Kỳ ảo', 'ky-ao', 3],
    ['ADVENTURE', 'Phiêu lưu', 'phieu-luu', 4],
    ['STRATEGY', 'Chiến thuật', 'chien-thuat', 5],
    ['SLG', 'Chiến thuật mô phỏng', 'slg', 6],
    ['TURN_BASED', 'Đánh theo lượt', 'danh-theo-luot', 7],
    ['CASUAL', 'Giải trí', 'casual', 8],
    ['SIMULATION', 'Mô phỏng', 'mo-phong', 9],
    ['SHOOTER', 'Bắn súng', 'ban-sung', 10],
  ] as const;
  const genreIds = new Map<string, string>();
  for (const [code, name, slug, sortOrder] of genres) {
    const genre = await prisma.genre.upsert({ where: { code }, update: { name, slug, sortOrder }, create: { code, name, slug, sortOrder } });
    genreIds.set(code, genre.id);
  }

  const games = [
    {
      code: 'LDDM', name: 'Lục Địa Đam Mê', slug: 'luc-dia-dam-me', subdomain: 'lucdia', recordType: 'REAL',
      tagline: 'Lục địa huyền thoại đã trở lại.',
      shortDescription: 'Thế giới MMORPG fantasy đa nền tảng nơi những hoài niệm tuổi thơ trở thành hành trình mới của cộng đồng.',
      longDescription: 'Lục Địa Đam Mê là thế giới MMORPG fantasy đa nền tảng đã mở cửa, kết nối người chơi qua những vùng đất, trận chiến và mùa phiêu lưu liên tục.',
      lifecycleStatus: 'LIVE', operationalStatus: 'AVAILABLE', releaseYear: 2026,
      themePreset: 'EDITORIAL_FANTASY', featured: true, primaryGame: true, isPublic: true, sortOrder: 1,
      genres: ['MMORPG', 'FANTASY', 'ADVENTURE'], platforms: ['PC', 'MOBILE', 'WEB'],
      heroDesktopUrl: '/images/games/luc-dia-dam-me/hero.webp', heroMobileUrl: '/images/games/luc-dia-dam-me/hero.webp',
      coverUrl: '/images/games/luc-dia-dam-me/nhan_vat3.webp', iconUrl: '/images/games/luc-dia-dam-me/logo.webp', logoUrl: '/images/games/luc-dia-dam-me/logo.webp',
      primaryCtaLabel: 'Trang chủ game', primaryCtaPath: '/', secondaryCtaLabel: 'Xem tin tức', secondaryCtaPath: '/tin-tuc',
      theme: { primary: '#54796f', secondary: '#778fa0', surface: '#edf2f3', text: '#203236', heading: 'serif', body: 'sans-serif', radius: 'medium', motion: 'subtle' },
      features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'MEDIA_GALLERY', 'COMMUNITY_CTA'], routes: ['ABOUT', 'NEWS', 'ROADMAP'], downloads: false, servers: false, leaderboard: false, giftcode: false, gameTopup: false },
      articles: [
        { title: 'Không gian gameplay là ưu tiên', slug: 'khong-gian-gameplay-la-uu-tien', excerpt: 'Mỗi khung hình của Lục Địa Đam Mê giữ thế giới và nhân vật ở trung tâm trải nghiệm.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/hero.webp', content: '# Không gian gameplay là ưu tiên\n\nLục Địa Đam Mê đã mở cửa với nhịp khám phá, chiến đấu và kết nối được thiết kế rõ ràng trên mọi màn hình.\n\nCác khu vực trọng tâm được tối ưu để người chơi luôn đọc được không gian và nhận ra những điều đáng chú ý trong hành trình.\n\n- Giữ nhân vật ở trung tâm trải nghiệm\n- Làm rõ không gian chiến đấu\n- Tối ưu trải nghiệm trên PC, Mobile và Web', publishedAt: new Date('2026-09-01T08:00:00Z') },
        { title: 'Season 6 chính thức mở cửa', slug: 'season-6-chinh-thuc-mo-cua', excerpt: 'Mùa Season 6 đã mở cửa với phần thưởng tân thủ và chuỗi hoạt động cộng đồng đầu tiên.', category: 'EVENT', coverImageUrl: '/images/games/luc-dia-dam-me/hero2.webp', content: '# Season 6 chính thức mở cửa\n\nSeason 6 đưa người chơi trở lại những vùng đất quen thuộc với hệ thống nhiệm vụ, hoạt động bang hội và phần thưởng theo mùa.\n\nNgười chơi mới có thể bắt đầu hành trình ngay từ cổng thành và nhận bộ quà tân thủ trong những ngày đầu.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng mùa đầu tiên\n- Chuỗi nhiệm vụ cộng đồng', publishedAt: new Date('2026-09-01T22:00:00Z') },
        { title: 'Bản đồ đã mở rộng', slug: 'world-remake', excerpt: 'Các tuyến đường giữa thành trì và vùng trời mới đã được mở rộng trong mùa hiện tại.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/bg.webp', content: '# Bản đồ đã mở rộng\n\nCác tuyến đường mới kết nối thành trì, vùng săn và điểm giao thương để hành trình xuyên Lục Địa liền mạch hơn.\n\nHệ thống ánh sáng và mốc định hướng được cập nhật để người chơi dễ nhận biết điểm đến trong cả ngày lẫn đêm.\n\nNhững khu vực tiếp theo sẽ được mở theo lịch vận hành của Season 6.', publishedAt: new Date('2026-08-28T08:00:00Z') },
        { title: 'Cân bằng lớp nhân vật tháng 9', slug: 'character-update', excerpt: 'Bản cân bằng mới giúp các lớp nhân vật có vai trò rõ ràng hơn trong tổ đội và chiến trường.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat3.webp', content: '# Cân bằng lớp nhân vật tháng 9\n\nBản cập nhật tháng 9 điều chỉnh kỹ năng, nhịp hồi chiêu và khả năng phối hợp của các lớp nhân vật.\n\nMục tiêu là để mỗi lựa chọn đều có giá trị trong săn boss, công thành chiến và hoạt động nhóm.\n\nNgười chơi có thể xem chi tiết thay đổi trong nhật ký cập nhật của Season 6.', publishedAt: new Date('2026-08-25T08:00:00Z') },
        { title: 'Cánh và thần thú mùa đầu tiên', slug: 'canh-va-than-thu-di-chuyen-co-y-nghia', excerpt: 'Hệ thống cánh và thần thú mở thêm các tuyến khám phá, kỹ năng hỗ trợ và phần thưởng mùa.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/hero3.webp', content: '# Cánh và thần thú mùa đầu tiên\n\nCánh và thần thú đã trở thành một phần của hành trình, từ di chuyển giữa các thành trì đến hỗ trợ trong những trận chiến lớn.\n\nMỗi lựa chọn có hướng phát triển riêng để người chơi xây dựng phong cách di chuyển và chiến đấu của mình.\n\n- Tuyến bay giữa các thành trì\n- Thần thú hỗ trợ khám phá\n- Phần thưởng gắn với hành trình', publishedAt: new Date('2026-08-22T08:00:00Z') },
        { title: 'Bảo trì định kỳ đã hoàn tất', slug: 'lo-trinh-thu-nghiem-cong-dong', excerpt: 'Hệ thống hình ảnh và tuyến phân phối nội dung đã được đồng bộ sau đợt bảo trì định kỳ.', category: 'MAINTENANCE', coverImageUrl: '/images/games/luc-dia-dam-me/bg2.webp', content: '# Bảo trì định kỳ đã hoàn tất\n\nĐợt bảo trì định kỳ đã hoàn tất và các dịch vụ chính đã trở lại ổn định.\n\nBản cập nhật tối ưu thư viện hình ảnh, tốc độ tải và khả năng hiển thị trên PC, Mobile và Web.\n\nKhông có dữ liệu tài khoản hoặc tiến độ người chơi nào bị ảnh hưởng.', publishedAt: new Date('2026-08-20T08:00:00Z') },
        { title: 'Quy tắc thị trường giao dịch', slug: 'hoan-tat-bao-tri-thu-vien-hinh-anh', excerpt: 'Các nguyên tắc giao dịch mới giúp thị trường vật phẩm minh bạch và an toàn cho mọi người chơi.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat2.webp', content: '# Quy tắc thị trường giao dịch\n\nThị trường giao dịch của Lục Địa Đam Mê vận hành theo các nguyên tắc rõ ràng về giá, lịch sử và quyền sở hữu vật phẩm.\n\nNgười chơi nên kiểm tra kỹ thông tin trước mỗi giao dịch và báo cáo hành vi bất thường qua trung tâm hỗ trợ.\n\nCác quy tắc được cập nhật cùng từng mùa vận hành.', publishedAt: new Date('2026-08-18T08:00:00Z') },
      ],
      milestones: [
        ['Season 6 ra mắt', 'Mở cửa mùa vận hành đầu tiên cho cộng đồng.', '06/2026', 'COMPLETED', ['Mở tài khoản xuyên game', 'Kích hoạt phần thưởng tân thủ']],
        ['Bản đồ liên vùng', 'Kết nối các thành trì và tuyến khám phá chính.', '08/2026', 'COMPLETED', ['Mở tuyến thành trì', 'Cập nhật mốc định hướng']],
        ['Công thành chiến', 'Chu kỳ chiến trường bang hội đang vận hành.', '09/2026', 'IN_PROGRESS', ['Cân bằng chiến trường', 'Theo dõi mùa bang hội']],
        ['Sự kiện cánh và thần thú', 'Chuỗi hoạt động mùa dành cho người chơi mới và cũ.', '09/2026', 'IN_PROGRESS', ['Mở tuyến bay', 'Kích hoạt phần thưởng mùa']],
        ['Cập nhật vùng trời mới', 'Mở rộng khu vực khám phá theo lịch vận hành.', '10/2026', 'UPCOMING', ['Hoàn thiện nhiệm vụ', 'Công bố khu vực mới']],
        ['Mùa bang hội tiếp theo', 'Chuẩn bị chu kỳ cạnh tranh và phần thưởng mới.', '11/2026', 'PLANNED', ['Chốt luật mùa', 'Cập nhật bảng xếp hạng']],
        ['Season 7', 'Mở mùa phiêu lưu tiếp theo trên toàn Lục Địa.', '12/2026', 'PLANNED', ['Công bố nội dung mùa', 'Mở chuỗi nhiệm vụ mới']],
      ],
    },
    {
      code: 'VTHL', name: 'Vương Triều Hỏa Long', slug: 'vuong-trieu-hoa-long', subdomain: 'hoalong', recordType: 'REAL',
      tagline: 'Dựng vương triều. Hiệu triệu Long Thần.', shortDescription: 'Game chiến thuật mô phỏng nơi các vương triều tranh quyền, quản trị tài nguyên và hiệu triệu sức mạnh Long Thần.', longDescription: 'Vương Triều Hỏa Long là chiến trường SLG đang vận hành, nơi mỗi quyết định xây dựng, ngoại giao và điều binh đều mở ra một chương mới cho vương quốc.',
      lifecycleStatus: 'LIVE', operationalStatus: 'AVAILABLE', releaseYear: 2026, themePreset: 'DARK_STRATEGY', featured: true, primaryGame: false, isPublic: true, sortOrder: 2,
      genres: ['STRATEGY', 'SLG'], platforms: ['MOBILE', 'WEB'], heroDesktopUrl: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp', heroMobileUrl: '/images/games/vuong-trieu-hoa-long/hero-mobile.webp', coverUrl: '/images/games/vuong-trieu-hoa-long/key-art.webp', iconUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp', logoUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp',
      primaryCtaLabel: 'Trang chủ game', primaryCtaPath: '/', secondaryCtaLabel: 'Xem tin tức', secondaryCtaPath: '/tin-tuc',
      theme: { primary: '#9b4938', secondary: '#c89254', surface: '#1e1b1c', text: '#fff4df', heading: 'display-serif', body: 'sans-serif', radius: 'small', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['ABOUT', 'NEWS', 'ROADMAP'], downloads: false, servers: false, leaderboard: false, giftcode: false, gameTopup: false }, articles: [
        { title: 'Mùa Liên Minh đầu tiên đã khai mở', slug: 'long-than-thuc-tinh', excerpt: 'Các vương triều đã bước vào mùa Liên Minh với quyền triệu hồi Long Thần và mục tiêu lãnh thổ mới.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/dragon.webp', content: '# Mùa Liên Minh đầu tiên đã khai mở\n\nMùa Liên Minh đưa các vương triều vào cùng một chiến trường, nơi ngoại giao và sức mạnh Long Thần quyết định từng bước tiến.\n\nThủ lĩnh có thể lập liên minh, chia sẻ tuyến tiếp tế và cùng mở khóa phần thưởng theo cột mốc lãnh thổ.\n\n- Bảng mục tiêu liên minh\n- Phần thưởng theo đóng góp\n- Long Thần hỗ trợ chiến trường', publishedAt: new Date('2026-09-01T21:00:00Z') },
        { title: 'Phòng thủ Hoàng Thành', slug: 'phao-dai-va-chien-tuyen', excerpt: 'Bố trí pháo đài, cổng thành và tuyến tiếp tế là chìa khóa giữ vững thủ đô trước các đợt công kích.', category: 'EVENT', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/fortress.webp', content: '# Phòng thủ Hoàng Thành\n\nHoàng Thành bước vào chu kỳ phòng thủ mới với các điểm nghẽn, tuyến tiếp tế và vị trí pháo binh có thể điều chỉnh theo từng trận.\n\nMỗi công trình phục vụ một mục tiêu chiến thuật rõ ràng, từ bảo vệ kho tài nguyên đến mở đường phản công.\n\nHãy phối hợp quân đoàn và theo dõi bản đồ thời gian thực để giữ vững cổng thành.', publishedAt: new Date('2026-08-27T08:00:00Z') },
        { title: 'Long Thần hệ Hỏa gia nhập chiến trường', slug: 'nhat-ky-lien-minh-dau-tien', excerpt: 'Long Thần hệ Hỏa mang đến bộ kỹ năng mới cho các trận chiến liên minh và phòng thủ Hoàng Thành.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp', content: '# Long Thần hệ Hỏa gia nhập chiến trường\n\nLong Thần hệ Hỏa đã sẵn sàng đồng hành cùng các vương triều trong mùa vận hành hiện tại.\n\nBộ kỹ năng thiên về áp lực tuyến đầu, phá giáp và kiểm soát địa hình giúp đội hình có thêm lựa chọn khi giao tranh.\n\nNgười chơi có thể xem chỉ số, kỹ năng và hướng nâng cấp trong sổ tay chiến trường.', publishedAt: new Date('2026-08-18T08:00:00Z') },
      ], milestones: [
        ['Mùa Liên Minh đầu tiên', 'Mùa vận hành liên minh đã mở cửa trên toàn chiến trường.', '08/2026', 'COMPLETED', ['Mở bản đồ liên minh', 'Kích hoạt phần thưởng đóng góp']],
        ['Long Thần hệ Hỏa', 'Bộ Long Thần đầu tiên đã gia nhập các trận chiến mùa hiện tại.', '08/2026', 'COMPLETED', ['Mở kỹ năng hệ Hỏa', 'Cập nhật sổ tay chiến trường']],
        ['Phòng thủ Hoàng Thành', 'Chu kỳ phòng thủ và phản công đang diễn ra hằng tuần.', '09/2026', 'IN_PROGRESS', ['Xoay vòng bản đồ', 'Theo dõi đóng góp liên minh']],
        ['Chiến trường liên vùng', 'Mở rộng giao tranh giữa các vùng lãnh thổ trong mùa tiếp theo.', '10/2026', 'UPCOMING', ['Cân bằng quân đoàn', 'Công bố luật liên vùng']],
        ['Mùa Liên Minh II', 'Chuẩn bị mùa cạnh tranh mới với phần thưởng và mục tiêu mới.', '11/2026', 'PLANNED', ['Chốt bảng phần thưởng', 'Mở đăng ký liên minh']],
      ],
    },
    {
      code: 'TTM', name: 'Thị Trấn Mây', slug: 'thi-tran-may', subdomain: 'thitranmay', recordType: 'REAL',
      tagline: 'Sống chậm giữa những tầng mây.', shortDescription: 'Game mô phỏng thư giãn nơi bạn chăm sóc khu vườn nổi, kết nối hàng xóm và tận hưởng nhịp sống trên mây.', longDescription: 'Thị Trấn Mây là thị trấn mô phỏng đang hoạt động, nơi mỗi ngày mang đến một mùa vụ, chuyến thăm và góc nhỏ để bạn tự tay sắp xếp.',
      lifecycleStatus: 'LIVE', operationalStatus: 'AVAILABLE', releaseYear: 2026, themePreset: 'PLAYFUL_CASUAL', featured: true, primaryGame: false, isPublic: true, sortOrder: 3,
      genres: ['CASUAL', 'SIMULATION'], platforms: ['MOBILE', 'WEB'], heroDesktopUrl: '/images/games/thi-tran-may/hero-desktop.webp', heroMobileUrl: '/images/games/thi-tran-may/hero-mobile.webp', coverUrl: '/images/games/thi-tran-may/key-art.webp', iconUrl: '/images/games/thi-tran-may/avatar.webp', logoUrl: '/images/games/thi-tran-may/avatar.webp',
      primaryCtaLabel: 'Trang chủ game', primaryCtaPath: '/', secondaryCtaLabel: 'Xem tin tức', secondaryCtaPath: '/tin-tuc',
      theme: { primary: '#69bce8', secondary: '#f6c958', surface: '#fffdf7', text: '#193b5a', heading: 'rounded-sans', body: 'sans-serif', radius: 'large', motion: 'playful' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['ABOUT', 'NEWS', 'ROADMAP'], downloads: false, servers: false, leaderboard: false, giftcode: false, gameTopup: false }, articles: [
        { title: 'Một ngày ở Quảng trường Mây', slug: 'mot-ngay-o-quang-truong-may', excerpt: 'Quảng trường Mây rộn ràng với chợ cuối tuần, hoạt động cộng đồng và những cuộc hẹn giữa các đảo.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp', content: '# Một ngày ở Quảng trường Mây\n\nQuảng trường là nơi người chơi gặp nhau, trao đổi vật phẩm và bắt đầu các hoạt động theo mùa.\n\nMỗi ngày có các nhiệm vụ ngắn, góc chụp ảnh và lịch ghé thăm hàng xóm để thị trấn luôn có nhịp sống mới.\n\n- Chợ cuối tuần\n- Lễ hội ánh sáng\n- Góc chụp ảnh cộng đồng', publishedAt: new Date('2026-09-01T12:00:00Z') },
        { title: 'Khu vườn nổi vào mùa vụ mới', slug: 'khu-vuon-noi-va-mua-vu', excerpt: 'Mùa vụ mới mang đến giống cây, vật liệu trang trí và phần thưởng chăm sóc vườn cho cư dân trên mây.', category: 'EVENT', coverImageUrl: '/images/games/thi-tran-may/detail-v1/garden.webp', content: '# Khu vườn nổi vào mùa vụ mới\n\nCác hòn đảo đã bước vào mùa vụ mới với bộ giống cây và vật liệu trang trí theo chủ đề.\n\nBạn có thể sắp xếp khu vườn theo cá tính riêng, ghé thăm bạn bè và đổi nông sản tại Quảng trường Mây.\n\nPhần thưởng mùa được mở khóa qua những phiên chăm sóc ngắn, nhẹ nhàng mỗi ngày.', publishedAt: new Date('2026-08-26T08:00:00Z') },
        { title: 'Tuyến Quảng trường Mây đã thông suốt', slug: 'khinh-khi-cau-ket-noi-cac-dao', excerpt: 'Tuyến khinh khí cầu mới rút ngắn hành trình giữa các đảo và mở thêm điểm ngắm cảnh cho cư dân.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/thi-tran-may/detail-v1/airships.webp', content: '# Tuyến Quảng trường Mây đã thông suốt\n\nKhinh khí cầu kết nối các đảo đã được mở rộng, giúp người chơi di chuyển nhanh hơn giữa khu vườn, quảng trường và bến giao thương.\n\nMỗi chuyến thăm bạn bè có thêm hoạt động nhỏ, quà trang trí và cơ hội trao đổi nguyên liệu.\n\nLịch bay được cập nhật trong bảng thông tin của thị trấn để bạn dễ lên kế hoạch.', publishedAt: new Date('2026-08-17T08:00:00Z') },
      ], milestones: [
        ['Khai mở Quảng trường Mây', 'Quảng trường trung tâm đã mở cửa cho cư dân và khách ghé thăm.', '07/2026', 'COMPLETED', ['Mở chợ cuối tuần', 'Kích hoạt lịch hoạt động']],
        ['Khu vườn bốn mùa', 'Hệ thống mùa vụ và bộ giống đầu tiên đã vận hành ổn định.', '08/2026', 'COMPLETED', ['Mở bốn mùa vụ', 'Thêm vật liệu trang trí']],
        ['Lễ hội Khinh khí cầu', 'Lễ hội kết nối các đảo đang diễn ra với nhiệm vụ và quà trang trí.', '09/2026', 'IN_PROGRESS', ['Mở tuyến bay', 'Thu thập huy hiệu lễ hội']],
        ['Mở rộng các đảo', 'Thêm không gian xây dựng và điểm ngắm cảnh trong bản cập nhật tới.', '10/2026', 'UPCOMING', ['Chuẩn bị mặt bằng', 'Công bố bộ trang trí']],
        ['Mùa hội ánh sáng', 'Chuỗi hoạt động cộng đồng tiếp theo của Thị Trấn Mây.', '11/2026', 'PLANNED', ['Chọn chủ đề mùa', 'Mở lịch đăng ký']],
      ],
    },
    {
      code: 'CTO', name: 'Chiến Tuyến Orion', slug: 'chien-tuyen-orion', subdomain: 'orion', recordType: 'REAL',
      tagline: 'Tập hợp biệt đội. Giữ vững chiến tuyến.', shortDescription: 'Game bắn súng chiến thuật khoa học viễn tưởng nơi các biệt đội phối hợp để bảo vệ thuộc địa ngoài không gian.', longDescription: 'Chiến Tuyến Orion là chiến trường tactical shooter đang vận hành, nơi Recon, Assault và Support phối hợp qua từng trận đấu để giữ vững Vành đai Orion.',
      lifecycleStatus: 'LIVE', operationalStatus: 'AVAILABLE', releaseYear: 2026, themePreset: 'SCI_FI_SHOOTER', featured: true, primaryGame: false, isPublic: true, sortOrder: 4,
      genres: ['SHOOTER'], platforms: ['PC', 'MOBILE'], heroDesktopUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp', heroMobileUrl: '/images/games/chien-tuyen-orion/hero-mobile.webp', coverUrl: '/images/games/chien-tuyen-orion/key-art.webp', iconUrl: '/images/games/chien-tuyen-orion/avatar.webp', logoUrl: '/images/games/chien-tuyen-orion/avatar.webp',
      primaryCtaLabel: 'Trang chủ game', primaryCtaPath: '/', secondaryCtaLabel: 'Xem tin tức', secondaryCtaPath: '/tin-tuc',
      theme: { primary: '#6c8cff', secondary: '#57d7ff', surface: '#0b1224', text: '#e8f0ff', heading: 'display-sans', body: 'sans-serif', radius: 'medium', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['ABOUT', 'NEWS', 'ROADMAP'], downloads: false, servers: false, leaderboard: false, giftcode: false, gameTopup: false }, articles: [
        { title: 'Ranked Season 1: Vành đai Orion', slug: 'bao-cao-chien-tuyen-vanh-dai-orion', excerpt: 'Ranked Season 1 đã mở với bản đồ Vành đai Orion, mục tiêu xoay vòng và bảng xếp hạng theo mùa.', category: 'EVENT', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/battlefield-panorama.webp', content: '# Ranked Season 1: Vành đai Orion\n\nRanked Season 1 đưa các biệt đội vào Vành đai Orion với mục tiêu thay đổi theo trận và bảng xếp hạng cập nhật liên tục.\n\nCác tuyến đường nhiều độ cao và vật cản tạo không gian để từng vai trò tạo ảnh hưởng theo cách riêng.\n\n- Điểm quan sát ngoài trời\n- Khu vực trú ẩn\n- Mục tiêu xoay vòng theo trận', publishedAt: new Date('2026-09-01T23:00:00Z') },
        { title: 'Cân bằng ba vai trò trong tháng 9', slug: 'ba-vai-tro-cho-mot-biet-doi', excerpt: 'Recon, Assault và Support nhận điều chỉnh để mỗi đội hình đều có nhiều cách phối hợp hiệu quả.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp', content: '# Cân bằng ba vai trò trong tháng 9\n\nBản cân bằng tháng 9 làm rõ nhiệm vụ của Recon, Assault và Support trong các tình huống giao tranh khác nhau.\n\nRecon mở thông tin, Assault tạo áp lực tuyến đầu còn Support duy trì khả năng chiến đấu cho cả đội.\n\nThay đổi được theo dõi qua dữ liệu trận đấu và phản hồi cộng đồng để giữ nhịp thi đấu công bằng.', publishedAt: new Date('2026-08-29T08:00:00Z') },
        { title: 'Kho trang bị năng lượng đã mở', slug: 'kho-trang-bi-nang-luong', excerpt: 'Bộ trang bị năng lượng mới mở thêm lựa chọn chiến thuật cho các đặc vụ trong Vành đai Orion.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/equipment-strip.webp', content: '# Kho trang bị năng lượng đã mở\n\nKho trang bị năng lượng mang đến các thiết bị thay đổi cách đặc vụ tiếp cận một khu vực, thay vì chỉ cộng thêm sát thương.\n\nTừ giáp phản lực đến thiết bị tạo lá chắn, mỗi món đồ mở ra một lựa chọn chiến thuật khác nhau cho biệt đội.\n\nBộ trang bị được cập nhật theo mùa và hiển thị đầy đủ trong sổ tay chiến trường.', publishedAt: new Date('2026-08-21T08:00:00Z') },
      ], milestones: [
        ['Vành đai Orion mở cửa', 'Chiến tuyến đầu tiên đã mở cho các biệt đội.', '07/2026', 'COMPLETED', ['Mở bản đồ chính', 'Kích hoạt ghép trận']],
        ['Ba vai trò biệt đội', 'Recon, Assault và Support đã hoàn thiện bộ vai trò cốt lõi.', '08/2026', 'COMPLETED', ['Cân bằng kỹ năng', 'Mở sổ tay chiến thuật']],
        ['Ranked Season 1', 'Mùa xếp hạng đầu tiên đang vận hành với bảng xếp hạng theo tuần.', '09/2026', 'IN_PROGRESS', ['Mở mục tiêu xoay vòng', 'Trao phần thưởng mùa']],
        ['Kho trang bị tháng 9', 'Bộ trang bị năng lượng mới được mở theo lịch vận hành mùa.', '09/2026', 'UPCOMING', ['Cập nhật kho đồ', 'Công bố chỉ số thiết bị']],
        ['Chiến tuyến mới', 'Mở rộng bản đồ và mục tiêu cho mùa tiếp theo.', '11/2026', 'PLANNED', ['Khảo sát tuyến đường', 'Chốt luật thi đấu']],
      ],
    },
  ] as const;

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { code: gameData.code },
      update: {
        name: gameData.name, slug: gameData.slug, subdomain: gameData.subdomain, recordType: gameData.recordType, tagline: gameData.tagline, shortDescription: gameData.shortDescription, longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus, operationalStatus: gameData.operationalStatus, releaseYear: gameData.releaseYear, themePreset: gameData.themePreset, themeConfig: JSON.stringify(gameData.theme), featureConfig: JSON.stringify(gameData.features), logoUrl: gameData.logoUrl, iconUrl: gameData.iconUrl, coverUrl: gameData.coverUrl, heroDesktopUrl: gameData.heroDesktopUrl, heroMobileUrl: gameData.heroMobileUrl, featured: gameData.featured, primaryGame: gameData.primaryGame, isPublic: gameData.isPublic, sortOrder: gameData.sortOrder,
        primaryCtaLabel: gameData.primaryCtaLabel, primaryCtaPath: gameData.primaryCtaPath, secondaryCtaLabel: gameData.secondaryCtaLabel, secondaryCtaPath: gameData.secondaryCtaPath,
      },
      create: {
        code: gameData.code, name: gameData.name, slug: gameData.slug, subdomain: gameData.subdomain, recordType: gameData.recordType, tagline: gameData.tagline, shortDescription: gameData.shortDescription, longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus, operationalStatus: gameData.operationalStatus, releaseYear: gameData.releaseYear, themePreset: gameData.themePreset, themeConfig: JSON.stringify(gameData.theme), featureConfig: JSON.stringify(gameData.features), logoUrl: gameData.logoUrl, iconUrl: gameData.iconUrl, coverUrl: gameData.coverUrl, heroDesktopUrl: gameData.heroDesktopUrl, heroMobileUrl: gameData.heroMobileUrl, featured: gameData.featured, primaryGame: gameData.primaryGame, isPublic: gameData.isPublic, sortOrder: gameData.sortOrder,
        primaryCtaLabel: gameData.primaryCtaLabel, primaryCtaPath: gameData.primaryCtaPath, secondaryCtaLabel: gameData.secondaryCtaLabel, secondaryCtaPath: gameData.secondaryCtaPath,
      },
    });
    await prisma.gameGenre.deleteMany({ where: { gameId: game.id } });
    await prisma.gamePlatform.deleteMany({ where: { gameId: game.id } });
    await prisma.gameArticle.deleteMany({ where: { gameId: game.id } });
    await prisma.gameMilestone.deleteMany({ where: { gameId: game.id } });
    await prisma.gameGenre.createMany({ data: gameData.genres.map((code) => ({ gameId: game.id, genreId: genreIds.get(code)! })) });
    await prisma.gamePlatform.createMany({ data: gameData.platforms.map((platform) => ({ gameId: game.id, platform })) });
    if (gameData.articles.length) await prisma.gameArticle.createMany({ data: gameData.articles.map((article) => ({ gameId: game.id, ...article, status: 'PUBLISHED', seoTitle: article.title, seoDescription: article.excerpt })) });
    if (gameData.milestones.length) await prisma.gameMilestone.createMany({ data: gameData.milestones.map(([title, description, displayPeriod, status, checklist], sortOrder) => ({ gameId: game.id, title, description, displayPeriod, status, checklistConfig: JSON.stringify(checklist), sortOrder })) });
  }
}

async function seedPortalContent() {
  const announcements = [
    {
      code: 'SEASON6_LDDM_2026',
      title: 'Bốn thế giới đang hoạt động',
      message: 'Khám phá bốn game đang hoạt động, theo dõi mùa mới và nhận tin vận hành từ ZENX GO.',
      ctaLabel: 'Khám phá game',
      ctaPath: '/events/season-6-luc-dia-dam-me',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      sortOrder: 1,
    },
    {
      code: 'DEV_TALK_01_2026',
      title: 'Sự kiện cuối tuần ZENX GO',
      message: 'Chuỗi hoạt động cuối tuần sắp diễn ra với phần thưởng mùa và nhiệm vụ cộng đồng từ các game.',
      ctaLabel: 'Xem sự kiện',
      ctaPath: '/events/dev-talk-01-zenx-go',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-15T00:00:00.000Z'),
      endsAt: new Date('2026-10-15T23:59:59.000Z'),
      sortOrder: 2,
    },
    {
      code: 'GAME_HUB_LAUNCH_2026',
      title: 'Tuần lễ ra mắt Game Hub đã khép lại',
      message: 'Cảm ơn cộng đồng đã đồng hành trong tuần lễ ra mắt. Bốn game ZENX GO tiếp tục cập nhật nội dung mỗi tuần.',
      ctaLabel: 'Xem tin mới',
      ctaPath: '/games',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-31T23:59:59.000Z'),
      sortOrder: 3,
    },
  ] as const;
  for (const announcement of announcements) {
    await prisma.portalAnnouncement.upsert({ where: { code: announcement.code }, update: announcement, create: announcement });
  }

  const gameRows = await prisma.game.findMany({ where: { slug: { in: ['luc-dia-dam-me', 'vuong-trieu-hoa-long', 'thi-tran-may', 'chien-tuyen-orion'] } }, select: { id: true, slug: true } });
  const gameIds = new Map(gameRows.map((game) => [game.slug, game.id]));
  // Keep the natural date windows idempotent when upgrading from the previous seed set.
  await prisma.portalAnnouncement.deleteMany({ where: { startsAt: new Date('2026-09-01T00:00:00.000Z'), title: { not: 'Bốn thế giới đang hoạt động' } } });
  await prisma.gameEvent.deleteMany({ where: { OR: [
    { gameId: gameIds.get('luc-dia-dam-me') ?? '', startsAt: new Date('2026-09-01T00:00:00.000Z'), title: { not: 'Season 6 Lục Địa Đam Mê' } },
    { gameId: gameIds.get('thi-tran-may') ?? '', startsAt: new Date('2026-09-01T00:00:00.000Z'), title: { not: 'Lễ hội Khinh khí cầu Thị Trấn Mây' } },
  ] } });
  const events = [
    {
      title: 'Season 6 Lục Địa Đam Mê',
      slug: 'season-6-luc-dia-dam-me',
      excerpt: 'Season 6 đang mở với nhiệm vụ bang hội, phần thưởng tân thủ và chuỗi hoạt động cộng đồng.',
      content: '# Season 6 Lục Địa Đam Mê\n\nSeason 6 đã mở cửa trên toàn Lục Địa với nhiệm vụ bang hội, công thành chiến và phần thưởng theo mùa.\n\nNgười chơi mới bắt đầu từ cổng thành, nhận bộ quà tân thủ và tham gia chuỗi hoạt động cộng đồng ngay trong tuần đầu.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng mùa hiện tại\n- Nhiệm vụ cộng đồng theo tuần',
      coverImageUrl: '/images/games/luc-dia-dam-me/hero.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Season 6 Lục Địa Đam Mê | ZENX GO',
      seoDescription: 'Theo dõi hoạt động Season 6, phần thưởng và nhiệm vụ cộng đồng của Lục Địa Đam Mê.',
      gameId: gameIds.get('luc-dia-dam-me') ?? null,
    },
    {
      title: 'Tuần lễ ra mắt ZENX GO',
      slug: 'zenx-go-game-hub-chinh-thuc-mo-cua',
      excerpt: 'Tuần lễ ra mắt kết nối cộng đồng với bốn thế giới game, lịch sự kiện và các tiện ích tài khoản ZENX GO.',
      content: '# Tuần lễ ra mắt ZENX GO\n\nGame Hub là điểm đến chung để khám phá bốn game đang hoạt động, theo dõi tin tức và quản lý tài khoản trên mọi thế giới.\n\nTrong tuần lễ ra mắt, cộng đồng đã cùng mở khóa các mốc tương tác và nhận lịch hoạt động mùa mới.\n\nHãy ghé trang Sự kiện để xem những hoạt động đang diễn ra trong tháng.',
      coverImageUrl: '/images/image.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-24T00:00:00.000Z'),
      endsAt: null,
      publishedAt: new Date('2026-08-24T00:00:00.000Z'),
      seoTitle: 'ZENX GO Game Hub',
      seoDescription: 'Khám phá hệ sinh thái game ZENX GO.',
      gameId: null,
    },
    {
      title: 'Lễ hội Khinh khí cầu Thị Trấn Mây',
      slug: 'le-hoi-khinh-khi-cau-thi-tran-may',
      excerpt: 'Lên khinh khí cầu, ghé thăm hàng xóm và đổi quà trang trí trong lễ hội cuối tuần trên các đảo mây.',
      content: '# Lễ hội Khinh khí cầu Thị Trấn Mây\n\nLễ hội đưa cư dân lên những chuyến khinh khí cầu nối liền quảng trường, khu vườn và các đảo hàng xóm.\n\nHoàn thành nhiệm vụ ghé thăm, chụp ảnh và trao đổi nông sản để nhận huy hiệu lễ hội cùng vật phẩm trang trí.\n\n- Tuyến bay lễ hội\n- Huy hiệu ghé thăm\n- Quà trang trí giới hạn',
      coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-07T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Lễ hội Khinh khí cầu Thị Trấn Mây',
      seoDescription: 'Tham gia lễ hội Khinh khí cầu và nhận quà trang trí tại Thị Trấn Mây.',
      gameId: gameIds.get('thi-tran-may') ?? null,
    },
    {
      title: 'Bản tin vận hành tháng 9',
      slug: 'dev-talk-01-zenx-go',
      excerpt: 'Cập nhật lịch mùa, cân bằng hệ thống và hoạt động cộng đồng của bốn game trong tháng 9.',
      content: '# Bản tin vận hành tháng 9\n\nZENX GO công bố lịch vận hành tháng 9 với Season 6 Lục Địa Đam Mê, Mùa Liên Minh Hỏa Long, Lễ hội Khinh khí cầu và Ranked Season 1 Orion.\n\nBuổi phát sóng sẽ điểm qua các thay đổi cân bằng, lịch bảo trì và phần thưởng cộng đồng.\n\nBạn có thể gửi câu hỏi trước để đội ngũ trả lời trực tiếp trong sự kiện.',
      coverImageUrl: '/images/image.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-15T00:00:00.000Z'),
      endsAt: new Date('2026-09-16T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Bản tin vận hành tháng 9 | ZENX GO',
      seoDescription: 'Lịch vận hành và cập nhật mùa tháng 9 của hệ sinh thái ZENX GO.',
      gameId: null,
    },
    {
      title: 'Mùa Liên Minh Hỏa Long',
      slug: 'khai-hoa-lien-minh-hoa-long',
      excerpt: 'Các vương triều tranh quyền trên bản đồ liên vùng với mục tiêu liên minh, tiếp tế và phòng thủ Hoàng Thành.',
      content: '# Mùa Liên Minh Hỏa Long\n\nCác vương triều sẽ hội quân trên bản đồ liên vùng, phối hợp tuyến tiếp tế và bảo vệ Hoàng Thành qua từng vòng giao tranh.\n\nLong Thần hệ Hỏa mở thêm lựa chọn chiến thuật cho đội hình, còn phần thưởng mùa được tính theo đóng góp của từng thành viên.\n\nHãy lập liên minh sớm và theo dõi lịch chiến trường trong trang game.',
      coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-20T00:00:00.000Z'),
      endsAt: new Date('2026-10-05T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Mùa Liên Minh Hỏa Long',
      seoDescription: 'Tham gia Mùa Liên Minh và chiến đấu cùng Long Thần hệ Hỏa tại Vương Triều Hỏa Long.',
      gameId: gameIds.get('vuong-trieu-hoa-long') ?? null,
    },
    {
      title: 'Ranked Season 1: Vành đai Orion',
      slug: 'orion-training-simulation',
      excerpt: 'Ranked Season 1 mở bảng xếp hạng theo mùa và những mục tiêu xoay vòng cho các biệt đội Orion.',
      content: '# Ranked Season 1: Vành đai Orion\n\nRanked Season 1 đưa các biệt đội vào Vành đai Orion với mục tiêu xoay vòng và bảng xếp hạng cập nhật theo tuần.\n\nRecon, Assault và Support cần phối hợp nhịp di chuyển, tầm nhìn và năng lượng để kiểm soát từng khu vực.\n\nPhần thưởng mùa được trao theo bậc xếp hạng và thành tích đội hình.',
      coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-10-05T00:00:00.000Z'),
      endsAt: new Date('2026-10-20T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Ranked Season 1: Vành đai Orion',
      seoDescription: 'Theo dõi lịch Ranked Season 1 và phần thưởng mùa của Chiến Tuyến Orion.',
      gameId: gameIds.get('chien-tuyen-orion') ?? null,
    },
    {
      title: 'Tuần lễ cộng đồng Season 6',
      slug: 'khao-sat-cong-dong-season-6',
      excerpt: 'Tuần lễ cộng đồng đã khép lại với hàng nghìn phản hồi về hoạt động bang hội và bản đồ liên vùng.',
      content: '# Tuần lễ cộng đồng Season 6\n\nCảm ơn cộng đồng đã chia sẻ phản hồi về hoạt động bang hội, công thành chiến và những tuyến đường muốn mở trong Season 6.\n\nĐội ngũ đã tổng hợp kết quả và đưa các ưu tiên phù hợp vào lịch vận hành những tuần tiếp theo.\n\nCác mốc cập nhật sẽ tiếp tục được thông báo trên trang tin Lục Địa Đam Mê.',
      coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-10T23:59:59.000Z'),
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      seoTitle: 'Tuần lễ cộng đồng Season 6',
      seoDescription: 'Tổng kết hoạt động cộng đồng Season 6 của Lục Địa Đam Mê.',
      gameId: null,
    },
    {
      title: 'Lễ hội Mây mùa hè',
      slug: 'cloud-town-sketchbook',
      excerpt: 'Lễ hội Mây mùa hè đã khép lại sau ba tuần hoạt động cộng đồng, thăm đảo và sưu tầm vật phẩm.',
      content: '# Lễ hội Mây mùa hè\n\nLễ hội Mây mùa hè đã khép lại với các chuyến thăm đảo, hoạt động chụp ảnh và bộ sưu tập vật phẩm trang trí.\n\nNhững phần thưởng đã nhận vẫn được giữ trong kho của cư dân, còn các kỷ niệm nổi bật được lưu tại Quảng trường Mây.\n\nCảm ơn mọi người đã cùng tạo nên một mùa hè nhiều màu sắc trên những tầng mây.',
      coverImageUrl: '/images/games/thi-tran-may/detail-v1/garden.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-05T00:00:00.000Z'),
      endsAt: new Date('2026-08-20T23:59:59.000Z'),
      publishedAt: new Date('2026-08-05T00:00:00.000Z'),
      seoTitle: 'Lễ hội Mây mùa hè',
      seoDescription: 'Tổng kết Lễ hội Mây mùa hè tại Thị Trấn Mây.',
      gameId: gameIds.get('thi-tran-may') ?? null,
    },
  ] as const;

  for (const event of events) {
    await prisma.gameEvent.upsert({ where: { slug: event.slug }, update: event, create: event });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
