import { GameAdminShell } from '@/components/game-admin-shell';

export default function GameAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <GameAdminShell>{children}</GameAdminShell>; }
