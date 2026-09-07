import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function PageFooter({ app = false }: { app?: boolean }) {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white text-slate-600 text-xs">
      <div
        className={
          app
            ? 'px-5 py-10 sm:px-8 lg:px-10'
            : 'mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Info & Summary */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <BrandLogo href="/" variant="light" compact />
              <p className="mt-3 text-xs leading-relaxed text-slate-500 max-w-sm">
                Nền tảng quản lý tài khoản game, nạp ZENX Coin và bảo mật thông tin game thủ thế hệ mới.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">
              <p>
                Hotline hỗ trợ: <span className="text-slate-800 font-bold">1900 6868</span> (8:00 - 22:00)
              </p>
              <p className="mt-0.5">
                Email:{' '}
                <a href="mailto:support@zenxgo.vn" className="text-[#00873E] font-semibold hover:underline">
                  support@zenxgo.vn
                </a>
              </p>
            </div>
          </div>

          {/* Nav Columns (8 columns) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* Column 1: Hỗ trợ (Theo mẫu trang chủ) */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
                Hỗ trợ
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/support" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Trung tâm hỗ trợ
                  </Link>
                </li>
                <li>
                  <Link href="/support/report-issue" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Báo lỗi
                  </Link>
                </li>
                <li>
                  <Link href="/account/support" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Yêu cầu của tôi
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@zenxgo.vn" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Pháp lý (Theo mẫu trang chủ) */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
                Pháp lý
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/terms" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Quy tắc trò chơi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Thông tin giấy phép
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Tài khoản & Ví (Tối ưu cho thành viên đăng nhập) */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
                Tài khoản & Ví
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/account/profile" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Hồ sơ cá nhân
                  </Link>
                </li>
                <li>
                  <Link href="/account/security" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Bảo mật tài khoản
                  </Link>
                </li>
                <li>
                  <Link href="/payment" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Nạp ZENX Coin
                  </Link>
                </li>
                <li>
                  <Link href="/wallet/transactions" className="text-slate-600 hover:text-[#00873E] transition-colors">
                    Lịch sử giao dịch
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-5 sm:px-8 lg:px-10 py-3.5">
        <div
          className={
            app
              ? 'flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500'
              : 'mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500'
          }
        >
          <p>Chơi game quá 180 phút mỗi ngày có thể ảnh hưởng đến sức khỏe.</p>
          <p>© 2026 ZENX GO. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
