import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  className,
  compact = false,
  variant = "light",
}: {
  href?: string;
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const logoSrc = variant === "dark" ? "/images/logo-white.png" : "/images/logo.png";

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center select-none shrink-0", className)}
      aria-label="ZENX GO"
    >
      <img
        src={logoSrc}
        alt="ZENX GO"
        className={cn(
          "object-contain transition-all",
          compact
            ? "h-7 sm:h-9 w-auto max-w-[120px] sm:max-w-[165px]"
            : "h-8 sm:h-12 w-auto max-w-[135px] sm:max-w-[195px]"
        )}
      />
    </Link>
  );
}
