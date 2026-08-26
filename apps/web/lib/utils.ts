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

export const bankNameMap: Record<string, string> = {
  MB: 'MBBank (Ngân hàng Quân Đội)',
  MBBANK: 'MBBank (Ngân hàng Quân Đội)',
  '970422': 'MBBank (Ngân hàng Quân Đội)',

  VCB: 'Vietcombank (Ngoại thương Việt Nam)',
  VIETCOMBANK: 'Vietcombank (Ngoại thương Việt Nam)',
  '970436': 'Vietcombank (Ngoại thương Việt Nam)',

  TCB: 'Techcombank (Kỹ thương Việt Nam)',
  TECHCOMBANK: 'Techcombank (Kỹ thương Việt Nam)',
  '970407': 'Techcombank (Kỹ thương Việt Nam)',

  ICB: 'VietinBank (Công thương Việt Nam)',
  VIETINBANK: 'VietinBank (Công thương Việt Nam)',
  CTG: 'VietinBank (Công thương Việt Nam)',
  '970415': 'VietinBank (Công thương Việt Nam)',

  BIDV: 'BIDV (Đầu tư và Phát triển Việt Nam)',
  '970418': 'BIDV (Đầu tư và Phát triển Việt Nam)',

  VPB: 'VPBank (Việt Nam Thịnh Vượng)',
  VPBANK: 'VPBank (Việt Nam Thịnh Vượng)',
  '970432': 'VPBank (Việt Nam Thịnh Vượng)',

  ACB: 'ACB (Á Châu)',
  '970416': 'ACB (Á Châu)',

  TPB: 'TPBank (Tiên Phong)',
  TPBANK: 'TPBank (Tiên Phong)',
  '970423': 'TPBank (Tiên Phong)',

  STB: 'Sacombank (Sài Gòn Thương Tín)',
  SACOMBANK: 'Sacombank (Sài Gòn Thương Tín)',
  '970403': 'Sacombank (Sài Gòn Thương Tín)',

  VIB: 'VIB (Quốc Tế Việt Nam)',
  '970441': 'VIB (Quốc Tế Việt Nam)',

  SHB: 'SHB (Sài Gòn - Hà Nội)',
  '970443': 'SHB (Sài Gòn - Hà Nội)',

  OCB: 'OCB (Phương Đông)',
  '970448': 'OCB (Phương Đông)',

  MSB: 'MSB (Hàng Hải Việt Nam)',
  '970426': 'MSB (Hàng Hải Việt Nam)',

  HDB: 'HDBank (Phát triển TP.HCM)',
  HDBANK: 'HDBank (Phát triển TP.HCM)',
  '970437': 'HDBank (Phát triển TP.HCM)',

  LPB: 'LPBank (Lộc Phát Việt Nam)',
  LPBANK: 'LPBank (Lộc Phát Việt Nam)',
  LIENVIETPOSTBANK: 'LPBank (Lộc Phát Việt Nam)',
  '970449': 'LPBank (Lộc Phát Việt Nam)',

  SEAB: 'SeABank (Đông Nam Á)',
  SEABANK: 'SeABank (Đông Nam Á)',
  '970440': 'SeABank (Đông Nam Á)',

  ABB: 'ABBank (An Bình)',
  ABBANK: 'ABBank (An Bình)',
  '970425': 'ABBank (An Bình)',

  NAB: 'Nam A Bank (Nam Á)',
  NAMABANK: 'Nam A Bank (Nam Á)',
  '970428': 'Nam A Bank (Nam Á)',

  BAB: 'Bac A Bank (Bắc Á)',
  BACABANK: 'Bac A Bank (Bắc Á)',
  '970409': 'Bac A Bank (Bắc Á)',

  VAB: 'VietABank (Việt Á)',
  VIETABANK: 'VietABank (Việt Á)',
  '970427': 'VietABank (Việt Á)',

  NCB: 'NCB (Quốc Dân)',
  '970419': 'NCB (Quốc Dân)',

  KLB: 'Kienlongbank (Kiên Long)',
  KIENLONGBANK: 'Kienlongbank (Kiên Long)',
  '970452': 'Kienlongbank (Kiên Long)',

  BVB: 'BaoViet Bank (Bảo Việt)',
  BAOVIETBANK: 'BaoViet Bank (Bảo Việt)',
  '970438': 'BaoViet Bank (Bảo Việt)',

  PVB: 'PVcomBank (Đại Chúng Việt Nam)',
  PVCB: 'PVcomBank (Đại Chúng Việt Nam)',
  PVCOMBANK: 'PVcomBank (Đại Chúng Việt Nam)',
  '970412': 'PVcomBank (Đại Chúng Việt Nam)',

  SGB: 'Saigonbank (Sài Gòn Công Thương)',
  SAIGONBANK: 'Saigonbank (Sài Gòn Công Thương)',
  '970400': 'Saigonbank (Sài Gòn Công Thương)',

  PGB: 'PGBank (Thịnh vượng và Phát triển)',
  PGBANK: 'PGBank (Thịnh vượng và Phát triển)',
  '970430': 'PGBank (Thịnh vượng và Phát triển)',

  GPB: 'GPBank (Dầu Khí Toàn Cầu)',
  GPBANK: 'GPBank (Dầu Khí Toàn Cầu)',
  '970408': 'GPBank (Dầu Khí Toàn Cầu)',

  OCEANBANK: 'OceanBank (Đại Dương)',
  '970414': 'OceanBank (Đại Dương)',

  VRB: 'VRB (Liên doanh Việt - Nga)',
  '970421': 'VRB (Liên doanh Việt - Nga)',

  COOPBANK: 'Co-opBank (Hợp tác xã Việt Nam)',
  '970446': 'Co-opBank (Hợp tác xã Việt Nam)',

  SCB: 'SCB (Sài Gòn)',
  '970429': 'SCB (Sài Gòn)',

  TIMO: 'Timo (Ngân hàng số Timo)',
  '963388': 'Timo (Ngân hàng số Timo)',

  CAKE: 'CAKE by VPBank',
  '546034': 'CAKE by VPBank',

  VIETTELMONEY: 'Viettel Money',
  '971005': 'Viettel Money',

  VNPTMONEY: 'VNPT Money',
  '971011': 'VNPT Money',

  WOO: 'Woori Bank Việt Nam',
  WOORI: 'Woori Bank Việt Nam',
  '970457': 'Woori Bank Việt Nam',

  SHBVN: 'Shinhan Bank Việt Nam',
  SHINHAN: 'Shinhan Bank Việt Nam',
  '970424': 'Shinhan Bank Việt Nam',

  PBVN: 'Public Bank Vietnam',
  PUBLICBANK: 'Public Bank Vietnam',
  '970439': 'Public Bank Vietnam',

  HSBC: 'HSBC Việt Nam',
  '458761': 'HSBC Việt Nam',

  SCVN: 'Standard Chartered Việt Nam',
  STANDARDCHARTERED: 'Standard Chartered Việt Nam',
  '970410': 'Standard Chartered Việt Nam',

  UOB: 'UOB Việt Nam',
  '970458': 'UOB Việt Nam',

  CIMB: 'CIMB Bank Việt Nam',
  '422589': 'CIMB Bank Việt Nam',

  HLBVN: 'Hong Leong Bank Việt Nam',
  HONGLEONG: 'Hong Leong Bank Việt Nam',
  '970442': 'Hong Leong Bank Việt Nam',

  IVB: 'Indovina Bank',
  INDOVINA: 'Indovina Bank',
  '970434': 'Indovina Bank',
};

export function getBankName(code?: string | null): string {
  if (!code || code === '—') return '—';
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return bankNameMap[normalized] || bankNameMap[code.trim()] || code;
}
