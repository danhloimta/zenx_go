import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  className,
  compact = false,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center select-none shrink-0", className)}
      aria-label="ZENX GO"
    >
      <img
        src="/images/logo.png"
        alt="ZENX GO"
        className={cn(
          "object-contain transition-all",
          compact ? "h-10 sm:h-11 w-auto max-w-[165px]" : "h-12 sm:h-14 w-auto max-w-[195px]"
        )}
      />
    </Link>
  );
}
