import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className,
      )}
      {...props}
    />
  );
});
