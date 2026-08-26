import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CoinPackageStatus, SupportStatus } from '../src/common/domain';

const prisma = new PrismaClient();

async function main() {
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
