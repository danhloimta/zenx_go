import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-white px-6 text-center"><Inbox className="size-8 text-slate-300" /><p className="mt-3 font-medium">{title}</p>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>;
}
