'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import type { GameItem } from '@/lib/games-data';

export function HomeFooter({ games = [] }: { games?: GameItem[] }) {
  return (
    <footer id="community" className="w-full border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Info & Socials (4 columns) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <BrandLogo href="/" variant="dark" />
              <p className="mt-4 text-xs leading-relaxed text-slate-400 max-w-sm">
                ZENX GO là cổng game thế hệ mới nơi bạn khám phá nhiều thế giới, kết nối cộng đồng và trải nghiệm những cuộc phiêu lưu tuyệt vời.
              </p>
            </div>

            {/* Social Icons (Sleek & Minimalist) */}
            <div className="mt-6 flex items-center gap-2.5">
              {/* Discord */}
              <SocialLink
                href={process.env.NEXT_PUBLIC_DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                aria-label="Discord"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </SocialLink>

              {/* Facebook */}
              <SocialLink
                href={process.env.NEXT_PUBLIC_FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                aria-label="Facebook"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </SocialLink>

              {/* YouTube */}
              <SocialLink
                href={process.env.NEXT_PUBLIC_YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                aria-label="YouTube"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </SocialLink>

              {/* TikTok */}
              <SocialLink
                href={process.env.NEXT_PUBLIC_TIKTOK_URL}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                aria-label="TikTok"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* 4 Nav Columns (8 columns) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* Column 1: Games */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
                Trò chơi
              </h4>
              <ul className="space-y-2.5">
                {games.map((game) => (
                  <li key={game.id}>
                    <a href={game.websiteUrl} className="hover:text-[#00873E] transition-colors">
                      {game.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Account */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
                Tài khoản
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/auth/login" className="hover:text-[#00873E] transition-colors">
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-[#00873E] transition-colors">
                    Đăng ký
                  </Link>
                </li>
                <li>
                  <Link href="/payment" className="hover:text-[#00873E] transition-colors">
                    Ví ZENX Coin
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-[#00873E] transition-colors">
                    Lịch sử giao dịch
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
                Hỗ trợ
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/support" className="hover:text-[#00873E] transition-colors">
                    Trung tâm hỗ trợ
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-[#00873E] transition-colors">
                    Báo lỗi
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-[#00873E] transition-colors">
                    Trạng thái dịch vụ
                  </Link>
                </li>
                <li>
                  <Link href="mailto:support@zenxgo.vn" className="hover:text-[#00873E] transition-colors">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
                Pháp lý
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/terms" className="hover:text-[#00873E] transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#00873E] transition-colors">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#00873E] transition-colors">
                    Quy tắc trò chơi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#00873E] transition-colors">
                    Thông tin giấy phép
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Health Warning & Copyright */}
      <div className="border-t border-slate-900 bg-slate-950/80 px-4 sm:px-6 lg:px-8 py-5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
          <p>Chơi game quá 180 phút mỗi ngày có thể ảnh hưởng đến sức khỏe.</p>
          <p>© 2026 ZENX GO. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, children, target, rel, className, 'aria-label': ariaLabel }: {
  href?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  className?: string;
  'aria-label': string;
}) {
  if (!href) return null;
  return <a href={href} target={target} rel={rel} className={className} aria-label={ariaLabel}>{children}</a>;
}
