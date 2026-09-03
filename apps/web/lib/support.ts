export const supportStatusLabels: Record<string, string> = {
  NEW: 'Mới tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_USER: 'Chờ phản hồi',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

export const supportPriorityLabels: Record<string, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export function supportStatusLabel(status: string) {
  return supportStatusLabels[status] ?? status;
}

export function supportPriorityLabel(priority?: string | null) {
  return (priority && supportPriorityLabels[priority]) ?? priority ?? 'Bình thường';
}

export function supportStatusClass(status: string) {
  return (
    (
      {
        NEW: 'bg-blue-50 text-blue-700',
        IN_PROGRESS: 'bg-amber-50 text-amber-700',
        WAITING_USER: 'bg-violet-50 text-violet-700',
        RESOLVED: 'bg-emerald-50 text-emerald-700',
        CLOSED: 'bg-slate-100 text-slate-600',
      } as Record<string, string>
    )[status] ?? 'bg-slate-100 text-slate-600'
  );
}

export function supportPriorityClass(priority?: string | null) {
  return (
    (
      {
        LOW: 'bg-slate-100 text-slate-600',
        NORMAL: 'bg-blue-50 text-blue-700',
        HIGH: 'bg-amber-50 text-amber-700',
        URGENT: 'bg-red-50 text-red-700',
      } as Record<string, string>
    )[priority ?? 'NORMAL'] ?? 'bg-blue-50 text-blue-700'
  );
}
