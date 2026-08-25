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
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "SUCCESS"
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
