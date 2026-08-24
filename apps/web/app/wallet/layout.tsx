import { AppShell } from "@/components/app-shell";

export default function WalletLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
