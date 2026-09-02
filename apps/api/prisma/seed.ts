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
  const publishDemos = process.env.GAME_DEMO_PUBLIC === undefined
    ? process.env.NODE_ENV !== 'production'
    : process.env.GAME_DEMO_PUBLIC === 'true';
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
      tagline: 'Một thế giới đang được xây dựng lại.',
      shortDescription: 'Thế giới MU cổ điển được làm mới, nơi những hoài niệm tuổi thơ được chắp cánh thành niềm đam mê thực sự.',
      longDescription: 'Lục Địa Đam Mê là một thế giới MMORPG fantasy đa nền tảng đang được xây dựng lại cho thế hệ người chơi mới.',
      lifecycleStatus: 'IN_DEVELOPMENT', operationalStatus: 'AVAILABLE', releaseYear: 2027,
      themePreset: 'EDITORIAL_FANTASY', featured: true, primaryGame: true, isPublic: true, sortOrder: 1,
      genres: ['MMORPG', 'FANTASY', 'ADVENTURE'], platforms: ['PC', 'MOBILE', 'WEB'],
      heroDesktopUrl: '/images/games/luc-dia-dam-me/hero.png', heroMobileUrl: '/images/games/luc-dia-dam-me/hero.png',
      coverUrl: '/images/games/luc-dia-dam-me/nhan_vat3.png', iconUrl: '/images/games/luc-dia-dam-me/logo.png', logoUrl: '/images/games/luc-dia-dam-me/logo.png',
      primaryCtaLabel: 'Khám phá dự án', primaryCtaPath: '/gioi-thieu', secondaryCtaLabel: 'Xem roadmap', secondaryCtaPath: '/roadmap',
      theme: { primary: '#54796f', secondary: '#778fa0', surface: '#edf2f3', text: '#203236', heading: 'serif', body: 'sans-serif', radius: 'medium', motion: 'subtle' },
      features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'PLATFORM_CARDS', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'DEVELOPMENT_PROGRESS', 'MEDIA_GALLERY', 'COMMUNITY_CTA'], routes: ['ABOUT', 'NEWS', 'ROADMAP', 'DOWNLOAD'], downloads: 'COMING_SOON', servers: false, leaderboard: false, giftcode: false, gameTopup: false },
      articles: [
        { title: 'Không gian gameplay là ưu tiên', slug: 'khong-gian-gameplay-la-uu-tien', excerpt: 'Mỗi khung hình của Lục Địa Đam Mê được xây dựng để thế giới và nhân vật luôn là tâm điểm.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/hero.png', content: '# Không gian gameplay là ưu tiên\n\nChúng tôi đang tập trung vào cảm giác khám phá và khả năng đọc thế giới trong từng khung hình.\n\n- Giữ nhân vật ở trung tâm trải nghiệm\n- Làm rõ không gian chiến đấu\n- Tối ưu trải nghiệm trên PC, Mobile và Web', publishedAt: new Date('2026-09-01T08:00:00Z') },
        { title: 'Alpha Test: Mở đăng ký sớm', slug: 'alpha-test-mo-dang-ky-som', excerpt: 'Cánh cửa đầu tiên để cộng đồng đồng hành cùng Lục Địa Đam Mê đã chính thức mở.', category: 'EVENT', coverImageUrl: '/images/games/luc-dia-dam-me/hero2.png', content: '# Alpha Test: Mở đăng ký sớm\n\nAlpha Test là cột mốc đầu tiên để chúng tôi kiểm tra cảm giác khám phá, chiến đấu và kết nối trong Lục Địa Đam Mê.\n\nĐăng ký sớm giúp bạn nhận lịch thử nghiệm và theo dõi các hướng dẫn chuẩn bị trước ngày mở cửa.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng phiên bản Alpha\n- Quyền tham gia nhóm cộng đồng thử nghiệm', publishedAt: new Date('2026-09-01T22:00:00Z') },
        { title: 'World Remake', slug: 'world-remake', excerpt: 'Lộ trình đại tu môi trường mở và kiến trúc thành trì giữa mây.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/bg.png', content: '# World Remake\n\nLục địa đang được dựng lại từ nền móng, với ánh sáng, địa hình và các khu vực khám phá mới.', publishedAt: new Date('2026-08-28T08:00:00Z') },
        { title: 'Character Update', slug: 'character-update', excerpt: 'Hướng tiếp cận mới cho tạo hình và hành trình của nhân vật.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat3.png', content: '# Character Update\n\nNhân vật được thiết kế để vừa giữ lại ký ức MU Classic vừa có diện mạo hiện đại hơn.', publishedAt: new Date('2026-08-25T08:00:00Z') },
        { title: 'Cánh và thần thú: Di chuyển có ý nghĩa', slug: 'canh-va-than-thu-di-chuyen-co-y-nghia', excerpt: 'Thiết kế hệ thống cánh và thần thú để mỗi chuyến bay đều trở thành một phần của hành trình.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/hero3.png', content: '# Cánh và thần thú: Di chuyển có ý nghĩa\n\nBay lượn không chỉ là một hiệu ứng đẹp mắt. Hệ thống cánh và thần thú được thiết kế để mở ra các tuyến khám phá, điểm nhìn và cách tiếp cận chiến trường mới.\n\nChúng tôi đang thử nghiệm nhịp di chuyển trên cả PC, Mobile và Web để cảm giác điều khiển luôn tự nhiên.\n\n- Tuyến bay giữa các thành trì\n- Thần thú hỗ trợ khám phá\n- Phần thưởng gắn với hành trình', publishedAt: new Date('2026-08-22T08:00:00Z') },
        { title: 'Lộ trình thử nghiệm cộng đồng', slug: 'lo-trinh-thu-nghiem-cong-dong', excerpt: 'Những điều đội ngũ đang chuẩn bị trước khi mở rộng bản thử nghiệm đến cộng đồng.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/luc-dia-dam-me/bg2.png', content: '# Lộ trình thử nghiệm cộng đồng\n\nSau giai đoạn test nội bộ, đội ngũ sẽ tập trung đo lường khả năng đọc giao diện, độ ổn định và nhịp chơi trong các tình huống đông người.\n\nCác nhóm người chơi đầu tiên sẽ nhận được hướng dẫn cụ thể trước khi bản build được mở rộng.\n\nMọi mốc thời gian có thể thay đổi theo kết quả kiểm thử thực tế.', publishedAt: new Date('2026-08-20T08:00:00Z') },
        { title: 'Hoàn tất bảo trì thư viện hình ảnh', slug: 'hoan-tat-bao-tri-thu-vien-hinh-anh', excerpt: 'Thông tin về đợt bảo trì ngắn để đồng bộ asset và tối ưu tốc độ tải trang game.', category: 'MAINTENANCE', coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat2.png', content: '# Hoàn tất bảo trì thư viện hình ảnh\n\nĐợt bảo trì đã hoàn tất. Các asset hero, thumbnail và hình ảnh bài viết đã được đồng bộ để cải thiện tốc độ tải trên các kích thước màn hình khác nhau.\n\nKhông có dữ liệu tài khoản hoặc tiến độ người chơi nào bị ảnh hưởng trong đợt cập nhật này.', publishedAt: new Date('2026-08-18T08:00:00Z') },
      ],
      milestones: [
        ['Foundation / Lên ý tưởng', 'Khởi tạo định hướng và nền tảng dự án.', 'Q2/2026', 'COMPLETED', ['Định hình tầm nhìn', 'Chốt nền tảng kỹ thuật']],
        ['Dựng lại Lục địa / World Remake', 'Đại tu thế giới và môi trường mở.', '08/2026', 'IN_PROGRESS', ['Thiết kế môi trường', 'Xây dựng thành trì']],
        ['UI/UX 2.0', 'Hoàn thiện trải nghiệm người chơi đa nền tảng.', '09/2026', 'IN_PROGRESS', ['Thiết kế giao diện', 'Kiểm tra responsive']],
        ['Test nội bộ', 'Đánh giá bản build đầu tiên.', '10/2026', 'UPCOMING', ['Chuẩn bị build test']],
        ['Test cộng đồng', 'Mở rộng thử nghiệm với cộng đồng.', '11/2026', 'PLANNED', ['Chuẩn bị chương trình test']],
        ['Chuẩn bị ra mắt', 'Hoàn thiện các hạng mục trước phát hành.', '12/2026', 'PLANNED', ['Chốt nội dung ra mắt']],
        ['Chính thức ra mắt', 'Mở cửa thế giới Lục Địa Đam Mê.', '2027', 'PLANNED', ['Công bố ngày ra mắt']],
      ],
    },
    {
      code: 'VTHL', name: 'Vương Triều Hỏa Long', slug: 'vuong-trieu-hoa-long', subdomain: 'hoalong', recordType: 'DEMO',
      tagline: 'Xây dựng vương triều, thống lĩnh chiến trường.', shortDescription: 'Concept chiến thuật mô phỏng về vương quyền và ngọn lửa rồng thiêng.', longDescription: null,
      lifecycleStatus: 'COMING_SOON', operationalStatus: 'AVAILABLE', releaseYear: null, themePreset: 'DARK_STRATEGY', featured: false, primaryGame: false, isPublic: publishDemos, sortOrder: 2,
      genres: ['STRATEGY', 'SLG'], platforms: ['MOBILE', 'WEB'], heroDesktopUrl: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp', heroMobileUrl: '/images/games/vuong-trieu-hoa-long/hero-mobile.webp', coverUrl: '/images/games/vuong-trieu-hoa-long/key-art.png', iconUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp', logoUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp',
      primaryCtaLabel: 'Tìm hiểu dự án', primaryCtaPath: '/gioi-thieu', secondaryCtaLabel: null, secondaryCtaPath: null,
      theme: { primary: '#9b4938', secondary: '#c89254', surface: '#1e1b1c', text: '#fff4df', heading: 'display-serif', body: 'sans-serif', radius: 'small', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['NEWS'], demo: true }, articles: [
        { title: 'Long Thần thức tỉnh', slug: 'long-than-thuc-tinh', excerpt: 'Nhật ký thiết kế về những con rồng đầu tiên và vai trò của chúng trong chiến trường.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/dragon.webp', content: '# Long Thần thức tỉnh\n\nNhững con rồng đầu tiên của Vương Triều Hỏa Long đang được tạo hình như các thực thể có lịch sử và cá tính riêng.\n\nNgười chơi sẽ phải cân bằng giữa việc thuần hóa, nâng cấp và sử dụng sức mạnh rồng trong những thời điểm quyết định.\n\n- Rồng tấn công và phòng thủ\n- Kỹ năng theo nguyên tố\n- Liên kết với công trình vương triều', publishedAt: new Date('2026-09-01T21:00:00Z') },
        { title: 'Pháo đài và chiến tuyến', slug: 'phao-dai-va-chien-tuyen', excerpt: 'Cách bố trí pháo đài, cổng thành và địa hình tạo nên những quyết định chiến thuật khác nhau.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/fortress.webp', content: '# Pháo đài và chiến tuyến\n\nBản đồ chiến thuật được xây dựng xoay quanh các điểm nghẽn, tuyến tiếp tế và vị trí phòng thủ có thể thay đổi theo từng trận.\n\nMỗi công trình cần phục vụ một mục tiêu rõ ràng thay vì chỉ là lớp trang trí trên bản đồ.\n\nChúng tôi đang thử nghiệm nhiều mật độ quân để giữ cho trận đấu dễ đọc nhưng vẫn đủ chiều sâu.', publishedAt: new Date('2026-08-27T08:00:00Z') },
        { title: 'Nhật ký liên minh đầu tiên', slug: 'nhat-ky-lien-minh-dau-tien', excerpt: 'Concept liên minh bang hội và cách người chơi cùng chia sẻ mục tiêu trên bản đồ.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp', content: '# Nhật ký liên minh đầu tiên\n\nLiên minh là lớp chơi giúp các vương triều nhỏ có thể phối hợp để chống lại thế lực lớn hơn.\n\nĐội ngũ đang thiết kế các mục tiêu theo mùa để mỗi thành viên đều có vai trò trong việc mở rộng lãnh thổ.\n\nThông tin về bản thử nghiệm sẽ được công bố khi hệ thống chiến trường ổn định.', publishedAt: new Date('2026-08-18T08:00:00Z') },
      ], milestones: [],
    },
    {
      code: 'TTM', name: 'Thị Trấn Mây', slug: 'thi-tran-may', subdomain: 'thitranmay', recordType: 'DEMO',
      tagline: 'Xây một góc nhỏ trên những tầng mây.', shortDescription: 'Concept casual mô phỏng về một thị trấn bình yên giữa tầng mây.', longDescription: null,
      lifecycleStatus: 'CONCEPT', operationalStatus: 'AVAILABLE', releaseYear: null, themePreset: 'PLAYFUL_CASUAL', featured: false, primaryGame: false, isPublic: publishDemos, sortOrder: 3,
      genres: ['CASUAL', 'SIMULATION'], platforms: ['MOBILE', 'WEB'], heroDesktopUrl: '/images/games/thi-tran-may/hero-desktop.webp', heroMobileUrl: '/images/games/thi-tran-may/hero-mobile.webp', coverUrl: '/images/games/thi-tran-may/key-art.png', iconUrl: '/images/games/thi-tran-may/avatar.webp', logoUrl: '/images/games/thi-tran-may/avatar.webp',
      primaryCtaLabel: 'Khám phá concept', primaryCtaPath: '/', secondaryCtaLabel: null, secondaryCtaPath: null,
      theme: { primary: '#69bce8', secondary: '#f6c958', surface: '#fffdf7', text: '#193b5a', heading: 'rounded-sans', body: 'sans-serif', radius: 'large', motion: 'playful' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['NEWS'], demo: true }, articles: [
        { title: 'Một ngày ở Quảng trường Mây', slug: 'mot-ngay-o-quang-truong-may', excerpt: 'Khám phá nhịp sống nhẹ nhàng và những hoạt động cộng đồng đầu tiên trong thị trấn.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp', content: '# Một ngày ở Quảng trường Mây\n\nQuảng trường là nơi người chơi gặp nhau, trao đổi vật phẩm và bắt đầu các hoạt động theo mùa.\n\nThiết kế ưu tiên những khoảnh khắc ngắn nhưng có thể lặp lại mỗi ngày, từ chăm sóc cửa hàng đến ghé thăm hàng xóm.\n\n- Chợ cuối tuần\n- Lễ hội ánh sáng\n- Góc chụp ảnh cộng đồng', publishedAt: new Date('2026-09-01T12:00:00Z') },
        { title: 'Khu vườn nổi và mùa vụ', slug: 'khu-vuon-noi-va-mua-vu', excerpt: 'Cách hệ thống vườn và mùa vụ tạo ra cảm giác tiến triển thư giãn trên từng hòn đảo.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/thi-tran-may/detail-v1/garden.webp', content: '# Khu vườn nổi và mùa vụ\n\nMỗi hòn đảo có thể được sắp xếp thành một khu vườn mang cá tính riêng.\n\nMùa vụ thay đổi màu sắc, vật liệu và loại cây có thể trồng, tạo ra lý do để người chơi quay lại mà không bị áp lực cạnh tranh.\n\nChúng tôi đang cân bằng tốc độ thu hoạch để trải nghiệm phù hợp với những phiên chơi ngắn trên mobile.', publishedAt: new Date('2026-08-26T08:00:00Z') },
        { title: 'Khinh khí cầu kết nối các đảo', slug: 'khinh-khi-cau-ket-noi-cac-dao', excerpt: 'Nhật ký concept về tuyến giao thông trên không và những chuyến thăm bạn bè.', category: 'EVENT', coverImageUrl: '/images/games/thi-tran-may/detail-v1/airships.webp', content: '# Khinh khí cầu kết nối các đảo\n\nKhinh khí cầu là cách người chơi di chuyển giữa các đảo và mở khóa những điểm nhìn mới trên bầu trời.\n\nCác chuyến thăm bạn bè sẽ có hoạt động nhỏ, phần quà trang trí và cơ hội trao đổi nguyên liệu.\n\nĐây là một trong những hệ thống sẽ được thử nghiệm sau khi bản concept được hoàn thiện.', publishedAt: new Date('2026-08-17T08:00:00Z') },
      ], milestones: [],
    },
    {
      code: 'CTO', name: 'Chiến Tuyến Orion', slug: 'chien-tuyen-orion', subdomain: 'orion', recordType: 'DEMO',
      tagline: 'Biệt đội tinh nhuệ bảo vệ thuộc địa không gian.', shortDescription: 'Concept tactical shooter khoa học viễn tưởng về biệt đội Orion và những chiến tuyến ngoài không gian.', longDescription: null,
      lifecycleStatus: 'CONCEPT', operationalStatus: 'AVAILABLE', releaseYear: null, themePreset: 'SCI_FI_SHOOTER', featured: false, primaryGame: false, isPublic: publishDemos, sortOrder: 4,
      genres: ['SHOOTER'], platforms: ['PC', 'MOBILE'], heroDesktopUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp', heroMobileUrl: '/images/games/chien-tuyen-orion/hero-mobile.webp', coverUrl: '/images/games/chien-tuyen-orion/key-art.png', iconUrl: '/images/games/chien-tuyen-orion/avatar.webp', logoUrl: '/images/games/chien-tuyen-orion/avatar.webp',
      primaryCtaLabel: 'Khám phá concept', primaryCtaPath: '/', secondaryCtaLabel: null, secondaryCtaPath: null,
      theme: { primary: '#6c8cff', secondary: '#57d7ff', surface: '#0b1224', text: '#e8f0ff', heading: 'display-sans', body: 'sans-serif', radius: 'medium', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ARTICLE_GRID', 'COMMUNITY_CTA'], routes: ['NEWS'], demo: true }, articles: [
        { title: 'Báo cáo chiến tuyến Vành đai Orion', slug: 'bao-cao-chien-tuyen-vanh-dai-orion', excerpt: 'Bản cập nhật về không gian chiến đấu và cách biệt đội Orion phối hợp trong địa hình mới.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/battlefield-panorama.webp', content: '# Báo cáo chiến tuyến Vành đai Orion\n\nVành đai Orion là khu vực đầu tiên được xây dựng để kiểm tra nhịp di chuyển, tầm nhìn và khả năng phối hợp của biệt đội.\n\nCác tuyến đường có nhiều độ cao và vật cản để mỗi vai trò đều có cơ hội tạo ảnh hưởng.\n\n- Điểm quan sát ngoài trời\n- Khu vực trú ẩn\n- Mục tiêu thay đổi theo trận', publishedAt: new Date('2026-09-01T23:00:00Z') },
        { title: 'Ba vai trò cho một biệt đội', slug: 'ba-vai-tro-cho-mot-biet-doi', excerpt: 'Recon, Assault và Support được thiết kế để bổ trợ nhau thay vì cạnh tranh cùng một vị trí.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp', content: '# Ba vai trò cho một biệt đội\n\nMỗi đặc vụ Orion cần có một nhiệm vụ rõ ràng trong đội hình.\n\nRecon mở thông tin, Assault tạo áp lực ở tuyến đầu còn Support duy trì khả năng chiến đấu cho cả đội.\n\nChúng tôi đang thử nghiệm kỹ năng và trang bị để không có vai trò nào trở thành lựa chọn bắt buộc.', publishedAt: new Date('2026-08-29T08:00:00Z') },
        { title: 'Kho trang bị năng lượng', slug: 'kho-trang-bi-nang-luong', excerpt: 'Nhật ký thiết kế những thiết bị đầu tiên giúp đặc vụ thích ứng với thuộc địa ngoài thiên hà.', category: 'ANNOUNCEMENT', coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/equipment-strip.webp', content: '# Kho trang bị năng lượng\n\nThiết bị năng lượng được thiết kế để thay đổi cách đặc vụ tiếp cận một khu vực, không chỉ tăng chỉ số sát thương.\n\nTừ giáp phản lực đến thiết bị tạo lá chắn, mỗi món đồ sẽ mở ra một lựa chọn chiến thuật khác nhau.\n\nDanh sách trang bị sẽ được cập nhật cùng các mốc phát triển tiếp theo.', publishedAt: new Date('2026-08-21T08:00:00Z') },
      ], milestones: [],
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
      code: 'ALPHA_TEST_LDDM_2026',
      title: 'Sự kiện Alpha Test',
      message: 'Đăng ký sớm Lục Địa Đam Mê để nhận 1,000 ZENX Coin & Cánh Ánh Sáng!',
      ctaLabel: 'Tham gia ngay',
      ctaPath: '/events/alpha-test-luc-dia-dam-me',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      sortOrder: 1,
    },
    {
      code: 'DEV_TALK_01_2026',
      title: 'Dev Talk #01',
      message: 'Đón xem buổi trò chuyện đầu tiên về những thế giới đang được xây dựng.',
      ctaLabel: 'Xem lịch sự kiện',
      ctaPath: '/events/dev-talk-01-zenx-go',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-15T00:00:00.000Z'),
      endsAt: new Date('2026-10-15T23:59:59.000Z'),
      sortOrder: 2,
    },
    {
      code: 'GAME_HUB_LAUNCH_2026',
      title: 'ZENX GO Game Hub',
      message: 'Game Hub đã mở cửa với những dự án đầu tiên trong hệ sinh thái.',
      ctaLabel: 'Khám phá Game Hub',
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
  const events = [
    {
      title: 'Alpha Test Lục Địa Đam Mê',
      slug: 'alpha-test-luc-dia-dam-me',
      excerpt: 'Đăng ký sớm để đồng hành cùng bản thử nghiệm đầu tiên và nhận quà tân thủ.',
      content: '# Alpha Test Lục Địa Đam Mê\n\nĐăng ký sớm để nhận thông tin lịch thử nghiệm, phần thưởng và các cập nhật đầu tiên từ đội ngũ phát triển.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng phiên bản Alpha\n- Quyền tham gia nhóm cộng đồng thử nghiệm',
      coverImageUrl: '/images/games/luc-dia-dam-me/hero.png',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Alpha Test Lục Địa Đam Mê | ZENX GO',
      seoDescription: 'Đăng ký sớm Alpha Test Lục Địa Đam Mê và nhận phần thưởng tân thủ.',
      gameId: gameIds.get('luc-dia-dam-me') ?? null,
    },
    {
      title: 'ZENX GO Game Hub chính thức mở cửa',
      slug: 'zenx-go-game-hub-chinh-thuc-mo-cua',
      excerpt: 'Khám phá các thế giới game, theo dõi roadmap và quản lý tài khoản trong một hệ sinh thái duy nhất.',
      content: '# Chào mừng đến với ZENX GO\n\nGame Hub là điểm đến chung để bạn khám phá các dự án game, theo dõi tin tức và sử dụng tài khoản ZENX GO trên mọi thế giới.',
      coverImageUrl: '/images/image.png',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-24T00:00:00.000Z'),
      endsAt: null,
      publishedAt: new Date('2026-08-24T00:00:00.000Z'),
      seoTitle: 'ZENX GO Game Hub',
      seoDescription: 'Khám phá hệ sinh thái game ZENX GO.',
      gameId: null,
    },
    {
      title: 'Cuối tuần Concept: Thị Trấn Mây',
      slug: 'cuoi-tuan-concept-thi-tran-may',
      excerpt: 'Ghé thăm những bản phác thảo đầu tiên và chia sẻ góc phố bạn muốn nhìn thấy trên mây.',
      content: '# Cuối tuần Concept: Thị Trấn Mây\n\nCộng đồng có thể ghé qua khu trưng bày concept, xem các bản phác thảo và bình chọn cho góc phố yêu thích.\n\nHoạt động này là dịp để đội ngũ thu thập phản hồi trước khi chốt hướng nghệ thuật cho thị trấn.\n\n- Bình chọn quảng trường\n- Chọn màu cho mùa lễ hội\n- Gợi ý vật phẩm trang trí',
      coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-07T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Cuối tuần Concept: Thị Trấn Mây',
      seoDescription: 'Tham gia hoạt động concept của Thị Trấn Mây.',
      gameId: gameIds.get('thi-tran-may') ?? null,
    },
    {
      title: 'Dev Talk #01: Xây lại một thế giới',
      slug: 'dev-talk-01-zenx-go',
      excerpt: 'Buổi trò chuyện đầu tiên về tầm nhìn, công nghệ và các quyết định thiết kế của ZENX GO.',
      content: '# Dev Talk #01: Xây lại một thế giới\n\nĐội ngũ ZENX GO sẽ chia sẻ cách các dự án được hình thành, từ ý tưởng đầu tiên đến những bản prototype có thể chơi được.\n\nNgười xem có thể gửi câu hỏi trước để đội ngũ trả lời trong buổi trò chuyện.\n\nLịch phát sóng và link tham dự sẽ được cập nhật trước ngày diễn ra.',
      coverImageUrl: '/images/image.png',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-15T00:00:00.000Z'),
      endsAt: new Date('2026-09-16T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Dev Talk #01 | ZENX GO',
      seoDescription: 'Buổi trò chuyện đầu tiên về các dự án ZENX GO.',
      gameId: null,
    },
    {
      title: 'Khải hỏa liên minh Hỏa Long',
      slug: 'khai-hoa-lien-minh-hoa-long',
      excerpt: 'Sự kiện giới thiệu concept liên minh và những trận chiến đầu tiên trong Vương Triều Hỏa Long.',
      content: '# Khải hỏa liên minh Hỏa Long\n\nCác vương triều sẽ lần đầu gặp nhau trong một bản đồ thử nghiệm tập trung vào liên minh, tiếp tế và phòng thủ.\n\nHãy theo dõi các bài viết phát triển để hiểu thêm về vai trò của rồng trong chiến trường.\n\nSự kiện chỉ mang tính giới thiệu concept, chưa phải bản chơi thử chính thức.',
      coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-20T00:00:00.000Z'),
      endsAt: new Date('2026-10-05T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Khải hỏa liên minh Hỏa Long',
      seoDescription: 'Sự kiện concept của Vương Triều Hỏa Long.',
      gameId: gameIds.get('vuong-trieu-hoa-long') ?? null,
    },
    {
      title: 'Orion Training Simulation',
      slug: 'orion-training-simulation',
      excerpt: 'Mở khóa hồ sơ chiến thuật và khám phá cách các vai trò phối hợp trong chiến tuyến Orion.',
      content: '# Orion Training Simulation\n\nBài mô phỏng huấn luyện đầu tiên giới thiệu ba vai trò Recon, Assault và Support.\n\nNgười chơi có thể theo dõi các tình huống mẫu và lựa chọn vị trí phù hợp với phong cách của mình.\n\nThông tin bản build sẽ chỉ được công bố khi dự án bước vào giai đoạn thử nghiệm.',
      coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-10-05T00:00:00.000Z'),
      endsAt: new Date('2026-10-20T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Orion Training Simulation',
      seoDescription: 'Sự kiện concept của Chiến Tuyến Orion.',
      gameId: gameIds.get('chien-tuyen-orion') ?? null,
    },
    {
      title: 'Khảo sát cộng đồng Season 6',
      slug: 'khao-sat-cong-dong-season-6',
      excerpt: 'Khảo sát đã kết thúc về những ký ức và hệ thống người chơi muốn thấy trong Lục Địa Đam Mê.',
      content: '# Khảo sát cộng đồng Season 6\n\nCảm ơn cộng đồng đã chia sẻ những ký ức về Season 6 và các mong muốn cho phiên bản mới.\n\nĐội ngũ đang tổng hợp phản hồi để ưu tiên các hệ thống phù hợp với định hướng xây dựng lại thế giới.\n\nKết quả chi tiết sẽ được chia sẻ trong một development update sắp tới.',
      coverImageUrl: '/images/games/luc-dia-dam-me/nhan_vat.png',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-10T23:59:59.000Z'),
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      seoTitle: 'Khảo sát cộng đồng Season 6',
      seoDescription: 'Kết quả hoạt động khảo sát cộng đồng ZENX GO.',
      gameId: null,
    },
    {
      title: 'Cloud Town Sketchbook',
      slug: 'cloud-town-sketchbook',
      excerpt: 'Bộ sưu tập phác thảo đầu tiên của Thị Trấn Mây đã được mở xem trong thời gian giới hạn.',
      content: '# Cloud Town Sketchbook\n\nBộ sketchbook giới thiệu các ý tưởng về khu vườn, quảng trường và những chuyến khinh khí cầu trên mây.\n\nHoạt động đã khép lại nhưng các bản phác thảo nổi bật vẫn được lưu trong nhật ký phát triển của game.\n\nCảm ơn mọi người đã góp ý cho hướng nghệ thuật ấm áp của thị trấn.',
      coverImageUrl: '/images/games/thi-tran-may/detail-v1/garden.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-05T00:00:00.000Z'),
      endsAt: new Date('2026-08-20T23:59:59.000Z'),
      publishedAt: new Date('2026-08-05T00:00:00.000Z'),
      seoTitle: 'Cloud Town Sketchbook',
      seoDescription: 'Bộ phác thảo concept của Thị Trấn Mây.',
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
