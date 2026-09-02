import type { Metadata } from 'next';
import { getPortalGames } from '@/lib/game-api';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { SupportPageClient } from '@/components/portal/support-page-client';

export const metadata: Metadata = {
  title: 'Trung tâm hỗ trợ khách hàng 24/7 | ZENX GO',
  description: 'Tìm kiếm câu trả lời nhanh chóng và gửi yêu cầu hỗ trợ về tài khoản, nạp Coin, bảo mật trong hệ sinh thái game ZENX GO.',
};

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const games = await getPortalGames();
  return (
    <PortalPageLayout games={games}>
      <SupportPageClient />
    </PortalPageLayout>
  );
}
