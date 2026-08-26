import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  SUCCESS: "Thành công",
  PENDING: "Đang xử lý",
  FAILED: "Thất bại",
  REVERSED: "Đã đảo",
  CREATED: "Đã tạo",
  EXPIRED: "Đã hết hạn",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn",
  NEW: "Mới tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        ["SUCCESS", "RESOLVED", "CLOSED"].includes(status)
          ? "success"
          : ["FAILED", "EXPIRED", "CANCELLED", "REVERSED"].includes(status)
          ? "destructive"
          : "warning"
      }
    >
      {labels[status] ?? status}
    </Badge>
  );
}
