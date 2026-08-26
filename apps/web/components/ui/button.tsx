import Link from "next/link";
import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "zenx-outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  default: "bg-[#00873E] text-white shadow-sm hover:bg-[#007234]",
  outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  "zenx-outline": "border border-[#00873E] bg-white text-[#00873E] hover:bg-[#E8F7EC]",
  secondary: "bg-[#E8F7EC] text-[#00873E] hover:bg-[#D9F2DF]",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-11 px-5 py-2 text-sm",
  sm: "h-9 rounded-lg px-3.5 text-xs font-medium",
  lg: "h-12 rounded-lg px-8 text-base",
  icon: "size-10 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function Button({ className, variant = "default", size = "default", asChild, ...props }: ButtonProps) {
  if (asChild) {
    const child = props.children as ReactNode;
    if (isValidElement<{ className?: string }>(child)) {
      return cloneElement(child, {
        className: cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/20 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
          child.props.className,
        ),
      });
    }
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/20 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "default",
  size = "default",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/20",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
