import { AppShell } from "@/components/app-shell";

export default function PaymentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
