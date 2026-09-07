import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E] border border-emerald-100 shadow-xs">
        <Loader2 className="size-5 animate-spin" />
      </div>
      <p className="text-xs font-medium text-slate-500">Đang tải dữ liệu…</p>
    </div>
  );
}
