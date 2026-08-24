export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatAmount(value: number | string, suffix = "") {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isNaN(numeric)) {
    return `${new Intl.NumberFormat("vi-VN").format(numeric)}${suffix}`;
  }

  return `${value}${suffix}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
