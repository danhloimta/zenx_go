import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  onCheckedChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
}) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 rounded border-slate-300 text-[#00873E] accent-[#00873E] focus:ring-[#00873E]/20 cursor-pointer",
        className,
      )}
      onChange={(e) => {
        if (onCheckedChange) onCheckedChange(e.target.checked);
      }}
      {...props}
    />
  );
}
