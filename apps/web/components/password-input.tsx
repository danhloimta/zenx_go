"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 disabled:bg-slate-50 disabled:text-slate-400",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:text-slate-600"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
