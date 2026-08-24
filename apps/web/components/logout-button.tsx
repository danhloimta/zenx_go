"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
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
    <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
      <LogOut className="mr-2 size-4" />
      {logout.isPending ? "Đang thoát…" : "Đăng xuất"}
    </Button>
  );
}
