import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="ml-1 text-red-500 font-semibold" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
