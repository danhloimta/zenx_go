"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "zenx-outline";
}) {
  const router = useRouter();
  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      router.push("/auth/login");
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Button
      variant={variant}
      size="sm"
      className={className || "text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors h-9 px-3 rounded-xl"}
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      <LogOut className="size-4" />
      <span>{logout.isPending ? "Đang thoát…" : "Đăng xuất"}</span>
    </Button>
  );
}
