import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CoinPackageStatus, SupportStatus } from '../src/common/domain';

const prisma = new PrismaClient();

async function main() {
  await seedGames();

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
      heroDesktopUrl: '/images/games/luc-dia-dam-me/hero-desktop.webp', heroMobileUrl: '/images/games/luc-dia-dam-me/hero-mobile.webp',
      coverUrl: '/images/games/luc-dia-dam-me/key-art.png', iconUrl: '/images/games/luc-dia-dam-me/avatar.webp', logoUrl: '/images/games/luc-dia-dam-me/avatar.webp',
      theme: { primary: '#54796f', secondary: '#778fa0', surface: '#edf2f3', text: '#203236', heading: 'serif', body: 'sans-serif', radius: 'medium', motion: 'subtle' },
      features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'PLATFORM_CARDS', 'ROADMAP_PREVIEW', 'ARTICLE_GRID', 'DEVELOPMENT_PROGRESS', 'MEDIA_GALLERY', 'COMMUNITY_CTA'], downloads: 'COMING_SOON', servers: false, leaderboard: false, giftcode: false, gameTopup: false },
      articles: [
        { title: 'Không gian gameplay là ưu tiên', slug: 'khong-gian-gameplay-la-uu-tien', excerpt: 'Mỗi khung hình của Lục Địa Đam Mê được xây dựng để thế giới và nhân vật luôn là tâm điểm.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/hero-desktop.webp', content: '# Không gian gameplay là ưu tiên\n\nChúng tôi đang tập trung vào cảm giác khám phá và khả năng đọc thế giới trong từng khung hình.\n\n- Giữ nhân vật ở trung tâm trải nghiệm\n- Làm rõ không gian chiến đấu\n- Tối ưu trải nghiệm trên PC, Mobile và Web', publishedAt: new Date('2026-09-01T08:00:00Z') },
        { title: 'World Remake', slug: 'world-remake', excerpt: 'Lộ trình đại tu môi trường mở và kiến trúc thành trì giữa mây.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/key-art.png', content: '# World Remake\n\nLục địa đang được dựng lại từ nền móng, với ánh sáng, địa hình và các khu vực khám phá mới.', publishedAt: new Date('2026-08-28T08:00:00Z') },
        { title: 'Character Update', slug: 'character-update', excerpt: 'Hướng tiếp cận mới cho tạo hình và hành trình của nhân vật.', category: 'DEVELOPMENT_UPDATE', coverImageUrl: '/images/games/luc-dia-dam-me/avatar.webp', content: '# Character Update\n\nNhân vật được thiết kế để vừa giữ lại ký ức MU Classic vừa có diện mạo hiện đại hơn.', publishedAt: new Date('2026-08-25T08:00:00Z') },
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
      theme: { primary: '#9b4938', secondary: '#c89254', surface: '#1e1b1c', text: '#fff4df', heading: 'display-serif', body: 'sans-serif', radius: 'small', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'COMMUNITY_CTA'], demo: true }, articles: [], milestones: [],
    },
    {
      code: 'TTM', name: 'Thị Trấn Mây', slug: 'thi-tran-may', subdomain: 'thitranmay', recordType: 'DEMO',
      tagline: 'Xây một góc nhỏ trên những tầng mây.', shortDescription: 'Concept casual mô phỏng về một thị trấn bình yên giữa tầng mây.', longDescription: null,
      lifecycleStatus: 'CONCEPT', operationalStatus: 'AVAILABLE', releaseYear: null, themePreset: 'PLAYFUL_CASUAL', featured: false, primaryGame: false, isPublic: publishDemos, sortOrder: 3,
      genres: ['CASUAL', 'SIMULATION'], platforms: ['MOBILE', 'WEB'], heroDesktopUrl: '/images/games/thi-tran-may/hero-desktop.webp', heroMobileUrl: '/images/games/thi-tran-may/hero-mobile.webp', coverUrl: '/images/games/thi-tran-may/key-art.png', iconUrl: '/images/games/thi-tran-may/avatar.webp', logoUrl: '/images/games/thi-tran-may/avatar.webp',
      theme: { primary: '#69bce8', secondary: '#f6c958', surface: '#fffdf7', text: '#193b5a', heading: 'rounded-sans', body: 'sans-serif', radius: 'large', motion: 'playful' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'COMMUNITY_CTA'], demo: true }, articles: [], milestones: [],
    },
    {
      code: 'CTO', name: 'Chiến Tuyến Orion', slug: 'chien-tuyen-orion', subdomain: 'orion', recordType: 'DEMO',
      tagline: 'Biệt đội tinh nhuệ bảo vệ thuộc địa không gian.', shortDescription: 'Concept tactical shooter khoa học viễn tưởng về biệt đội Orion và những chiến tuyến ngoài không gian.', longDescription: null,
      lifecycleStatus: 'CONCEPT', operationalStatus: 'AVAILABLE', releaseYear: null, themePreset: 'SCI_FI_SHOOTER', featured: false, primaryGame: false, isPublic: publishDemos, sortOrder: 4,
      genres: ['SHOOTER'], platforms: ['PC', 'MOBILE'], heroDesktopUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp', heroMobileUrl: '/images/games/chien-tuyen-orion/hero-mobile.webp', coverUrl: '/images/games/chien-tuyen-orion/key-art.png', iconUrl: '/images/games/chien-tuyen-orion/avatar.webp', logoUrl: '/images/games/chien-tuyen-orion/avatar.webp',
      theme: { primary: '#6c8cff', secondary: '#57d7ff', surface: '#0b1224', text: '#e8f0ff', heading: 'display-sans', body: 'sans-serif', radius: 'medium', motion: 'cinematic' }, features: { sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'COMMUNITY_CTA'], demo: true }, articles: [], milestones: [],
    },
  ] as const;

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { code: gameData.code },
      update: {
        name: gameData.name, slug: gameData.slug, subdomain: gameData.subdomain, recordType: gameData.recordType, tagline: gameData.tagline, shortDescription: gameData.shortDescription, longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus, operationalStatus: gameData.operationalStatus, releaseYear: gameData.releaseYear, themePreset: gameData.themePreset, themeConfig: JSON.stringify(gameData.theme), featureConfig: JSON.stringify(gameData.features), logoUrl: gameData.logoUrl, iconUrl: gameData.iconUrl, coverUrl: gameData.coverUrl, heroDesktopUrl: gameData.heroDesktopUrl, heroMobileUrl: gameData.heroMobileUrl, featured: gameData.featured, primaryGame: gameData.primaryGame, isPublic: gameData.isPublic, sortOrder: gameData.sortOrder,
      },
      create: {
        code: gameData.code, name: gameData.name, slug: gameData.slug, subdomain: gameData.subdomain, recordType: gameData.recordType, tagline: gameData.tagline, shortDescription: gameData.shortDescription, longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus, operationalStatus: gameData.operationalStatus, releaseYear: gameData.releaseYear, themePreset: gameData.themePreset, themeConfig: JSON.stringify(gameData.theme), featureConfig: JSON.stringify(gameData.features), logoUrl: gameData.logoUrl, iconUrl: gameData.iconUrl, coverUrl: gameData.coverUrl, heroDesktopUrl: gameData.heroDesktopUrl, heroMobileUrl: gameData.heroMobileUrl, featured: gameData.featured, primaryGame: gameData.primaryGame, isPublic: gameData.isPublic, sortOrder: gameData.sortOrder,
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
