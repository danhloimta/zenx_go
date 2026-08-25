import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "zenx";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  secondary: "bg-[#E8F7EC] text-[#00873E]",
  success: "bg-[#E8F7EC] text-[#00873E]",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-600",
  zenx: "bg-[#00873E] text-white",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold select-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
