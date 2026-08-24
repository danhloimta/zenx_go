export const ACCESS_COOKIE = 'zenx_access';
export const REFRESH_COOKIE = 'zenx_refresh';
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const DECIMAL_FIELDS = [
  'balance',
  'amount',
  'amountVnd',
  'coinAmount',
  'balanceBefore',
  'balanceAfter',
] as const;
