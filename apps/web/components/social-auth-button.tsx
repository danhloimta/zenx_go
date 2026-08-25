import { GoogleIcon, FacebookIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SocialAuthButton({
  provider,
  href,
  label,
  className,
}: {
  provider: "google" | "facebook";
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/20",
        className,
      )}
    >
      {provider === "google" ? <GoogleIcon className="size-4 shrink-0" /> : <FacebookIcon className="size-4 shrink-0" />}
      <span>{label ?? (provider === "google" ? "Google" : "Facebook")}</span>
    </a>
  );
}
