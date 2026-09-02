'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Headphones,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { ZenxCoinGoldIcon } from '@/components/icons';
import { GameItem } from '@/lib/games-data';

export function EcosystemSection({ games }: { games: GameItem[] }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200/80 text-[#00873E] shadow-2xs mb-3.5">
          <Globe2 className="size-3.5" />
          HỆ SINH THÁI ZENX GO
        </span>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Một tài khoản. Nhiều thế giới.
        </h2>

        <p className="mt-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
          Trải nghiệm hệ sinh thái game liền mạch với một lần đăng nhập duy nhất, ví tiền dùng chung và hệ thống bảo mật toàn diện.
        </p>
      </div>

      {/* 4 Light Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Single Sign-On (SSO) */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-[#00873E]/40 hover:-translate-y-1 transition-all duration-300">
          <div>
            {/* Icon */}
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E] border border-emerald-100 group-hover:scale-110 transition-transform mb-5">
              <UserCheck className="size-6" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase block mb-1">
              Định danh toàn cầu
            </span>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
              Một Tài Khoản (SSO)
            </h3>

            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Đăng nhập một lần để tham gia tất cả tựa game. Tự động lưu tiến độ, bảng xếp hạng và bạn bè xuyên game.
            </p>
          </div>

          {/* Connected Games Badge Row */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Các game kết nối:
            </p>
            <div className="flex -space-x-1.5 items-center">
              {games.map((game) => (
                <a
                  key={game.id}
                  href={game.websiteUrl}
                  aria-label={`Mở trang chủ ${game.title}`}
                  className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E] focus-visible:ring-offset-1"
                >
                  <img
                    src={game.assets.avatar}
                    alt={game.title}
                    title={game.title}
                    className="size-7 rounded-full object-cover border-2 border-white ring-1 ring-slate-200"
                  />
                </a>
              ))}
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-[#00873E] text-[10px] font-bold border-2 border-white ring-1 ring-emerald-200">
                {games.length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Shared Coin Wallet */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-300">
          <div>
            {/* Icon */}
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 group-hover:scale-110 transition-transform mb-5">
              <ZenxCoinGoldIcon className="size-7" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase block mb-1">
              Thanh toán tập trung
            </span>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
              Ví ZENX Coin
            </h3>

            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Nạp một lần qua VietQR siêu tốc 24/7. Sử dụng số dư mua vật phẩm, trang phục và Battle Pass trong mọi game.
            </p>
          </div>

          {/* Action Link */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/payment"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
            >
              <span>Nạp Coin ngay</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card 3: 2FA Bank-Grade Security */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300">
          <div>
            {/* Icon */}
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 group-hover:scale-110 transition-transform mb-5">
              <ShieldCheck className="size-6" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-sky-600 uppercase block mb-1">
              Bảo vệ tài sản
            </span>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
              Bảo Mật 2 Lớp (2FA)
            </h3>

            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Mã hóa dữ liệu tiêu chuẩn cao cấp, xác thực OTP qua SMS/Email và phát hiện đăng nhập bất thường tức thời.
            </p>
          </div>

          {/* Checklist */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> OTP SMS
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> Mã hóa AES
            </span>
          </div>
        </div>

        {/* Card 4: 24/7 Centralized Support */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300">
          <div>
            {/* Icon */}
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform mb-5">
              <Headphones className="size-6" />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-purple-600 uppercase block mb-1">
              Dịch vụ tận tâm
            </span>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
              Hỗ Trợ Tập Trung 24/7
            </h3>

            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
              Đội ngũ chăm sóc khách hàng hỗ trợ giải quyết sự cố tài khoản, nạp coin và khiếu nại game trong vài phút.
            </p>
          </div>

          {/* Action Link */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              <span>Trung tâm hỗ trợ</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
