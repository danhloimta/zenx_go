import { AdminShell } from '@/components/admin-shell';
import { AdminPermissionGate } from '@/components/admin-permission-gate';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell><AdminPermissionGate>{children}</AdminPermissionGate></AdminShell>;
}
