'use client';

import Link from 'next/link';
import { ArrowRight, Download, MessageCircle } from 'lucide-react';
import { useGame } from '@/components/game/game-context';
import { portalUrl } from '@/lib/domain';

export default function DownloadPage() {
  const game = useGame();
  const downloadsReady = game.featureConfig.downloads === true;
  return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Tải game</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">{downloadsReady ? 'Chọn nền tảng của bạn' : 'Sẵn sàng cho ngày ra mắt'}</h1><p className="mt-5 max-w-2xl leading-7 opacity-70">{game.name} đang được chuẩn bị trên các nền tảng dưới đây. Khi có bản tải chính thức, thông tin phiên bản, dung lượng và yêu cầu hệ thống sẽ được cập nhật tại trang này.</p><div className="mt-10 grid gap-5 sm:grid-cols-3">{game.platforms.map((platform) => <div key={platform} className="rounded-2xl border border-black/10 bg-white/55 p-6"><Download className="size-6 text-[var(--game-primary)]" /><h2 className="mt-6 text-xl font-bold">{platform}</h2><p className="mt-2 text-sm opacity-65">{downloadsReady ? 'Sẵn sàng tải' : 'COMING SOON'}</p>{downloadsReady ? <Link href={portalUrl('/support')} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--game-primary)]">Xem hướng dẫn <ArrowRight className="size-4" /></Link> : <span className="mt-6 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold opacity-60">Chưa mở tải</span>}</div>)}</div><div className="mt-10 rounded-2xl border border-black/10 bg-black/[0.03] p-6"><div className="flex items-start gap-3"><MessageCircle className="mt-0.5 size-5 text-[var(--game-primary)]" /><div><h2 className="font-bold">Nhận thông báo khi có bản tải</h2><p className="mt-2 text-sm leading-6 opacity-70">Đăng nhập ZENX GO và theo dõi tin tức để nhận thông báo về lịch thử nghiệm và phát hành.</p><Link href={portalUrl('/auth/register')} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--game-primary)]">Tạo tài khoản <ArrowRight className="size-4" /></Link></div></div></div></div>;
}
