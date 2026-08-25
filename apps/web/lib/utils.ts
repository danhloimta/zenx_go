export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function formatAmount(value: number | string | bigint | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return `—${suffix}`;

  if (typeof value === 'bigint') {
    return `${new Intl.NumberFormat('vi-VN').format(value)}${suffix}`;
  }

  if (typeof value === 'string' && /^[-+]?\d+$/.test(value.trim())) {
    try {
      return `${new Intl.NumberFormat('vi-VN').format(BigInt(value))}${suffix}`;
    } catch {
      // Fall through to the string representation for malformed values.
    }
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric)) {
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}${suffix}`;
  }

  return `${value}${suffix}`;
}

export const transactionTypeLabels: Record<string, string> = {
  TOPUP: 'Nạp Coin',
  CREDIT: 'Cộng Coin',
  DEBIT: 'Trừ Coin',
  REFUND: 'Hoàn Coin',
};

export const paymentMethodLabels: Record<string, string> = {
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CARD: 'Thẻ Visa/Mastercard',
  VIETQR: 'VietQR',
};

export function transactionTypeLabel(type?: string | null) {
  return (type && transactionTypeLabels[type]) || type || 'Giao dịch ZENX';
}

export function paymentMethodLabel(method?: string | null) {
  return (method && paymentMethodLabels[method]) || method || '—';
}

export function isPositiveTransaction(type?: string | null) {
  return type !== 'DEBIT';
}

export function multiplyIntegerAmount(value: number | string | bigint, multiplier: bigint) {
  try {
    const integer = typeof value === 'bigint' ? value : BigInt(String(value));
    return (integer * multiplier).toString();
  } catch {
    return undefined;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
  if (!apiBase.startsWith('http')) return value;
  return `${apiBase.replace(/\/api\/v1\/?$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}
