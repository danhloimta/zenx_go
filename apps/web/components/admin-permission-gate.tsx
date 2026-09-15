'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAbility } from '@/lib/admin-ability';

const routePermissions: Array<{ prefix: string; action: string; subject: string }> = [
  { prefix: '/admin/settings', action: 'manage', subject: 'AuthSettings' },
  { prefix: '/admin/content/genres', action: 'manage', subject: 'Genre' },
  { prefix: '/admin/content/articles', action: 'manage', subject: 'Article' },
  { prefix: '/admin/content/events', action: 'manage', subject: 'Event' },
  { prefix: '/admin/content/announcements', action: 'manage', subject: 'Announcement' },
  { prefix: '/admin/content/games', action: 'read', subject: 'Game' },
  { prefix: '/admin/content', action: 'read', subject: 'ContentDashboard' },
  { prefix: '/admin/finance/packages', action: 'manage', subject: 'CoinPackage' },
  { prefix: '/admin/finance/payments', action: 'read', subject: 'Payment' },
  { prefix: '/admin/finance/transactions', action: 'read', subject: 'WalletTransaction' },
  { prefix: '/admin/finance', action: 'read', subject: 'FinanceDashboard' },
  { prefix: '/admin/support/faqs', action: 'manage', subject: 'SupportFaq' },
  { prefix: '/admin/support/tickets', action: 'read', subject: 'SupportTicket' },
  { prefix: '/admin/users', action: 'read', subject: 'User' },
  { prefix: '/admin/access', action: 'read', subject: 'Role' },
  { prefix: '/admin/support', action: 'read', subject: 'SupportDashboard' },
];

export function AdminPermissionGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const ability = useAdminAbility();
  const required = routePermissions.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`));
  const denied = Boolean(required && !ability.can(required.action, required.subject));
  const redirectDeniedSettings = denied && required?.subject === 'AuthSettings';
  useEffect(() => {
    if (!redirectDeniedSettings) return;
    router.replace(ability.can('read', 'SupportDashboard') ? '/admin/support' : '/admin');
  }, [ability, redirectDeniedSettings, router]);
  if (denied) {
    return <main className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Bạn không có quyền truy cập màn hình này.</main>;
  }
  return <>{children}</>;
}
